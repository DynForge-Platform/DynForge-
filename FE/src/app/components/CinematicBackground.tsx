import { useMemo } from 'react';

interface CinematicBackgroundProps {
  showVideo?: boolean;
}

export function CinematicBackground({ showVideo = true }: CinematicBackgroundProps) {
  const stars = useMemo(() => {
    return Array.from({ length: 90 }).map((_, i) => ({
      id: i,
      top: `${(i * 19.3) % 100}%`,
      left: `${(i * 29.7) % 100}%`,
      size: (i % 3) + 1,
      opacity: 0.2 + ((i % 6) * 0.1),
      glow: i % 5 === 0,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#020B18]">
      {/* Seamless Continuous Background Video */}
      {showVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
          className="fixed inset-0 h-full w-full object-cover z-0 opacity-60 pointer-events-none"
        />
      )}

      {/* Dark Overlay for Text Readability & Contrast */}
      <div className="fixed inset-0 bg-[#020B18]/60 backdrop-blur-[0.5px] z-0 pointer-events-none" />

      {/* Quiet Ambient Radial Glowing Orbs */}
      <div className="fixed -top-40 left-1/4 size-[700px] rounded-full bg-cyan-500/10 blur-[170px] pointer-events-none z-0" />
      <div className="fixed top-1/3 -right-40 size-[600px] rounded-full bg-indigo-600/10 blur-[170px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 left-1/3 size-[700px] rounded-full bg-cyan-600/10 blur-[180px] pointer-events-none z-0" />

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
            boxShadow: star.glow ? '0 0 6px 1px rgba(103, 232, 249, 0.7)' : 'none',
          }}
        />
      ))}
    </div>
  );
}
