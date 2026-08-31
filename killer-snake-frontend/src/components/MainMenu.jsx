import { useState } from 'react';

export default function MainMenu({ onQuickPlay, onSolo }) {
  const [name, setName]       = useState('');
  const [diff, setDiff]       = useState('medium');
  const [mode, setMode]       = useState(null); // null | 'multi' | 'solo'

  const difficulties = [
    { id: 'easy',   label: 'Fácil',  ms: '150ms' },
    { id: 'medium', label: 'Medio',  ms: '100ms' },
    { id: 'hard',   label: 'Difícil',ms: '60ms'  },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center h-full gap-6 px-4 overflow-hidden">

      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-700/10 rounded-full blur-3xl pointer-events-none" />

      {/* Title */}
      <div className="relative text-center">
        <h1 className="font-impact text-5xl sm:text-7xl tracking-widest text-[#e74c3c] drop-shadow-[0_0_30px_rgba(231,76,60,0.6)]">
          KILLER SNAKE
        </h1>
        <p className="text-neutral-500 text-sm mt-1 tracking-widest uppercase">Multiplayer · Battle Royale</p>
      </div>

      {/* Card */}
      <div className="relative glass p-6 w-full max-w-sm flex flex-col gap-4">

        {/* Name input */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400 uppercase tracking-widest">Tu nombre</label>
          <input
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 outline-none focus:border-red-500 transition-colors font-semibold tracking-wider uppercase"
            maxLength={14}
            placeholder="BARRYWAV"
            value={name}
            onChange={e => setName(e.target.value.toUpperCase())}
          />
        </div>

        {/* Quick Play */}
        {mode !== 'solo' && (
          <button
            className="w-full py-4 rounded-2xl bg-[#e74c3c] hover:bg-[#c0392b] active:scale-95 font-bold text-lg tracking-widest transition-all shadow-lg shadow-red-900/40"
            onClick={() => onQuickPlay(name || 'JUGADOR')}
          >
            ⚡ JUGAR RÁPIDO
          </button>
        )}

        {/* Solo toggle */}
        <button
          className="w-full py-3 rounded-2xl border border-white/10 hover:bg-white/5 active:scale-95 font-semibold tracking-widest transition-all text-neutral-300"
          onClick={() => setMode(mode === 'solo' ? null : 'solo')}
        >
          🎮 UN JUGADOR {mode === 'solo' ? '▲' : '▼'}
        </button>

        {/* Solo options */}
        {mode === 'solo' && (
          <div className="flex flex-col gap-3 animate-fadeIn">
            <p className="text-xs text-neutral-500 uppercase tracking-widest">Dificultad</p>
            <div className="flex gap-2">
              {difficulties.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDiff(d.id)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                    diff === d.id
                      ? 'bg-[#e74c3c] text-white shadow-md shadow-red-900/40'
                      : 'bg-white/5 border border-white/10 text-neutral-400 hover:bg-white/10'
                  }`}
                >
                  {d.label}
                  <span className="block text-[10px] opacity-70">{d.ms}</span>
                </button>
              ))}
            </div>
            <button
              className="w-full py-4 rounded-2xl bg-[#e74c3c] hover:bg-[#c0392b] active:scale-95 font-bold text-lg tracking-widest transition-all shadow-lg shadow-red-900/40"
              onClick={() => onSolo(name || 'JUGADOR', diff)}
            >
              🐍 JUGAR SOLO
            </button>
          </div>
        )}
      </div>

      <p className="relative text-neutral-700 text-xs">v2.0 · KILLER SNAKE</p>
    </div>
  );
}
