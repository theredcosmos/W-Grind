import { useEffect, useState } from 'react';
import { subscribe } from '../lib/system';

// Renders System toasts and the full-screen Level Up / Rank Up window.
export default function SystemLayer() {
  const [toasts, setToasts] = useState([]);
  const [banner, setBanner] = useState(null);

  useEffect(() => subscribe((e) => {
    if (e.type === 'level' || e.type === 'rank') {
      setBanner(e);
      return;
    }
    setToasts((t) => [...t.slice(-2), e]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== e.id)), 3200);
  }), []);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), banner.type === 'rank' ? 4200 : 2800);
    return () => clearTimeout(t);
  }, [banner]);

  return (
    <>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none w-[min(440px,calc(100vw-32px))]">
        {toasts.map((t) => (
          <div key={t.id} className="sys-window anim-drop w-full px-4 py-3 flex items-start gap-3 pointer-events-auto">
            <div className="mt-0.5 grid place-items-center w-6 h-6 shrink-0 rounded-md border border-sys/50 text-sys text-xs font-bold">!</div>
            <div className="min-w-0">
              <div className="sys-label text-[10px] mb-0.5">System</div>
              <div className="text-[13.5px] leading-snug text-ink">{t.text}</div>
            </div>
            {t.xp ? <div className="ml-auto sys-heading text-sys glow-text text-sm whitespace-nowrap">+{t.xp} XP</div> : null}
          </div>
        ))}
      </div>

      {banner && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-void/70 anim-fade px-4" onClick={() => setBanner(null)}>
          <div className="sys-window anim-pop overflow-hidden w-[min(420px,100%)] px-8 py-10 text-center">
            <div className="absolute inset-x-0 h-24 -top-24 bg-gradient-to-b from-transparent via-sys/10 to-transparent" style={{ animation: 'scan 1.6s ease-in-out 1' }} />
            <div className="sys-label mb-3">{banner.type === 'rank' ? 'Rank Reassessment' : 'Notification'}</div>
            {banner.type === 'level' ? (
              <>
                <div className="sys-heading text-4xl text-white glow-text tracking-[0.12em]">LEVEL UP!</div>
                <div className="mt-4 text-dim text-sm">You have reached</div>
                <div className="sys-heading text-6xl text-sys glow-text mt-1 tabular">Lv. {banner.level}</div>
              </>
            ) : (
              <>
                <div className="text-dim text-sm">Your hunter rank has risen to</div>
                <div className="sys-heading text-5xl mt-2" style={{ color: banner.rank.color, textShadow: `0 0 24px ${banner.rank.color}99` }}>
                  {banner.rank.name}
                </div>
              </>
            )}
            <div className="mt-6 text-[11px] text-faint tracking-wide">Click anywhere to continue</div>
          </div>
        </div>
      )}
    </>
  );
}
