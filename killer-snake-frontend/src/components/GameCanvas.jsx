import { useEffect, useRef } from 'react';

const GRID = 30;
const COLORS = {
  tile_a:  '#7a7a7a',
  tile_b:  '#626262',
  zone:    'rgba(180,0,0,0.55)',
  zone_border: '#ff2020',
  food:    '#f1c40f',
  food_rim:'#d4ac0d',
};

function darken(hex) {
  try {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgb(${Math.floor(r*.55)},${Math.floor(g*.55)},${Math.floor(b*.55)})`;
  } catch { return hex; }
}

export default function GameCanvas({ gameState, myId, size }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!gameState || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
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
      ctx.fill();
      ctx.strokeStyle = COLORS.food_rim;
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }

    // ── Snakes (alive only) ───────────────────────────────────────────────
    for (const p of players) {
      if (!p.alive) continue;

      p.snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? darken(p.color) : p.color;
        // Round corners on head
        if (i === 0) {
          const x = seg.x * tile + 1;
          const y = seg.y * tile + 1;
          const w = tile - 2;
          const r = Math.min(3, w / 3);
          ctx.beginPath();
          ctx.roundRect(x, y, w, w, r);
          ctx.fill();
        } else {
          ctx.fillRect(seg.x * tile + 1, seg.y * tile + 1, tile - 2, tile - 2);
        }
      });

      // Name tag above head
      if (p.snake.length > 0) {
        const head = p.snake[0];
        ctx.fillStyle  = 'white';
        ctx.font       = `bold ${Math.max(7, tile * 0.65)}px Inter`;
        ctx.textAlign  = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(
          p.name.length > 8 ? p.name.slice(0, 7) + '…' : p.name,
          head.x * tile + tile / 2,
          head.y * tile - 1
        );
      }
    }
  }, [gameState, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}
