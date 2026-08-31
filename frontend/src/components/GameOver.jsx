export default function GameOver({ endData, isSolo, onRematch, onMenu }) {
  const { winner, scores } = endData || {};
  const medals = ['🥇', '🥈', '🥉', '4️⃣'];

  return (
    <div className="relative flex flex-col items-center justify-center h-full gap-6 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-red-800/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative text-center">
        <h1 className="font-impact text-4xl tracking-widest text-[#e74c3c]">
          {winner ? '🏆 GAME OVER' : '💀 GAME OVER'}
        </h1>
        {winner && (
          <p className="text-white text-xl font-bold mt-2">
            ¡<span className="text-[#e74c3c]">{winner}</span> gana!
          </p>
        )}
      </div>

      {/* Scores */}
      <div className="relative glass p-5 w-full max-w-sm flex flex-col gap-3">
        <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Resultados</p>
        {(scores || []).map((s, i) => (
          <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/5">
            <span className="text-xl">{medals[i] || (i + 1) + '.'}</span>
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="font-bold tracking-wider flex-1">{s.name}</span>
            <span className="text-[#f1c40f] font-bold">{s.score} ⭐</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="relative flex gap-3 w-full max-w-sm">
        {!isSolo && (
          <button
            className="flex-1 py-4 rounded-2xl bg-[#e74c3c] hover:bg-[#c0392b] active:scale-95 font-bold tracking-widest transition-all shadow-lg shadow-red-900/40"
            onClick={onRematch}
          >
            🔁 REVANCHA
          </button>
        )}
        <button
          className={`py-4 rounded-2xl border border-white/10 hover:bg-white/5 active:scale-95 font-bold tracking-widest transition-all text-neutral-300 ${isSolo ? 'flex-1' : 'px-5'}`}
          onClick={onMenu}
        >
          🏠 MENÚ
        </button>
      </div>
    </div>
  );
}
