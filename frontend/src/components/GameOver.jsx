export default function GameOver({ endData, isSolo, onRematch, onMenu }) {
  const { winner, scores } = endData || {};

  return (
    <div className="relative flex flex-col items-center justify-center h-full gap-8 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#CF010B]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative text-center">
        <h1 className="font-impact text-6xl tracking-widest text-white drop-shadow-md">
          GAME OVER
        </h1>
        {winner && !isSolo && (
          <p className="text-white text-xl font-bold mt-2 tracking-widest uppercase">
            <span className="text-[#CF010B] font-impact text-2xl">{winner}</span> HA GANADO
          </p>
        )}
      </div>

      {/* Scores */}
      <div className="relative glass p-6 w-full max-w-sm flex flex-col gap-4">
        <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1 text-center">Puntajes</p>
        {(scores || []).map((s, i) => (
          <div key={i} className="flex items-center gap-4 py-3 px-4 rounded-xl bg-white/5 border border-white/5">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: s.color, boxShadow: `0 0 10px ${s.color}` }} />
            <span className="font-bold tracking-widest flex-1 text-lg">{s.name}</span>
            <span className="text-[#f1c40f] font-impact text-2xl drop-shadow-md">{s.score} ⭐</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="relative flex gap-4 w-full max-w-sm">
        <button
          className="flex-1 py-4 rounded-2xl bg-[#CF010B] hover:bg-[#a00008] active:scale-95 text-white font-bold tracking-widest transition-all shadow-lg shadow-[#CF010B]/40 flex items-center justify-center text-xl"
          onClick={onRematch}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>
        <button
          className="flex-1 py-4 rounded-2xl border border-white/10 hover:bg-white/5 active:scale-95 text-white font-bold tracking-widest transition-all uppercase flex items-center justify-center text-sm"
          onClick={onMenu}
        >
          MENÚ
        </button>
      </div>
    </div>
  );
}
