require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { initDB, saveScore, getLeaderboard } = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, '..')));

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────
const TILE_COUNT   = 40;
const SPEED_BASE   = 200; // ms — velocidad inicial lenta
const SPEED_MIN    = 60;  // ms — velocidad máxima (más rápido)
const SPEED_STEP   = 8;   // ms que se quita por cada punto del mejor jugador

const COLORS = ['#ff3333', '#3399ff', '#33cc66', '#ff9933'];

// Esquinas: posición y dirección inicial apuntando al centro
const CORNER_CONFIGS = [
  { x: 3,            y: 3,            dx: 1,  dy: 0 }, // top-left     → derecha
  { x: TILE_COUNT-4, y: TILE_COUNT-4, dx: -1, dy: 0 }, // bottom-right ← izquierda
  { x: TILE_COUNT-4, y: 3,            dx: -1, dy: 0 }, // top-right    ← izquierda
  { x: 3,            y: TILE_COUNT-4, dx: 1,  dy: 0 }, // bottom-left  → derecha
];

// ─────────────────────────────────────────────────────────────────────────────
// SALAS EN MEMORIA
// ─────────────────────────────────────────────────────────────────────────────
const rooms = {};

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRandomColor(usedColors) {
  const available = COLORS.filter(c => !usedColors.includes(c));
  return available.length > 0 ? available[0] : COLORS[Math.floor(Math.random() * COLORS.length)];
}

function createInitialSnake(index) {
  const cfg = CORNER_CONFIGS[index % CORNER_CONFIGS.length];
  // Empieza con UN solo segmento (la cabeza), crece al comer
  return [{ x: cfg.x, y: cfg.y }];
}

