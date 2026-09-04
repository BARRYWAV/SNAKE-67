import { useEffect, useRef, useState } from 'react';

// New dark tones for the grid (lighter contrast)
const COLORS = {
  tile_a:  '#2a2a2a',
  tile_b:  '#333333',
  zone:    'rgba(180,0,0,0.55)',
  zone_border: '#CF010B',
  food:    '#f1c40f',
  food_rim:'#d4ac0d',
};

export default function GameCanvas({ gameState, myId, size, isSolo }) {
  const canvasRef = useRef(null);
  const [identityActive, setIdentityActive] = useState(true);
  
  const prevStateRef = useRef(null);
  const nextStateRef = useRef(null);
  const lastStateTime = useRef(Date.now());
  const rafRef = useRef(null);

  // Identity trail timer
  useEffect(() => {
    const timer = setTimeout(() => setIdentityActive(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Sync state for interpolation
  useEffect(() => {
    if (!gameState) return;
    prevStateRef.current = nextStateRef.current || gameState;
    nextStateRef.current = gameState;
    lastStateTime.current = Date.now();
  }, [gameState]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      const nextState = nextStateRef.current;
      const prevState = prevStateRef.current;
      
      if (!nextState) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const { grid: GRID = 30, zone, food, players, tick_s = 0.1 } = nextState;
      const tile = size / GRID;
      
      const now = Date.now();
      const elapsed = now - lastStateTime.current;
      const t = Math.min(1.2, elapsed / (tick_s * 1000));

      ctx.clearRect(0, 0, size, size);

      // ── Checkerboard ──────────────────────────────────────────────────────
      for (let row = 0; row < GRID; row++) {
        for (let col = 0; col < GRID; col++) {
          ctx.fillStyle = (row + col) % 2 === 0 ? COLORS.tile_a : COLORS.tile_b;
          ctx.fillRect(col * tile, row * tile, tile, tile);
        }
      }

      // ── Poison zone ───────────────────────────────────────────────────────
      if (zone > 0) {
        ctx.fillStyle = COLORS.zone;
        ctx.fillRect(0, 0, size, zone * tile);                               
        ctx.fillRect(0, size - zone * tile, size, zone * tile);              
        ctx.fillRect(0, zone * tile, zone * tile, size - zone * tile * 2);   
        ctx.fillRect(size - zone * tile, zone * tile, zone * tile, size - zone * tile * 2); 

        ctx.strokeStyle = COLORS.zone_border;
        ctx.lineWidth = 2;
        ctx.strokeRect(zone * tile, zone * tile, size - zone * tile * 2, size - zone * tile * 2);

        if (zone >= 2) {
          ctx.fillStyle  = 'rgba(255,255,255,0.75)';
          ctx.font       = `bold ${Math.max(7, tile * 0.6)}px Inter`;
          ctx.textAlign  = 'center';
          ctx.fillText('☠ ZONA VENENOSA ☠', size / 2, zone * tile - 3);
        }
      }

      // ── Food ──────────────────────────────────────────────────────────────
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

      // ── Snakes (Interpolation & Neon Aesthetics) ──────────────────────────
      for (const p of players) {
        if (!p.alive || p.snake.length === 0) continue;

        let headX = p.snake[0].x;
        let headY = p.snake[0].y;
        let tailX = p.snake[p.snake.length - 1].x;
        let tailY = p.snake[p.snake.length - 1].y;

        // Calculate interpolated positions
        const prevP = prevState?.players?.find(old => old.id === p.id);
        if (prevP && prevP.alive && prevP.snake.length > 0) {
          const prevHead = prevP.snake[0];
          // Only lerp if distance is exactly 1 (to prevent snapping on spawn/respawn)
          if (Math.abs(headX - prevHead.x) + Math.abs(headY - prevHead.y) === 1) {
            headX = prevHead.x + (headX - prevHead.x) * t;
            headY = prevHead.y + (headY - prevHead.y) * t;
          }

          if (p.snake.length === prevP.snake.length && p.snake.length > 1) {
            const prevTail = prevP.snake[prevP.snake.length - 1];
            if (Math.abs(tailX - prevTail.x) + Math.abs(tailY - prevTail.y) === 1) {
              tailX = prevTail.x + (tailX - prevTail.x) * t;
              tailY = prevTail.y + (tailY - prevTail.y) * t;
            }
          }
        }

        ctx.beginPath();
        ctx.lineJoin = 'round';
        ctx.lineCap  = 'round';
        ctx.lineWidth = tile * 0.85; 

        // Start path at interpolated head
        ctx.moveTo(headX * tile + tile / 2, headY * tile + tile / 2);
        
        // Intermediate fixed segments
        for (let i = 1; i < p.snake.length - 1; i++) {
          const seg = p.snake[i];
          ctx.lineTo(seg.x * tile + tile / 2, seg.y * tile + tile / 2);
        }
        
        // End path at interpolated tail
        if (p.snake.length > 1) {
           ctx.lineTo(tailX * tile + tile / 2, tailY * tile + tile / 2);
        }

        const isMe = p.id === myId;
        
        // 1. Render Neon Border
        ctx.strokeStyle = p.color;
        if (isMe && identityActive && !isSolo) {
           // Blink effect
           if (Math.sin(now / 100) > 0) {
             ctx.shadowColor = '#f1c40f';
             ctx.shadowBlur = 25;
             ctx.globalCompositeOperation = 'lighter';
           }
        }
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'source-over';

        // 2. Render Light Core (Neon Aesthetic)
        ctx.lineWidth = tile * 0.45;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; 
        ctx.stroke();

        // 3. Render Solid Bright Head
        ctx.beginPath();
        ctx.arc(headX * tile + tile / 2, headY * tile + tile / 2, tile * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill(); // Lighter head center

        // 4. Glass Names
        if (!isSolo) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.font = `600 ${Math.max(6, tile * 0.4)}px Inter`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(
            p.name.length > 8 ? p.name.slice(0, 7) + '…' : p.name,
            headX * tile + tile / 2,
            headY * tile - 4
          );
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [size, identityActive, myId, isSolo]); 

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: '12px' }}
    />
  );
}
