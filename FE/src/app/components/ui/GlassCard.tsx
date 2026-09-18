import * as React from 'react';
import { cn } from './utils';

export function GlassCard({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-md p-6 text-slate-100 shadow-xl transition-all hover:border-cyan-500/40',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