function placeFood(players) {
  let valid = false, fx, fy;
  while (!valid) {
    fx = Math.floor(Math.random() * TILE_COUNT);
    fy = Math.floor(Math.random() * TILE_COUNT);
    valid = true;
    for (const p of Object.values(players)) {
      for (const seg of p.snake) {
        if (seg.x === fx && seg.y === fy) { valid = false; break; }
      }
      if (!valid) break;
    }
  }
  return { x: fx, y: fy };
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME LOOP (recursive setTimeout para velocidad dinámica)
// ─────────────────────────────────────────────────────────────────────────────
function calcSpeed(room) {
  const alivePlayers = Object.values(room.players).filter(p => p.alive);
  const maxScore = alivePlayers.length > 0 ? Math.max(...alivePlayers.map(p => p.score)) : 0;
  return Math.max(SPEED_MIN, SPEED_BASE - maxScore * SPEED_STEP);
}

function calcZoneLevel(room) {
  const alivePlayers = Object.values(room.players).filter(p => p.alive);
  if (alivePlayers.length === 0) return 0;
  // Zona crece cuando todos los vivos alcanzan el mismo mínimo de puntos
  return Math.min(Math.floor(Math.min(...alivePlayers.map(p => p.score))), 8);
}

function scheduleNextTick(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  const speed = calcSpeed(room);
  room.gameLoop = setTimeout(() => runGameTick(roomId), speed);
}

async function runGameTick(roomId) {
  const room = rooms[roomId];
  if (!room || !room.started) return;

  room.zoneLevel = calcZoneLevel(room);
  let anyAlive = false;

  for (const [sid, p] of Object.entries(room.players)) {
    if (!p.alive) continue;
    anyAlive = true;

    // Mover cabeza
    const newHead = { x: p.snake[0].x + p.dx, y: p.snake[0].y + p.dy };
    p.snake.unshift(newHead);

    // Colisión con paredes
    if (newHead.x < 0 || newHead.x >= TILE_COUNT || newHead.y < 0 || newHead.y >= TILE_COUNT) {
      p.alive = false; p.snake.pop(); continue;
    }

    // Colisión con zona venenosa (crece por los 4 lados)
    if (room.zoneLevel > 0 && (
        newHead.y < room.zoneLevel ||
        newHead.y >= TILE_COUNT - room.zoneLevel ||
        newHead.x < room.zoneLevel ||
        newHead.x >= TILE_COUNT - room.zoneLevel
    )) {
      p.alive = false; p.snake.pop(); continue;
    }

    // Colisión consigo mismo
    let selfHit = false;
    for (let i = 1; i < p.snake.length; i++) {
      if (p.snake[i].x === newHead.x && p.snake[i].y === newHead.y) { selfHit = true; break; }
    }
    if (selfHit) { p.alive = false; p.snake.pop(); continue; }

    // Colisión con otras serpientes
    let hitOther = false;
    for (const [otherId, other] of Object.entries(room.players)) {
      if (otherId === sid) continue;
      for (const seg of other.snake) {
        if (seg.x === newHead.x && seg.y === newHead.y) { hitOther = true; break; }
      }
      if (hitOther) break;
    }
    if (hitOther) { p.alive = false; p.snake.pop(); continue; }

    // Comer estrella (food)
    if (newHead.x === room.food.x && newHead.y === room.food.y) {
      p.score++;
      // No hacemos pop → la serpiente crece 1 segmento
      room.food = placeFood(room.players);
    } else {
      p.snake.pop(); // No creció
    }
  }

  // Construir estado para emitir
  const state = {
    players: Object.fromEntries(
      Object.entries(room.players).map(([sid, p]) => [sid, {
        name: p.name, snake: p.snake, score: p.score, color: p.color, alive: p.alive
      }])
    ),
    food: room.food,
    zoneLevel: room.zoneLevel
  };

  io.to(roomId).emit('gameState', state);

  // ¿Terminó la partida?
  if (!anyAlive) {
    room.gameLoop = null;
    room.started = false;

    // Guardar scores
    for (const p of Object.values(room.players)) {
      try { await saveScore(p.name, p.score, roomId); } catch (e) { console.error(e); }
    }

    const leaderboard = await getLeaderboard(10);
    io.to(roomId).emit('gameOver', { players: state.players, leaderboard });
    return; // No reprogramar
  }

  scheduleNextTick(roomId);
}

function startGameLoop(roomId) {
  const room = rooms[roomId];
  if (!room || room.gameLoop) return;
  scheduleNextTick(roomId);
}

function stopGameLoop(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  if (room.gameLoop) { clearTimeout(room.gameLoop); room.gameLoop = null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// SOCKET.IO EVENTS
// ─────────────────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Conectado: ${socket.id}`);

  // Crear sala
  socket.on('createRoom', ({ playerName }, callback) => {
    const roomId = generateRoomId();
    rooms[roomId] = { players: {}, food: { x: 20, y: 20 }, gameLoop: null, started: false, zoneLevel: 0 };

    const cfg = CORNER_CONFIGS[0];
    const color = getRandomColor([]);
    rooms[roomId].players[socket.id] = {
      name: playerName || 'Jugador 1',
      snake: createInitialSnake(0),
      dx: cfg.dx, dy: cfg.dy,
      score: 0, color, alive: true
    };
    socket.join(roomId);
    socket.roomId = roomId;
    console.log(`🏠 Sala creada: ${roomId} por ${playerName}`);
    callback({ success: true, roomId, color });
  });

  // Unirse a sala
  socket.on('joinRoom', ({ playerName, roomId }, callback) => {
    const room = rooms[roomId];
    if (!room) return callback({ success: false, error: 'Sala no encontrada' });
    if (room.started) return callback({ success: false, error: 'La partida ya comenzó' });
    if (Object.keys(room.players).length >= 4) return callback({ success: false, error: 'Sala llena' });

    const usedColors = Object.values(room.players).map(p => p.color);
    const color = getRandomColor(usedColors);
    const playerIndex = Object.keys(room.players).length;
    const cfg = CORNER_CONFIGS[playerIndex % CORNER_CONFIGS.length];

    room.players[socket.id] = {
      name: playerName || `Jugador ${playerIndex + 1}`,
      snake: createInitialSnake(playerIndex),
      dx: cfg.dx, dy: cfg.dy,
      score: 0, color, alive: true
    };
    socket.join(roomId);
    socket.roomId = roomId;

    io.to(roomId).emit('playerJoined', {
      players: Object.fromEntries(
        Object.entries(room.players).map(([sid, p]) => [sid, { name: p.name, color: p.color }])
      )
    });
    callback({ success: true, roomId, color });
  });

  // Iniciar partida
  socket.on('startGame', () => {
    const room = rooms[socket.roomId];
    if (!room) return;
    room.food = placeFood(room.players);
    room.started = true;
    room.zoneLevel = 0;
    io.to(socket.roomId).emit('gameStarted');
    startGameLoop(socket.roomId);
  });

  // Input del jugador
  socket.on('playerInput', ({ key }) => {
    const room = rooms[socket.roomId];
    if (!room || !room.started) return;
    const p = room.players[socket.id];
    if (!p || !p.alive) return;

    if      (key === 'ArrowUp'    && p.dy !== 1)  { p.dy = -1; p.dx = 0; }
    else if (key === 'ArrowDown'  && p.dy !== -1) { p.dy = 1;  p.dx = 0; }
    else if (key === 'ArrowLeft'  && p.dx !== 1)  { p.dy = 0;  p.dx = -1; }
    else if (key === 'ArrowRight' && p.dx !== -1) { p.dy = 0;  p.dx = 1; }
  });

  // Revancha — misma sala, reset completo
  socket.on('rematch', () => {
    const roomId = socket.roomId;
    const room = rooms[roomId];
    if (!room) return;

    stopGameLoop(roomId);

    let idx = 0;
    for (const [sid, p] of Object.entries(room.players)) {
      const cfg = CORNER_CONFIGS[idx % CORNER_CONFIGS.length];
      p.snake = createInitialSnake(idx);
      p.dx = cfg.dx; p.dy = cfg.dy;
      p.score = 0; p.alive = true;
      idx++;
    }
    room.food = placeFood(room.players);
    room.started = true;
    room.zoneLevel = 0;

    io.to(roomId).emit('gameStarted');
    startGameLoop(roomId);
    console.log(`🔄 Revancha en sala ${roomId}`);
  });

  // Leaderboard global
  socket.on('getLeaderboard', async (callback) => {
    try { callback({ success: true, leaderboard: await getLeaderboard(10) }); }
    catch (e) { callback({ success: false, leaderboard: [] }); }
  });

  // Desconexión
  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;
    delete rooms[roomId].players[socket.id];
    console.log(`❌ Desconectado: ${socket.id} de sala ${roomId}`);
    if (Object.keys(rooms[roomId].players).length === 0) {
      stopGameLoop(roomId);
      delete rooms[roomId];
      console.log(`🗑️  Sala ${roomId} eliminada`);
    } else {
      io.to(roomId).emit('playerLeft', { socketId: socket.id });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ARRANQUE
// ─────────────────────────────────────────────────────────────────────────────
initDB().then(() => {
  server.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
}).catch(err => { console.error('Error DB:', err); process.exit(1); });
