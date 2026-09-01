"""
KILLER SNAKE — Game Logic (Authoritative Server)
"""
import asyncio
import random
import uuid
from enum import Enum
from typing import Dict, List, Optional, Tuple

WIN_SCORE = 10
ZONE_MAX  = 8   # máximo tiles que puede crecer la zona por lado

PLAYER_COLORS = ["#CF010B", "#2ecc71", "#9b59b6", "#3498db"]  # P1 P2 P3 P4

SPEED_MAP = {
    "easy":   120,
    "medium": 90,
    "hard":    65,
}

def get_corner_config(index: int, grid_size: int):
    configs = [
        {"x": 3,            "y": 3,            "dx": 1,  "dy": 0},
        {"x": grid_size-4,  "y": grid_size-4,  "dx": -1, "dy": 0},
        {"x": grid_size-4,  "y": 3,            "dx": -1, "dy": 0},
        {"x": 3,            "y": grid_size-4,  "dx": 1,  "dy": 0},
    ]
    return configs[index % len(configs)]

class Player:
    def __init__(self, player_id: str, name: str, index: int, ws, solo: bool, grid_size: int):
        self.id       = player_id
        self.name     = name
        self.color    = PLAYER_COLORS[index % len(PLAYER_COLORS)]
        
        if solo:
            self.snake = [
                {"x": grid_size // 2, "y": grid_size // 2},
                {"x": grid_size // 2, "y": grid_size // 2 + 1},
                {"x": grid_size // 2, "y": grid_size // 2 + 2},
            ]
            self.dx    = 0
            self.dy    = 0
        else:
            cfg = get_corner_config(index, grid_size)
            self.snake = [
                {"x": cfg["x"], "y": cfg["y"]},
                {"x": cfg["x"] - cfg["dx"], "y": cfg["y"] - cfg["dy"]},
                {"x": cfg["x"] - cfg["dx"] * 2, "y": cfg["y"] - cfg["dy"] * 2},
            ]
            self.dx    = cfg["dx"]
            self.dy    = cfg["dy"]

        self.score    = 0
        self.alive    = True
        self.ws       = ws
        self.pending_dx: Optional[int] = None
        self.pending_dy: Optional[int] = None

    def apply_input(self, key: str):
        """Aplica dirección sin revertir."""
        moves = {
            "ArrowUp":    ( 0, -1),
            "ArrowDown":  ( 0,  1),
            "ArrowLeft":  (-1,  0),
            "ArrowRight": ( 1,  0),
            "w": ( 0, -1), "s": ( 0,  1),
            "a": (-1,  0), "d": ( 1,  0),
        }
        if key not in moves:
            return
        ndx, ndy = moves[key]
        
        # Prevent reversing when moving
        if (self.dx != 0 or self.dy != 0) and ndx == -self.dx and ndy == -self.dy:
            return
        # Prevent moving into own body when stationary (initial solo spawn)
        elif self.dx == 0 and self.dy == 0 and len(self.snake) > 1:
            next_x, next_y = self.snake[0]["x"] + ndx, self.snake[0]["y"] + ndy
            if next_x == self.snake[1]["x"] and next_y == self.snake[1]["y"]:
                return
                
        self.pending_dx = ndx
        self.pending_dy = ndy

    def to_dict(self):
        return {
            "id":    self.id,
            "name":  self.name,
            "color": self.color,
            "snake": self.snake,
            "score": self.score,
            "alive": self.alive,
        }

class GameRoom:
    def __init__(self, room_id: str, solo: bool = False, difficulty: str = "medium"):
        self.room_id    = room_id
        self.solo       = solo
        self.grid_size  = 15 if solo else 30
        self.difficulty = difficulty
        self.players:   Dict[str, Player] = {}
        self.food:      Optional[Dict]    = None
        self.zone_level = 0
        self.started    = False
        self.finished   = False
        self.tick_count = 0
        self._task: Optional[asyncio.Task] = None

    # ── jugadores ─────────────────────────────────────────────────────────────

    def add_player(self, player_id: str, name: str, ws) -> Player:
        index  = len(self.players)
        player = Player(player_id, name, index, ws, self.solo, self.grid_size)
        self.players[player_id] = player
        return player

    def remove_player(self, player_id: str):
        self.players.pop(player_id, None)

    def is_full(self) -> bool:
        return len(self.players) >= 4

    def player_count(self) -> int:
        return len(self.players)

    # ── food ──────────────────────────────────────────────────────────────────

    def _place_food(self):
        margin  = self.zone_level + 1          # buffer: nunca en el borde de zona
        safe_min = max(0, margin)
        safe_max = min(self.grid_size - 1, self.grid_size - margin - 1)
        if safe_min > safe_max:
            safe_min, safe_max = 0, self.grid_size - 1

        occupied = set()
        for p in self.players.values():
            if not p.alive: continue
            for seg in p.snake:
                occupied.add((seg["x"], seg["y"]))

        attempts = 0
        while True:
            fx = random.randint(safe_min, safe_max)
            fy = random.randint(safe_min, safe_max)
            if (fx, fy) not in occupied:
                self.food = {"x": fx, "y": fy}
                return
            attempts += 1
            if attempts > 1000:
                self.food = {"x": fx, "y": fy}
                return

    # ── zona ──────────────────────────────────────────────────────────────────

    def _calc_zone(self) -> int:
        alive = [p for p in self.players.values() if p.alive]
        if not alive:
            return self.zone_level
        if self.solo:
            return 0  # sin zona en modo solo
        min_score = min(p.score for p in alive)
        return min(min_score, ZONE_MAX)

    def _in_zone(self, x: int, y: int) -> bool:
        z = self.zone_level
        if z == 0:
            return False
        return x < z or x >= self.grid_size - z or y < z or y >= self.grid_size - z

    # ── game loop ─────────────────────────────────────────────────────────────

    async def start(self):
        self.started  = True
        self.finished = False
        self._reset_snakes()
        self._place_food()
        self.zone_level = 0
        
        # Emit initial state so clients can render the board during countdown
        initial_tick_s = SPEED_MAP.get(self.difficulty, 90) / 1000.0 if self.solo else 150 / 1000.0
        await self._broadcast_state(initial_tick_s)
        
        if not self.solo:
            for i in [3, 2, 1, "KILL"]:
                await self._broadcast({"type": "countdown", "value": i})
                await asyncio.sleep(1)

        self._task = asyncio.create_task(self._loop())

    def _reset_snakes(self):
        for idx, player in enumerate(self.players.values()):
            if self.solo:
                player.snake = [
                    {"x": self.grid_size // 2, "y": self.grid_size // 2}
                ]
                player.dx    = 0
                player.dy    = 0
            else:
                cfg = get_corner_config(idx, self.grid_size)
                player.snake = [
                    {"x": cfg["x"], "y": cfg["y"]},
                    {"x": cfg["x"] - cfg["dx"], "y": cfg["y"] - cfg["dy"]},
                    {"x": cfg["x"] - cfg["dx"] * 2, "y": cfg["y"] - cfg["dy"] * 2},
                ]
                player.dx    = cfg["dx"]
                player.dy    = cfg["dy"]
            
            player.score = 0
            player.alive = True
            player.pending_dx = None
            player.pending_dy = None

    async def _loop(self):
        try:
            while self.started and not self.finished:
                if self.solo:
                    current_tick_s = SPEED_MAP.get(self.difficulty, 90) / 1000.0
                else:
                    current_tick_ms = max(50, 150 - (self.zone_level * 10))
                    current_tick_s = current_tick_ms / 1000.0
                    
                await asyncio.sleep(current_tick_s)
                await self._tick(current_tick_s)
        except asyncio.CancelledError:
            pass

    async def _tick(self, current_tick_s: float):
        self.tick_count += 1
        self.zone_level = self._calc_zone()

        # Aplicar input pendiente
        for p in self.players.values():
            if not p.alive:
                continue
            if p.pending_dx is not None:
                p.dx = p.pending_dx
                p.dy = p.pending_dy
                p.pending_dx = None
                p.pending_dy = None

        # Mover serpientes
        ate_food: Optional[str] = None
        for p in self.players.values():
            if not p.alive:
                continue
            
            # SOLO MODE: Esperar hasta que se mueva por primera vez
            if p.dx == 0 and p.dy == 0:
                continue

            hx = p.snake[0]["x"] + p.dx
            hy = p.snake[0]["y"] + p.dy

            # Colisión pared (Visualmente precisa: la cabeza no se renderiza fuera de la malla)
            if hx < 0 or hx >= self.grid_size or hy < 0 or hy >= self.grid_size:
                p.alive = False; continue

            # Colisión zona venenosa
            if self._in_zone(hx, hy):
                p.alive = False; continue

            new_head = {"x": hx, "y": hy}
            
            # Check if we ate food
            will_eat = (self.food and hx == self.food["x"] and hy == self.food["y"])
            
            if not will_eat:
                p.snake.pop() # Remove tail BEFORE collision check with itself/others
                
            # Now check self collision
            if any(s["x"] == hx and s["y"] == hy for s in p.snake):
                p.alive = False; continue

            # Colisión con otras serpientes
            hit_other = False
            for other in self.players.values():
                if other.id == p.id or not other.alive:
                    continue
                if any(s["x"] == hx and s["y"] == hy for s in other.snake):
                    hit_other = True
                    break
            if hit_other:
                p.alive = False; continue

            # Movimiento válido
            p.snake.insert(0, new_head)

            if will_eat:
                p.score += 1
                ate_food = p.id

        if ate_food:
            self._place_food()

        # Verificar fin de partida
        await self._check_end()

        # Emitir estado
        await self._broadcast_state(current_tick_s)

    async def _check_end(self):
        alive     = [p for p in self.players.values() if p.alive]
        total     = len(self.players)

        # Victoria por puntos (Solo en VS)
        if not self.solo:
            for p in self.players.values():
                if p.score >= WIN_SCORE:
                    await self._end_game(winner=p)
                    return

        # Victoria por supervivencia
        if total >= 2 and len(alive) <= 1:
            winner = alive[0] if alive else None
            await self._end_game(winner=winner)
            return

        # Fin de partida en solo (cuando muere el único jugador)
        if total == 1 and len(alive) == 0:
            await self._end_game(winner=None)

    async def _end_game(self, winner: Optional[Player]):
        self.finished = True
        self.started  = False
        if self._task:
            self._task.cancel()

        import db
        if self.solo:
            # Save solo score for player 0
            p = list(self.players.values())[0]
            db.add_solo_score(p.name, p.score, self.difficulty)
        else:
            # Save VS win
            if winner:
                db.add_vs_win(winner.name)

        scores = sorted(
            [{"name": p.name, "score": p.score, "color": p.color} for p in self.players.values()],
            key=lambda x: -x["score"]
        )
        msg = {
            "type":   "game_over",
            "winner": winner.name if winner else None,
            "scores": scores,
        }
        await self._broadcast(msg)

    # ── broadcasting ──────────────────────────────────────────────────────────

    async def _broadcast_state(self, current_tick_s: float):
        state = {
            "type":       "game_state",
            "grid":       self.grid_size,
            "players":    [p.to_dict() for p in self.players.values()],
            "food":       self.food,
            "zone":       self.zone_level,
            "win_score":  WIN_SCORE,
            "tick":       self.tick_count,
            "tick_s":     current_tick_s,
        }
        await self._broadcast(state)

    async def _broadcast(self, msg: dict):
        import json
        data = json.dumps(msg)
        dead: List[str] = []
        for player in list(self.players.values()):
            try:
                await player.ws.send_text(data)
            except Exception:
                dead.append(player.id)
        for pid in dead:
            self.remove_player(pid)

    async def send_to(self, player_id: str, msg: dict):
        import json
        p = self.players.get(player_id)
        if p:
            try:
                await p.ws.send_text(json.dumps(msg))
            except Exception:
                pass

    async def rematch(self):
        self.finished = False
        self.tick_count = 0
        await self.start()
