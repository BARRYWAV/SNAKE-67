"""
KILLER SNAKE — FastAPI WebSocket Server
"""
import json
import uuid
from typing import Dict, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from game import GameRoom

app = FastAPI(title="Killer Snake Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── State ─────────────────────────────────────────────────────────────────────
rooms: Dict[str, GameRoom] = {}          # roomId → GameRoom
waiting_room: Optional[str] = None       # room open para quick_play


def _clean_empty_rooms():
    for rid in [k for k, v in rooms.items() if v.player_count() == 0]:
        del rooms[rid]


# ── WebSocket endpoint ────────────────────────────────────────────────────────
@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()

    global waiting_room
    player_id = str(uuid.uuid4())
    room: Optional[GameRoom] = None

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            mtype = msg.get("type")

            # ── Quick Play (Matchmaking) ───────────────────────────────────
            if mtype == "quick_play":
                name = msg.get("name", "Jugador")

                # Buscar sala abierta
                if waiting_room and waiting_room in rooms:
                    room = rooms[waiting_room]
                    if not room.is_full() and not room.started:
                        player = room.add_player(player_id, name, websocket)
                    else:
                        # Crear nueva sala
                        waiting_room = None
                        room = GameRoom(str(uuid.uuid4())[:6].upper())
                        rooms[room.room_id] = room
                        waiting_room = room.room_id
                        player = room.add_player(player_id, name, websocket)
                else:
                    room = GameRoom(str(uuid.uuid4())[:6].upper())
                    rooms[room.room_id] = room
                    waiting_room = room.room_id
                    player = room.add_player(player_id, name, websocket)

                is_host = room.player_count() == 1
                await websocket.send_text(json.dumps({
                    "type":     "joined",
                    "roomId":   room.room_id,
                    "playerId": player_id,
                    "color":    player.color,
                    "isHost":   is_host,
                }))

                # Notificar a todos cuántos hay
                await room._broadcast({
                    "type":  "waiting",
                    "count": room.player_count(),
                    "players": [{"name": p.name, "color": p.color} for p in room.players.values()],
                })

            # ── Solo ───────────────────────────────────────────────────────
            elif mtype == "solo":
                name       = msg.get("name", "Jugador")
                difficulty = msg.get("difficulty", "medium")
                room = GameRoom(str(uuid.uuid4())[:6].upper(), solo=True, difficulty=difficulty)
                rooms[room.room_id] = room
                player = room.add_player(player_id, name, websocket)

                await websocket.send_text(json.dumps({
                    "type":     "joined",
                    "roomId":   room.room_id,
                    "playerId": player_id,
                    "color":    player.color,
                    "isHost":   True,
                    "solo":     True,
                }))
                # Iniciar inmediatamente
                await room.start()

            # ── Start (host inicia la partida) ─────────────────────────────
            elif mtype == "start":
                if room and not room.started:
                    if waiting_room == room.room_id:
                        waiting_room = None
                    await room.start()
                    await room._broadcast({"type": "game_started"})

            # ── Input ──────────────────────────────────────────────────────
            elif mtype == "input":
                if room and room.started:
                    player = room.players.get(player_id)
                    if player:
                        player.apply_input(msg.get("key", ""))

            # ── Rematch ────────────────────────────────────────────────────
            elif mtype == "rematch":
                if room and room.finished:
                    await room.rematch()
                    await room._broadcast({"type": "game_started"})

            # ── Emote ──────────────────────────────────────────────────────
            elif mtype == "emote":
                if room:
                    emote_id = msg.get("emote", "skull")
                    await room._broadcast({
                        "type": "emote",
                        "playerId": player_id,
                        "emote": emote_id
                    })

    except WebSocketDisconnect:
        if room:
            room.remove_player(player_id)
            if room.player_count() == 0:
                if waiting_room == room.room_id:
                    waiting_room = None
                rooms.pop(room.room_id, None)
            else:
                await room._broadcast({
                    "type":    "player_left",
                    "name":    player_id,
                    "players": [{"name": p.name, "color": p.color} for p in room.players.values()],
                })
        _clean_empty_rooms()

    except Exception as e:
        print(f"[WS Error] {e}")
        if room:
            room.remove_player(player_id)
        _clean_empty_rooms()

# ── Serve Static React Frontend ───────────────────────────────────────────────
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.join(os.path.dirname(__file__), "../frontend/dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{catchall:path}")
    def serve_react_app(catchall: str):
        file_path = os.path.join(frontend_dist, catchall)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
