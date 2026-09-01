import { useState, useEffect } from 'react';

function generateRandomName() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function MainMenu({ onQuickPlay, onSolo }) {
  const [name, setName] = useState('');
  const [diff, setDiff] = useState('medium');
  const [mode, setMode] = useState(null); // null | 'solo'

  useEffect(() => {
    setName(generateRandomName());
  }, []);

  const difficulties = [
    { id: 'easy',   label: 'Fácil' },
    { id: 'medium', label: 'Medio' },
    { id: 'hard',   label: 'Difícil' },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center h-full gap-6 px-4 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#CF010B]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Title */}
      <div className="relative text-center">
        <h1 className="font-impact text-5xl sm:text-7xl tracking-widest text-[#CF010B] drop-shadow-[0_0_30px_rgba(207,1,11,0.6)]">
          KILLER SNAKE
        </h1>
        <p className="text-neutral-500 text-sm mt-1 tracking-widest uppercase">Multiplayer</p>
      </div>

      {/* Card */}
      <div className="relative glass p-6 w-full max-w-sm flex flex-col gap-4">
        {/* Name input */}
        {mode === null && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-400 uppercase tracking-widest">Tu nombre</label>
            <input
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 outline-none focus:border-[#CF010B] transition-colors font-semibold tracking-wider uppercase text-center"
              maxLength={3}
              placeholder="FOU"
              value={name}
              onChange={e => setName(e.target.value.toUpperCase().slice(0, 3))}
            />
          </div>
        )}

        {/* Solo Options Flow */}
        {mode === 'solo' ? (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <p className="text-xs text-neutral-400 uppercase tracking-widest">Dificultad</p>
              <button onClick={() => setMode(null)} className="text-xs text-neutral-500 hover:text-white">Volver</button>
            </div>
            <div className="flex gap-2">
              {difficulties.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDiff(d.id)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                    diff === d.id
                      ? 'bg-[#CF010B] text-white shadow-md shadow-[#CF010B]/40'
                      : 'bg-white/5 border border-white/10 text-neutral-400 hover:bg-white/10'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <button
              className="w-full py-4 rounded-2xl bg-[#CF010B] hover:bg-[#a00008] active:scale-95 font-bold text-lg tracking-widest transition-all shadow-lg shadow-[#CF010B]/40 mt-2 text-white"
              onClick={() => onSolo(name || 'FOU', diff)}
            >
              JUGAR
            </button>
          </div>
        ) : (
          <div className="flex gap-3 mt-2">
            <button
              className="flex-1 py-4 rounded-2xl bg-[#CF010B] hover:bg-[#a00008] active:scale-95 font-bold text-lg tracking-widest transition-all shadow-lg shadow-[#CF010B]/40 text-white"
              onClick={() => onQuickPlay(name || 'FOU')}
            >
              VS
            </button>
            <button
              className="flex-1 py-4 rounded-2xl border border-white/10 hover:bg-white/5 active:scale-95 font-bold text-lg tracking-widest transition-all text-neutral-300"
              onClick={() => setMode('solo')}
            >
              SOLO
            </button>
          </div>
        )}
      </div>

      <p className="relative text-neutral-700 text-xs">v2.0 · KILLER SNAKE</p>
    </div>
  );
}
