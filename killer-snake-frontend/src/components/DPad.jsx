export default function DPad({ onInput }) {
  const press = (key) => (e) => {
    e.preventDefault();
    onInput(key);
  };

  return (
    <div className="flex flex-col items-center gap-2 pb-safe">
      {/* Up */}
      <button className="dpad-btn" onPointerDown={press('ArrowUp')}>▲</button>
      {/* Left / Right */}
      <div className="flex gap-12 items-center">
        <button className="dpad-btn" onPointerDown={press('ArrowLeft')}>◀</button>
        <button className="dpad-btn" onPointerDown={press('ArrowRight')}>▶</button>
      </div>
      {/* Down */}
      <button className="dpad-btn" onPointerDown={press('ArrowDown')}>▼</button>
    </div>
  );
}
