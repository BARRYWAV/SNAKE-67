export default function DPad({ onInput, onEmote }) {
  const press = (key) => (e) => {
    e.preventDefault();
    onInput(key);
  };

  const emote = (e) => {
    e.preventDefault();
    if(onEmote) onEmote();
  };

  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-4 pb-safe items-center justify-items-center">
      <div />
      <button className="dpad-btn bg-white/10 active:bg-white/20" onPointerDown={press('ArrowUp')}>▲</button>
      <div />

      <button className="dpad-btn bg-white/10 active:bg-white/20" onPointerDown={press('ArrowLeft')}>◀</button>
      <button 
        className="w-16 h-16 rounded-full bg-neutral-900 border border-white/5 shadow-inner shadow-black/50 text-3xl active:scale-95 flex items-center justify-center transition-all" 
        onPointerDown={emote}
      >
        💀
      </button>
      <button className="dpad-btn bg-white/10 active:bg-white/20" onPointerDown={press('ArrowRight')}>▶</button>

      <div />
      <button className="dpad-btn bg-white/10 active:bg-white/20" onPointerDown={press('ArrowDown')}>▼</button>
      <div />
    </div>
  );
}
