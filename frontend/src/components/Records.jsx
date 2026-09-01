import { useState, useEffect } from 'react';

export default function Records({ onBack }) {
  const [soloRecords, setSoloRecords] = useState([]);
  const [vsRecords, setVsRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/records/solo').then(res => res.json()),
      fetch('/api/records/vs').then(res => res.json()),
    ]).then(([soloData, vsData]) => {
      setSoloRecords(soloData);
      setVsRecords(vsData);
      setLoading(false);
    }).catch(err => {
      console.error("Error fetching records:", err);
      setLoading(false);
    });
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-4 overflow-hidden animate-fadeIn">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#CF010B]/10 rounded-full blur-3xl pointer-events-none" />

      <h2 className="relative font-impact text-4xl text-[#CF010B] mb-6 drop-shadow-[0_0_15px_rgba(207,1,11,0.5)]">
        🏆 RÉCORDS
      </h2>

      <div className="relative glass w-full max-w-2xl flex flex-col md:flex-row gap-6 p-6 h-[60vh] max-h-[500px]">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-neutral-500 font-bold tracking-widest animate-pulse">
            CARGANDO...
          </div>
        ) : (
          <>
            {/* Solo Column */}
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              <h3 className="text-center font-bold text-neutral-400 tracking-widest text-sm uppercase mb-2 border-b border-white/10 pb-2">
                TOP SOLO
              </h3>
              <div className="overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2">
                {soloRecords.length === 0 ? (
                  <p className="text-center text-neutral-600 text-xs py-4">No hay récords aún.</p>
                ) : (
                  soloRecords.map((r, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-neutral-500 font-bold text-xs w-4">{i + 1}.</span>
                        <span className="text-white font-bold tracking-widest">{r.name}</span>
                        <span className="text-[10px] bg-white/10 text-neutral-400 px-2 py-0.5 rounded-full uppercase">{r.difficulty}</span>
                      </div>
                      <span className="text-[#CF010B] font-black text-lg">{r.score}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px bg-white/10" />

            {/* VS Column */}
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              <h3 className="text-center font-bold text-neutral-400 tracking-widest text-sm uppercase mb-2 border-b border-white/10 pb-2">
                VICTORIAS VS
              </h3>
              <div className="overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2">
                {vsRecords.length === 0 ? (
                  <p className="text-center text-neutral-600 text-xs py-4">No hay victorias aún.</p>
                ) : (
                  vsRecords.map((r, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-neutral-500 font-bold text-xs w-4">{i + 1}.</span>
                        <span className="text-white font-bold tracking-widest">{r.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[#CF010B] font-black text-lg">{r.wins}</span>
                        <span className="text-neutral-500 text-[10px] uppercase">W</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <button
        onClick={onBack}
        className="relative mt-8 py-3 px-8 rounded-2xl border border-white/10 hover:bg-white/5 active:scale-95 font-bold text-sm tracking-widest transition-all text-neutral-400"
      >
        VOLVER
      </button>

      {/* Global styles for custom scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
