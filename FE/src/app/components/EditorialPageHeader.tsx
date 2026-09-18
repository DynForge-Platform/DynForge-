import { ReactNode } from 'react';

interface EditorialPageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  children?: ReactNode;
}

export function EditorialPageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: EditorialPageHeaderProps) {
  return (
    <header className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-12 sm:pt-24 sm:pb-16 max-w-5xl mx-auto">
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400 mb-4 animate-fade-rise">
          {eyebrow}
        </span>
      )}

      <h1
        className="text-5xl sm:text-7xl lg:text-8xl font-normal tracking-tight leading-[1.08] text-white animate-fade-rise"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        {title}
      </h1>

      {subtitle && (
        <p className="mt-6 text-white/70 text-base sm:text-lg max-w-2xl leading-relaxed font-normal animate-fade-rise-delay">
          {subtitle}
        </p>
      )}

      {children && <div className="mt-10 w-full animate-fade-rise-delay-2">{children}</div>}
    </header>
  );
}
