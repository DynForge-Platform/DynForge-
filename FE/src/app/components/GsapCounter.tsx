import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    gsap?: any;
    ScrollTrigger?: any;
  }
}

interface GsapCounterProps {
  targetValue: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  formatter?: (val: number) => string;
}

/**
 * Replicates the GSAP Counter animation requested:
 * gsap.to(counter, {
 *   val: 1248, duration: 2,
 *   ease: "power2.out",
 *   snap: { val: 1 },
 *   onUpdate: () => {
 *     el.textContent = Math.round(counter.val).toLocaleString();
 *   },
 *   scrollTrigger: el
 * });
 */
export function GsapCounter({
  targetValue,
  suffix = '',
  prefix = '',
  decimals = 0,
  duration = 2,
  className = '',
  formatter,
}: GsapCounterProps) {
  const elRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    const counter = { val: 0 };

    if (gsap) {
      if (ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
      }

      const tween = gsap.to(counter, {
        val: targetValue,
        duration: duration,
        ease: 'power2.out',
        snap: { val: decimals > 0 ? (decimals === 1 ? 0.1 : 0.01) : 1 },
        onUpdate: () => {
          if (!el) return;
          if (formatter) {
            el.textContent = formatter(counter.val);
          } else {
            const formatted = decimals > 0
              ? counter.val.toFixed(decimals)
              : Math.round(counter.val).toLocaleString();
            el.textContent = `${prefix}${formatted}${suffix}`;
          }
        },
        scrollTrigger: el,
      });

      return () => {
        tween.kill();
      };
    } else {
      // Fallback if gsap is not loaded
      if (formatter) {
        el.textContent = formatter(targetValue);
      } else {
        const formatted = decimals > 0 ? targetValue.toFixed(decimals) : Math.round(targetValue).toLocaleString();
        el.textContent = `${prefix}${formatted}${suffix}`;
      }
    }
  }, [targetValue, suffix, prefix, decimals, duration, formatter]);

  const initialFormatted = formatter
    ? formatter(0)
    : `${prefix}${decimals > 0 ? (0).toFixed(decimals) : '0'}${suffix}`;

  return (
    <span ref={elRef} className={`tabular-nums ${className}`}>
      {initialFormatted}
    </span>
  );
}
