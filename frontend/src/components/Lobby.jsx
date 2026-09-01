export default function Lobby({ roomId, players, isHost, onStart }) {
  return (
    <div className="relative flex flex-col items-center justify-center h-full gap-6 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#CF010B]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative text-center">
        <h1 className="font-impact text-4xl tracking-widest text-[#CF010B]">KILLER SNAKE</h1>
        <p className="text-neutral-500 text-xs tracking-widest uppercase mt-1">Sala de espera</p>
      </div>

      <div className="relative glass p-6 w-full max-w-sm flex flex-col gap-5">

        {/* Players list */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-neutral-500 uppercase tracking-widest">Jugadores ({players.length}/4)</p>
          {players.map((p, i) => (
            <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/5 border border-white/5">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
              <span className="font-semibold tracking-wider text-sm">{p.name}</span>
              {i === 0 && <span className="ml-auto text-xs text-neutral-500">Host</span>}
            </div>
          ))}
          {/* Empty slots */}
          {Array(4 - players.length).fill(0).map((_, i) => (
            <div key={`empty-${i}`} className="py-2 px-3 rounded-xl border border-dashed border-white/10 text-neutral-700 text-sm text-center">
              Esperando jugador...
            </div>
          ))}
        </div>

        {/* Start button (host only) */}
        {isHost ? (
          <button
            className={`w-full py-4 rounded-2xl font-bold text-lg tracking-widest transition-all text-white ${
              players.length >= 2
                ? 'bg-[#CF010B] hover:bg-[#a00008] active:scale-95 shadow-lg shadow-[#CF010B]/40'
                : 'bg-white/5 text-neutral-600 cursor-not-allowed'
            }`}
            disabled={players.length < 2}
            onClick={onStart}
          >
            {players.length >= 2 ? 'Iniciar Partida' : 'Esperando contrincantes'}
          </button>
        ) : (
          <div className="text-center text-neutral-500 text-sm animate-pulse">
            Esperando que el host inicie la partida...
          </div>
        )}
      </div>
    </div>
  );
}
