import { Link } from 'react-router';

interface LogoProps {
  light?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

/**
 * DynForge Official Vector Logo
 * Identity: D (Dynamic) + F (Forge) + 4-Point Star (Growth/Future)
 * Slogan: BUILD PEOPLE. FORGE FUTURES.
 */
export function DynForgeEmblem({ className = 'size-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Dynamic Cyan to Blue to Indigo Gradient */}
        <linearGradient id="df-gradient" x1="10%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="45%" stopColor="#38BDF8" />
          <stop offset="75%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        {/* Glowing Star Filter */}
        <filter id="star-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Top D-Wing Bar */}
      <path
        d="M 18 16 L 72 16 C 76 16 79 19 77 23 L 72 32 C 70 35 67 37 63 37 L 27 37 L 18 16 Z"
        fill="url(#df-gradient)"
      />

      {/* Left Dynamic Swoop / Spine */}
      <path
        d="M 27 39 L 41 39 L 20 84 L 14 84 C 11 84 9 81 10 78 L 27 39 Z"
        fill="url(#df-gradient)"
      />

      {/* Upper F-Wing */}
      <path
        d="M 64 36 L 90 36 C 94 36 96 39 94 43 L 88 52 C 86 55 83 56 80 56 L 56 56 L 64 36 Z"
        fill="url(#df-gradient)"
      />

      {/* Lower F-Wing */}
      <path
        d="M 52 58 L 78 58 C 82 58 84 61 82 65 L 71 81 C 69 84 66 85 63 85 L 40 85 L 52 58 Z"
        fill="url(#df-gradient)"
      />

      {/* Central Radiant 4-Point Star (Growth / Future) */}
      <path
        d="M 45 36 Q 45 52 61 52 Q 45 52 45 68 Q 45 52 29 52 Q 45 52 45 36 Z"
        fill="#00E5FF"
        filter="url(#star-glow)"
      />
    </svg>
  );
}

export function Logo({
  light = true,
  size = 'md',
  showTagline = false,
  className = '',
}: LogoProps) {
  const emblemSizes = {
    sm: 'size-7',
    md: 'size-9',
    lg: 'size-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <Link to="/" className={`inline-flex items-center gap-3 shrink-0 select-none group ${className}`}>
      {/* Emblem Frame with Dark Glass effect */}
      <div className="flex items-center justify-center rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/20 p-1.5 shadow-lg group-hover:border-cyan-400/50 group-hover:scale-105 transition-all duration-300">
        <DynForgeEmblem className={emblemSizes[size]} />
      </div>

      <div className="flex flex-col">
        {/* Brand Name */}
        <span
          className={`font-bold tracking-tight leading-none ${textSizes[size]} ${
            light ? 'text-white' : 'text-slate-900'
          }`}
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <span>Dyn</span>
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Forge
          </span>
        </span>

        {/* Optional Brand Slogan */}
        {showTagline && (
          <span className="mt-1 text-[9px] tracking-[0.22em] font-semibold text-cyan-300/75 uppercase">
            BUILD PEOPLE. FORGE FUTURES.
          </span>
        )}
      </div>
    </Link>
  );
}
