import { useEffect, useRef, useState, useCallback } from 'react';
import GameCanvas from './GameCanvas';
import DPad from './DPad';
import Scoreboard from './Scoreboard';

export default function GameScreen({ gameState, myId, isSolo, sendInput, countdown, emotes, sendEmote, backToMenu }) {
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState(300);
  const [isMobile, setIsMobile]     = useState(false);
  const [soloHighScore, setSoloHighScore] = useState(null);

  // Fetch top solo score if isSolo
  useEffect(() => {
    if (isSolo) {
      fetch('/api/records/solo')
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setSoloHighScore(data[0]); // highest score
          }
        })
        .catch(err => console.error(err));
    }
  }, [isSolo]);

  // ── Responsive canvas size ─────────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (mobile) {
        // Canvas = square fitting the top portion of screen
        const dpadH = 220; // aprox altura d-pad + score
        const available = window.innerHeight - dpadH - 60;
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
      } else if (e.key === 'Shift') {
        e.preventDefault();
        sendEmote('skull');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sendInput, sendEmote]);

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 relative">
        <div className="text-[#CF010B] text-4xl animate-pulse font-impact tracking-widest">KILLER SNAKE</div>
        <p className="text-neutral-500 text-sm animate-pulse">Cargando partida...</p>
        
        {/* If countdown starts before state arrives, which is unlikely but possible */}
        {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
              <span className={`font-impact text-8xl text-white drop-shadow-[0_0_40px_#CF010B] ${countdown === 'KILL' ? 'animate-fadeOut' : 'animate-pulse'}`}>
                {countdown}
              </span>
            </div>
        )}
      </div>
    );
  }

  const players  = gameState.players || [];
  const winScore = gameState.win_score;
  const amIAlive = players.find(p => p.id === myId)?.alive ?? false;

  return (
    <div className="flex flex-col h-full bg-neutral-950 overflow-hidden relative">

      {/* ── Scoreboard header ─────────────────────────────────── */}
      <div className="bg-black/50 border-b border-white/5 flex-shrink-0 z-10">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="font-impact text-[#CF010B] text-lg tracking-widest">KILLER SNAKE</span>
          {!isSolo ? (
            <span className="text-xs text-neutral-600 tracking-widest uppercase">
              🏆 Meta: {winScore} pts
            </span>
          ) : soloHighScore ? (
            <span className="text-xs text-neutral-500 tracking-widest uppercase">
              🏆 Mejor Score: <strong className="text-[#f1c40f]">{soloHighScore.score}</strong> ({soloHighScore.name})
            </span>
          ) : null}
        </div>
        <Scoreboard players={players} myId={myId} winScore={winScore} isSolo={isSolo} />
      </div>

      {/* Emotes Overlay */}
      <div className="absolute top-16 right-4 flex flex-col gap-2 z-50 pointer-events-none">
        {emotes && emotes.map(e => {
            const player = players.find(p => p.id === e.playerId);
            const color = player ? player.color : '#fff';
            return (
              <div key={e.id} className="text-4xl animate-bounce drop-shadow-md" style={{ textShadow: `0 0 10px ${color}` }}>
                  💀
              </div>
            );
        })}
      </div>

      {/* ── Game area ─────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className={`flex-1 flex overflow-hidden ${isMobile ? 'flex-col items-center' : 'items-center justify-center'}`}
        style={{ minHeight: 0 }}
      >
        {/* Canvas Area */}
        <div className={`flex-shrink-0 relative ${isMobile ? 'pt-8' : ''}`}>
          <GameCanvas
            gameState={gameState}
            myId={myId}
            size={canvasSize}
            isSolo={isSolo}
          />
          
          {/* Countdown Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
              <span className={`font-impact text-8xl text-white drop-shadow-[0_0_40px_#CF010B] ${countdown === 'KILL' ? 'animate-fadeOut' : 'animate-pulse'}`}>
                {countdown}
              </span>
            </div>
          )}

          {/* Spectator Overlay */}
          {!amIAlive && !isSolo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-40 rounded-xl flex-col gap-4">
              <div className="text-white font-impact text-4xl tracking-widest drop-shadow-md">ESPECTADOR</div>
              <button 
                onClick={backToMenu} 
                className="px-6 py-3 bg-[#CF010B] hover:bg-[#a00008] active:scale-95 text-white font-bold tracking-widest rounded-xl transition-all"
              >
                SALIR
              </button>
            </div>
          )}
        </div>

        {/* D-Pad (mobile only) */}
        {isMobile && (
          <div className="flex-1 flex items-center justify-center w-full" style={{ minHeight: 0 }}>
            <DPad onInput={sendInput} onEmote={() => sendEmote('skull')} />
          </div>
        )}

        {/* PC hint */}
        {!isMobile && (
          <div className="absolute bottom-4 right-4 text-neutral-700 text-xs text-right">
            WASD / ↑↓←→<br/>
            SHIFT: Emote 💀
          </div>
        )}
      </div>
    </div>
  );
}
