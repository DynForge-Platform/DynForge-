import * as React from 'react';
import { cn } from './utils';

export function GlassInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 shadow-inner outline-none transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500',
        className
      )}
      {...props}
    />
  );
}
