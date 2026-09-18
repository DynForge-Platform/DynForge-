import { useState, useEffect } from 'react';

interface GsapTypewriterProps {
  /** Plain text to type out, e.g. "Find your mentor." */
  text?: string;
  /** Optional prefix text (e.g. "Find your ") */
  prefix?: string;
  /** Optional highlighted/accent text (e.g. "mentor.") */
  highlight?: string;
  /** Animation duration in seconds (matches gsap duration: 2) */
  duration?: number;
  /** Ease function (default 'none' matching gsap ease: "none") */
  ease?: 'none' | 'linear';
  /** Extra CSS classes */
  className?: string;
  /** Highlight color/style classes */
  highlightClassName?: string;
  /** Whether to show a blinking terminal cursor */
  showCursor?: boolean;
}

/**
 * Replicates the GSAP TextPlugin animation:
 * gsap.to(".target", {
 *   text: { value: "Find your mentor." },
 *   duration: 2,
 *   ease: "none"
 * });
 */
export function GsapTypewriter({
  text,
  prefix = '',
  highlight = '',
  duration = 2,
  className = '',
  highlightClassName = 'italic text-cyan-400',
  showCursor = true,
}: GsapTypewriterProps) {
  const fullText = text ? text : `${prefix}${highlight}`;
  const [displayedCount, setDisplayedCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    setDisplayedCount(0);
    setIsFinished(false);

    if (!fullText) return;

    const totalChars = fullText.length;
    const durationMs = duration * 1000;
    let animationFrameId: number;
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      // ease: "none" means linear progress
      const progress = Math.min(elapsed / durationMs, 1);
      const count = Math.floor(progress * totalChars);

      setDisplayedCount(count);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(frame);
      } else {
        setDisplayedCount(totalChars);
        setIsFinished(true);
      }
    };

    animationFrameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [fullText, duration]);

  // Determine how many characters belong to prefix vs highlight
  const prefixLength = text ? fullText.length : prefix.length;
  const currentPrefixCount = Math.min(displayedCount, prefixLength);
  const currentHighlightCount = Math.max(0, displayedCount - prefixLength);

  const displayedPrefix = fullText.slice(0, currentPrefixCount);
  const displayedHighlight = highlight ? highlight.slice(0, currentHighlightCount) : '';

  return (
    <span className={`target inline ${className}`} style={{ fontFeatureSettings: '"liga" 1' }}>
      <span>{displayedPrefix}</span>
      {displayedHighlight && (
        <span className={highlightClassName}>{displayedHighlight}</span>
      )}
      {showCursor && (
        <span
          className={`inline-block w-[2.5px] sm:w-[3px] h-[0.78em] bg-cyan-400 align-baseline ml-1 rounded-xs transition-opacity duration-300 ${
            isFinished ? 'animate-pulse opacity-70' : 'opacity-100'
          }`}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
