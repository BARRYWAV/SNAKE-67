require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { initDB, saveScore, getLeaderboard } = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

// Servir el frontend (index.html) desde la carpeta raíz del proyecto
app.use(express.static(path.join(__dirname, '..')));

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES DEL JUEGO
// ─────────────────────────────────────────────────────────────────────────────
const TILE_COUNT = 40;
const GAME_SPEED_MS = 100;

const COLORS = ['#ff3333', '#3399ff', '#33cc66', '#ff9933'];

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO DE LAS SALAS EN MEMORIA
// ─────────────────────────────────────────────────────────────────────────────
// rooms[roomId] = {
//   players: { socketId: { name, snake, dx, dy, score, color, alive } },
//   food: { x, y },
//   gameLoop: intervalId | null,
//   started: boolean
// }
const rooms = {};

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRandomColor(usedColors) {
  const available = COLORS.filter(c => !usedColors.includes(c));
  return available.length > 0 ? available[0] : COLORS[Math.floor(Math.random() * COLORS.length)];
}

// Posiciones y direcciones iniciales por jugador (esquinas, apuntando al centro)
const CORNER_CONFIGS = [
  // [headX, headY, dx, dy]  — cuerpo va DETRÁS (opuesto a dx/dy)
  { x: 3,            y: 3,            dx: 1,  dy: 0  }, // esquina top-left → derecha
  { x: TILE_COUNT-4, y: TILE_COUNT-4, dx: -1, dy: 0  }, // esquina bottom-right → izquierda
  { x: TILE_COUNT-4, y: 3,            dx: -1, dy: 0  }, // esquina top-right → izquierda
  { x: 3,            y: TILE_COUNT-4, dx: 1,  dy: 0  }, // esquina bottom-left → derecha
];

function createInitialSnake(index) {
  const cfg = CORNER_CONFIGS[index % CORNER_CONFIGS.length];
  return [
    { x: cfg.x,               y: cfg.y },
    { x: cfg.x - cfg.dx,     y: cfg.y - cfg.dy },
    { x: cfg.x - cfg.dx * 2, y: cfg.y - cfg.dy * 2 }
  ];
}

