import { Link } from 'react-router';
import { cn } from './ui/utils';

interface LogoProps {
  light?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

/**
 * DynForge Official Brand Emblem
 * High-definition neon squircle emblem with dynamic cyan-blue gradients
 */
export function DynForgeEmblem({ className = 'size-8' }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="DynForge"
      className={cn('object-contain drop-shadow-[0_0_14px_rgba(6,182,212,0.55)] shrink-0 select-none', className)}
    />
  );
}

export function Logo({
  light = true,
  size = 'md',
  showTagline = false,
  className = '',
}: LogoProps) {
  const emblemSizes = {
    sm: 'size-7 sm:size-8',
    md: 'size-9 sm:size-10',
    lg: 'size-12 sm:size-14',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 sm:gap-3 shrink-0 select-none group ${className}`}>
      {/* Emblem Frame */}
      <div className="flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
        <DynForgeEmblem className={emblemSizes[size]} />
      </div>

      <div className="flex flex-col">
        {/* Brand Name */}
        <span
          className={`font-bold tracking-tight leading-none ${textSizes[size]} ${
            light ? 'text-white' : 'text-slate-900'
          }`}
          style={{ fontFamily: "var(--font-sans)" }}
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
