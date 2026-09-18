import * as React from 'react';
import { cn } from './utils';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function GlassButton({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: GlassButtonProps) {
  const baseClasses =
    'liquid-glass inline-flex items-center justify-center font-medium rounded-full cursor-pointer transition-all duration-200 select-none hover:scale-[1.03] active:scale-[0.98]';
  const variantClasses = {
    primary: 'bg-cyan-600/30 border border-cyan-400/40 text-white hover:bg-cyan-600/40 shadow-lg',
    secondary: 'bg-slate-900/60 border border-white/15 text-slate-200 hover:bg-slate-800/80 hover:text-white',
    ghost: 'bg-transparent border border-transparent text-slate-300 hover:bg-white/10 hover:text-white',
  };
  const sizeClasses = {
    sm: 'px-4 py-1.5 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base font-semibold',
  };

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
