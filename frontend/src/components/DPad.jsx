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
    <div className="grid grid-cols-3 grid-rows-3 gap-4 pb-safe items-center justify-items-center dpad-container">
      <div />
      <button className="dpad-btn bg-white/10 active:bg-white/20 text-white flex items-center justify-center" onPointerDown={press('ArrowUp')}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      </button>
      <div />

      <button className="dpad-btn bg-white/10 active:bg-white/20 text-white flex items-center justify-center" onPointerDown={press('ArrowLeft')}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </button>
      <button 
        className="w-16 h-16 rounded-full bg-neutral-900 border border-white/5 shadow-inner shadow-black/50 text-3xl active:scale-95 flex items-center justify-center transition-all" 
        onPointerDown={emote}
      >
        💀
      </button>
      <button className="dpad-btn bg-white/10 active:bg-white/20 text-white flex items-center justify-center" onPointerDown={press('ArrowRight')}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>

      <div />
      <button className="dpad-btn bg-white/10 active:bg-white/20 text-white flex items-center justify-center" onPointerDown={press('ArrowDown')}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
      </button>
      <div />
    </div>
  );
}
