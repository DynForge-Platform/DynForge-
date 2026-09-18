import { useMemo } from 'react';

export function StarBackground() {
  const stars = useMemo(() => {
    return Array.from({ length: 95 }).map((_, i) => ({
      id: i,
      top: `${(i * 19.3) % 100}%`,
      left: `${(i * 29.7) % 100}%`,
      size: (i % 3) + 1,
      opacity: 0.3 + ((i % 6) * 0.12),
      glow: i % 4 === 0,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#020B18]">
      {/* Ambient Radial Glowing Orbs */}
      <div className="fixed -top-40 left-1/4 size-[650px] rounded-full bg-cyan-500/18 blur-[160px] pointer-events-none z-0" />
      <div className="fixed top-1/3 -right-40 size-[550px] rounded-full bg-indigo-600/18 blur-[160px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 left-1/3 size-[650px] rounded-full bg-cyan-600/18 blur-[160px] pointer-events-none z-0" />

      {/* Star Field Overlay */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="fixed rounded-full bg-white pointer-events-none z-0"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            boxShadow: star.glow ? '0 0 8px 2px rgba(103, 232, 249, 0.8)' : 'none',
          }}
        />
      ))}
    </div>
  );
}
