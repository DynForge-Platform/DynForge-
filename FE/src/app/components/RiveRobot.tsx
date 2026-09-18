import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    rive: any;
  }
}

interface RiveRobotProps {
  className?: string;
  src?: string;
}

export function RiveRobot({
  className = 'size-full',
  src = '/5308-11093-cute-interactive-robot.riv',
}: RiveRobotProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const riveInstanceRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    let animFrameId: number;

    let targetEyeX = 0;
    let targetEyeY = 0;
    let currentEyeX = 0;
    let currentEyeY = 0;

    const initRive = () => {
      if (!canvasRef.current || !window.rive) return;

      try {
        if (riveInstanceRef.current) {
          riveInstanceRef.current.cleanup();
          riveInstanceRef.current = null;
        }

        // Initialize Rive with state machine name
        const r = new window.rive.Rive({
          src,
          canvas: canvasRef.current,
          autoplay: true,
          stateMachines: 'State Machine 1',
          autoBind: true,
          onLoad: () => {
            if (!isMounted) return;
            try {
              r.resizeDrawingSurfaceToCanvas();
              r.play('State Machine 1');

              // Inspect all inputs
              const inputs = r.stateMachineInputs('State Machine 1') || [];
              console.log(
                '[Rive Robot Details] Inputs found:',
                inputs.map((inp: any) => ({
                  name: inp.name,
                  type: inp.type,
                  value: inp.value,
                }))
              );
            } catch (err) {
              console.warn('[Rive] onLoad:', err);
            }
          },
        });

        riveInstanceRef.current = r;
      } catch (err) {
        console.error('[Rive] Failed to create instance:', err);
      }
    };

    // Calculate mouse position relative to entire screen and project into Rive canvas
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();

      // The robot's artboard center inside the canvas
      const robotCenterX = rect.left + rect.width / 2;
      const robotCenterY = rect.top + rect.height / 2;

      // Distance from cursor to robot across the screen
      const deltaX = e.clientX - robotCenterX;
      const deltaY = e.clientY - robotCenterY;

      // Map entire window coordinates into Rive canvas local coordinate system
      // By projecting from window bounds to canvas bounds, mouse movement anywhere
      // on the page will reach the tracking zone of the Rive robot!
      const scaleX = rect.width / window.innerWidth;
      const scaleY = rect.height / window.innerHeight;

      // Project the cursor proportionally so even far away it moves inside the robot's perception range
      const projectedCanvasX = (rect.width / 2) + (deltaX / (window.innerWidth / 2)) * (rect.width * 0.48);
      const projectedCanvasY = (rect.height / 2) + (deltaY / (window.innerHeight / 2)) * (rect.height * 0.48);

      if (riveInstanceRef.current) {
        try {
          // 1. Dispatch pointermove to Rive canvas with mapped local coordinates
          const pointerEvent = new PointerEvent('pointermove', {
            clientX: rect.left + projectedCanvasX,
            clientY: rect.top + projectedCanvasY,
            screenX: e.screenX,
            screenY: e.screenY,
            bubbles: true,
            cancelable: true,
          });
          canvasRef.current.dispatchEvent(pointerEvent);

          // 2. Also update State Machine inputs if available
          const inputs = riveInstanceRef.current.stateMachineInputs('State Machine 1');
          if (inputs && inputs.length > 0) {
            // Normalized 0 to 100
            const normX = Math.max(0, Math.min(100, (deltaX / (window.innerWidth / 2) + 1) * 50));
            const normY = Math.max(0, Math.min(100, (deltaY / (window.innerHeight / 2) + 1) * 50));

            inputs.forEach((inp: any) => {
              const n = (inp.name || '').toLowerCase();
              if (n.includes('x') || n.includes('horiz') || n.includes('look')) {
                inp.value = normX;
              } else if (n.includes('y') || n.includes('vert') || n.includes('up') || n.includes('down')) {
                inp.value = normY;
              }
            });
          }
        } catch { }
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    if (window.rive) {
      initRive();
    } else {
      const existingScript = document.getElementById('rive-canvas-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'rive-canvas-script';
        script.src = 'https://unpkg.com/@rive-app/canvas@2.24.0';
        script.async = true;
        script.onload = () => {
          if (isMounted) initRive();
        };
        document.body.appendChild(script);
      } else {
        existingScript.addEventListener('load', () => {
          if (isMounted) initRive();
        });
      }
    }

    return () => {
      isMounted = false;
      window.removeEventListener('mousemove', handleMouseMove);
      if (riveInstanceRef.current) {
        try {
          riveInstanceRef.current.cleanup();
        } catch { }
        riveInstanceRef.current = null;
      }
    };
  }, [src]);

  return (
    <div
      ref={containerRef}
      className={`relative size-full flex items-center justify-center select-none ${className}`}
    >
      {/* Native Rive Canvas */}
      <canvas
        ref={canvasRef}
        className="size-full"
        style={{ display: 'block' }}
      />
    </div>
  );
}
