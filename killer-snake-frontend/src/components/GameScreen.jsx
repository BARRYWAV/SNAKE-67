import { useEffect, useRef, useState, useCallback } from 'react';
import GameCanvas from './GameCanvas';
import DPad from './DPad';
import Scoreboard from './Scoreboard';

export default function GameScreen({ gameState, myId, isSolo, sendInput }) {
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState(300);
  const [isMobile, setIsMobile]     = useState(false);

  // ── Responsive canvas size ─────────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (mobile) {
        // Canvas = square fitting the top portion of screen
        const dpadH = 220; // aprox altura d-pad + score
        const available = window.innerHeight - dpadH - 40;
        setCanvasSize(Math.min(window.innerWidth - 16, available, 480));
      } else {
        // PC: fit height
        const score = 52;
        const available = Math.min(window.innerHeight - score - 32, window.innerWidth * 0.75);
        setCanvasSize(Math.floor(available));
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const keyMap = {
        ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown',
        ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight',
        w: 'ArrowUp', s: 'ArrowDown', a: 'ArrowLeft', d: 'ArrowRight',
        W: 'ArrowUp', S: 'ArrowDown', A: 'ArrowLeft', D: 'ArrowRight',
      };
      if (keyMap[e.key]) {
        e.preventDefault();
        sendInput(keyMap[e.key]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sendInput]);

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-[#e74c3c] text-4xl animate-pulse font-impact tracking-widest">KILLER SNAKE</div>
        <p className="text-neutral-500 text-sm animate-pulse">Cargando partida...</p>
      </div>
    );
  }

  const players  = gameState.players || [];
  const winScore = gameState.win_score;

  return (
    <div className="flex flex-col h-full bg-neutral-950 overflow-hidden">

      {/* ── Scoreboard header ─────────────────────────────────── */}
      <div className="bg-black/50 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="font-impact text-[#e74c3c] text-lg tracking-widest">KILLER SNAKE</span>
          {!isSolo && (
            <span className="text-xs text-neutral-600 tracking-widest uppercase">
              🏆 Meta: {winScore} pts
            </span>
          )}
        </div>
        <Scoreboard players={players} myId={myId} winScore={winScore} isSolo={isSolo} />
      </div>

      {/* ── Game area ─────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className={`flex-1 flex overflow-hidden ${isMobile ? 'flex-col items-center' : 'items-center justify-center'}`}
        style={{ minHeight: 0 }}
      >
        {/* Canvas */}
        <div className={`flex-shrink-0 ${isMobile ? 'pt-2' : ''}`}>
          <GameCanvas
            gameState={gameState}
            myId={myId}
            size={canvasSize}
          />
        </div>

        {/* D-Pad (mobile only) */}
        {isMobile && (
          <div className="flex-1 flex items-center justify-center w-full" style={{ minHeight: 0 }}>
            <DPad onInput={sendInput} />
          </div>
        )}

        {/* PC hint */}
        {!isMobile && (
          <div className="absolute bottom-4 right-4 text-neutral-700 text-xs">
            WASD / ↑↓←→
          </div>
        )}
      </div>
    </div>
  );
}