function placeFood(players) {
  let valid = false;
  let fx, fy;
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

function startGameLoop(roomId) {
  const room = rooms[roomId];
  if (!room || room.gameLoop) return;

  room.gameLoop = setInterval(async () => {
    const room = rooms[roomId];
    if (!room) return;

    let anyAlive = false;

    for (const [sid, p] of Object.entries(room.players)) {
      if (!p.alive) continue;
      anyAlive = true;

      // Mover cabeza
      const newHead = { x: p.snake[0].x + p.dx, y: p.snake[0].y + p.dy };
      p.snake.unshift(newHead);

      // Colisión con paredes
      if (newHead.x < 0 || newHead.x >= TILE_COUNT || newHead.y < 0 || newHead.y >= TILE_COUNT) {
        p.alive = false;
        p.snake.pop();
        continue;
      }

      // Colisión consigo mismo
      let selfCollision = false;
      for (let i = 1; i < p.snake.length; i++) {
        if (p.snake[i].x === newHead.x && p.snake[i].y === newHead.y) {
          selfCollision = true;
          break;
        }
      }
      if (selfCollision) { p.alive = false; p.snake.pop(); continue; }

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

      // Comer comida
      if (newHead.x === room.food.x && newHead.y === room.food.y) {
        p.score++;
        room.food = placeFood(room.players);
      } else {
        p.snake.pop();
      }
    }

    // Construir estado para enviar al cliente
    const state = {
      players: Object.fromEntries(
        Object.entries(room.players).map(([sid, p]) => [sid, {
          name: p.name,
          snake: p.snake,
          score: p.score,
          color: p.color,
          alive: p.alive
        }])
      ),
      food: room.food
    };

    io.to(roomId).emit('gameState', state);

    // Terminar juego cuando no queda nadie vivo (o solo 1 player murió)
    if (!anyAlive) {
      clearInterval(room.gameLoop);
      room.gameLoop = null;

      // Guardar scores en PostgreSQL
      for (const p of Object.values(room.players)) {
        try { await saveScore(p.name, p.score, roomId); } catch (e) { console.error(e); }
      }

      const leaderboard = await getLeaderboard(10);
      io.to(roomId).emit('gameOver', { players: state.players, leaderboard });
    }

  }, GAME_SPEED_MS);
}

// ─────────────────────────────────────────────────────────────────────────────
// SOCKET.IO EVENTS
// ─────────────────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Conectado: ${socket.id}`);

  // Crear sala
  socket.on('createRoom', ({ playerName }, callback) => {
    const roomId = generateRoomId();
    rooms[roomId] = { players: {}, food: { x: 20, y: 20 }, gameLoop: null, started: false };

    const color = getRandomColor([]);
    const cfg = CORNER_CONFIGS[0];
    rooms[roomId].players[socket.id] = {
      name: playerName || 'Jugador 1',
      snake: createInitialSnake(0),
      dx: cfg.dx, dy: cfg.dy,
      score: 0,
      color,
      alive: true
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
      score: 0,
      color,
      alive: true
    };
    socket.join(roomId);
    socket.roomId = roomId;

    // Notificar a todos en la sala que alguien se unió
    io.to(roomId).emit('playerJoined', {
      players: Object.fromEntries(
        Object.entries(room.players).map(([sid, p]) => [sid, { name: p.name, color: p.color }])
      )
    });

    callback({ success: true, roomId, color });
  });

  // Iniciar partida (solo el creador)
  socket.on('startGame', () => {
    const roomId = socket.roomId;
    const room = rooms[roomId];
    if (!room) return;

    room.food = placeFood(room.players);
    room.started = true;
    io.to(roomId).emit('gameStarted');
    startGameLoop(roomId);
  });

  // Input del jugador
  socket.on('playerInput', ({ key }) => {
    const roomId = socket.roomId;
    const room = rooms[roomId];
    if (!room || !room.started) return;

    const p = room.players[socket.id];
    if (!p || !p.alive) return;

    if (key === 'ArrowUp' && p.dy !== 1)    { p.dy = -1; p.dx = 0; }
    else if (key === 'ArrowDown' && p.dy !== -1)  { p.dy = 1;  p.dx = 0; }
    else if (key === 'ArrowLeft' && p.dx !== 1)   { p.dy = 0;  p.dx = -1; }
    else if (key === 'ArrowRight' && p.dx !== -1) { p.dy = 0;  p.dx = 1; }
  });

  // Revancha — reiniciar la partida sin salir de la sala
  socket.on('rematch', () => {
    const roomId = socket.roomId;
    const room = rooms[roomId];
    if (!room) return;

    // Detener loop anterior si sigue corriendo
    if (room.gameLoop) { clearInterval(room.gameLoop); room.gameLoop = null; }

    // Reiniciar estado de todos los jugadores
    let idx = 0;
    for (const [sid, p] of Object.entries(room.players)) {
      const cfg = CORNER_CONFIGS[idx % CORNER_CONFIGS.length];
      p.snake = createInitialSnake(idx);
      p.dx = cfg.dx;
      p.dy = cfg.dy;
      p.score = 0;
      p.alive = true;
      idx++;
    }
    room.food = placeFood(room.players);
    room.started = true;

    io.to(roomId).emit('gameStarted');
    startGameLoop(roomId);
    console.log(`🔄 Revancha en sala ${roomId}`);
  });

  // Obtener leaderboard global
  socket.on('getLeaderboard', async (callback) => {
    try {
      const leaderboard = await getLeaderboard(10);
      callback({ success: true, leaderboard });
    } catch (e) {
      callback({ success: false, leaderboard: [] });
    }
  });

  // Desconexión
  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;

    delete rooms[roomId].players[socket.id];
    console.log(`❌ Desconectado: ${socket.id} de sala ${roomId}`);

    if (Object.keys(rooms[roomId].players).length === 0) {
      clearInterval(rooms[roomId].gameLoop);
      delete rooms[roomId];
      console.log(`🗑️  Sala ${roomId} eliminada (vacía)`);
    } else {
      io.to(roomId).emit('playerLeft', { socketId: socket.id });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ARRANQUE
// ─────────────────────────────────────────────────────────────────────────────
initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Error al iniciar la base de datos:', err);
  process.exit(1);
});
