export default function Scoreboard({ players, myId, winScore, isSolo }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap px-3 py-2">
      {sorted.map((p) => (
        <div
          key={p.id}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
            !p.alive ? 'opacity-40' : ''
          } ${p.id === myId ? 'ring-2 ring-white/30' : ''}`}
          style={{ background: p.alive ? p.color : '#333' }}
        >
          <span className="tracking-wide">{p.name}</span>
          <span className="opacity-80">
            {p.score}{winScore && !isSolo ? `/${winScore}` : ''}
          </span>
          {!p.alive && <span>💀</span>}
        </div>
      ))}
    </div>
  );
}
