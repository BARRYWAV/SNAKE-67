import { useEffect, useRef } from 'react';

// New dark tones for the grid
const COLORS = {
  tile_a:  '#1a1a1a',
  tile_b:  '#1e1e1e',
  zone:    'rgba(180,0,0,0.55)',
  zone_border: '#CF010B',
  food:    '#f1c40f',
  food_rim:'#d4ac0d',
};

export default function GameCanvas({ gameState, myId, size }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!gameState || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const { grid: GRID = 30 } = gameState; // Read dynamic grid from state
    const tile   = size / GRID;

    const { players, food, zone } = gameState;

    // ── Checkerboard ──────────────────────────────────────────────────────
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? COLORS.tile_a : COLORS.tile_b;
        ctx.fillRect(col * tile, row * tile, tile, tile);
      }
    }

    // ── Poison zone (4 sides) ─────────────────────────────────────────────
    if (zone > 0) {
      ctx.fillStyle = COLORS.zone;
      ctx.fillRect(0, 0, size, zone * tile);                               // top
      ctx.fillRect(0, size - zone * tile, size, zone * tile);              // bottom
      ctx.fillRect(0, zone * tile, zone * tile, size - zone * tile * 2);   // left
      ctx.fillRect(size - zone * tile, zone * tile, zone * tile, size - zone * tile * 2); // right

      // Inner border
      ctx.strokeStyle = COLORS.zone_border;
      ctx.lineWidth   = 2;
      ctx.strokeRect(
        zone * tile, zone * tile,
        size - zone * tile * 2,
        size - zone * tile * 2
      );

      if (zone >= 2) {
        ctx.fillStyle  = 'rgba(255,255,255,0.75)';
        ctx.font       = `bold ${Math.max(7, tile * 0.6)}px Inter`;
        ctx.textAlign  = 'center';
        ctx.fillText('☠ ZONA VENENOSA ☠', size / 2, zone * tile - 3);
      }
    }

    // ── Food (yellow circle) ──────────────────────────────────────────────
    if (food) {
      const fx = food.x * tile + tile / 2;
      const fy = food.y * tile + tile / 2;
      ctx.beginPath();
      ctx.arc(fx, fy, tile * 0.38, 0, Math.PI * 2);
      ctx.fillStyle   = COLORS.food;
      ctx.shadowBlur  = 15;
      ctx.shadowColor = COLORS.food;
      ctx.fill();
      ctx.shadowBlur  = 0;
      ctx.strokeStyle = COLORS.food_rim;
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }

    // ── Snakes (Premium Path Rendering) ───────────────────────────────────
    for (const p of players) {
      if (!p.alive || p.snake.length === 0) continue;

      ctx.beginPath();
      ctx.lineJoin = 'round';
      ctx.lineCap  = 'round';
      ctx.lineWidth = tile * 0.7; // Thicker snake body

      const head = p.snake[0];
      ctx.moveTo(head.x * tile + tile / 2, head.y * tile + tile / 2);

      for (let i = 1; i < p.snake.length; i++) {
        const seg = p.snake[i];
        ctx.lineTo(seg.x * tile + tile / 2, seg.y * tile + tile / 2);
      }

      // Stroke style and shadow for Premium look
      ctx.strokeStyle = p.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset for next element

      // Draw an inner lighter line to create a gradient-like volume effect
      ctx.beginPath();
      ctx.moveTo(head.x * tile + tile / 2, head.y * tile + tile / 2);
      for (let i = 1; i < p.snake.length; i++) {
        const seg = p.snake[i];
        ctx.lineTo(seg.x * tile + tile / 2, seg.y * tile + tile / 2);
      }
      ctx.lineWidth = tile * 0.3;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.stroke();

      // Name tag above head
      ctx.fillStyle  = 'white';
      ctx.font       = `bold ${Math.max(7, tile * 0.55)}px Inter`;
      ctx.textAlign  = 'center';
      ctx.textBaseline = 'bottom';
      ctx.shadowBlur = 2;
      ctx.shadowColor = 'black';
      ctx.fillText(
        p.name.length > 8 ? p.name.slice(0, 7) + '…' : p.name,
        head.x * tile + tile / 2,
        head.y * tile - 4
      );
      ctx.shadowBlur = 0;
    }
  }, [gameState, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: '12px' }}
    />
  );
}
