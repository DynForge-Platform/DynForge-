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

    const onMouseMove = (e: MouseEvent) => {
      // Direct viewport coordinates
      light.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0px) translate(-50%, -50%)`;
      light.style.opacity = '1';
    };

    const onMouseLeave = () => {
      light.style.opacity = '0';
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
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
        transition: 'transform 0.06s ease-out, opacity 0.25s ease-out',
      }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-full blur-[65px] bg-cyan-400/30" />
      <div className="absolute inset-[20%] rounded-full blur-[45px] bg-blue-500/25" />
    </div>
  );
}
