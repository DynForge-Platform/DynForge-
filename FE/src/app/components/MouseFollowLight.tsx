import { useEffect, useRef } from 'react';

interface MouseFollowLightProps {
  size?: number; // size in px, default 260
  className?: string;
}

export function MouseFollowLight({ size = 260, className = '' }: MouseFollowLightProps) {
  const lightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const light = lightRef.current;
    if (!light) return;

    let rafId: number | null = null;
    let targetX = -999;
    let targetY = -999;
    let isVisible = false;

    const render = () => {
      if (light && isVisible) {
        light.style.transform = `translate3d(${targetX}px, ${targetY}px, 0px) translate(-50%, -50%)`;
      }
      rafId = null;
    };

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        light.style.opacity = '1';
      }

      if (!rafId) {
        rafId = requestAnimationFrame(render);
      }
    };

    const onMouseLeave = () => {
      isVisible = false;
      light.style.opacity = '0';
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div
      ref={lightRef}
      className={`pointer-events-none fixed left-0 top-0 z-0 opacity-0 will-change-transform ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: 'translate3d(-999px, -999px, 0px) translate(-50%, -50%)',
        transition: 'opacity 0.25s ease-out',
      }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-full blur-[65px] bg-cyan-400/30" />
      <div className="absolute inset-[20%] rounded-full blur-[45px] bg-blue-500/25" />
    </div>
  );
}
