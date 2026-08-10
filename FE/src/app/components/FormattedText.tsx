import React from 'react';

interface FormattedTextProps {
  content: string;
  className?: string;
}

/**
 * Renders Markdown-formatted AI text into clean, beautifully styled React HTML elements
 * (converts **bold**, * bullets, - lists into structured typography instead of raw characters).
 */
export const FormattedText: React.FC<FormattedTextProps> = ({ content, className }) => {
  if (!content) return null;

  // Clean out any leftover internal tags like (M1), (M2)
  const cleanContent = content.replaceAll(/\(M\d+\)/g, '').trim();

  // Split into paragraphs / lines
  const lines = cleanContent.split('\n');

  const parseInlineBold = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={`space-y-2 text-sm leading-relaxed text-muted-foreground ${className ?? ''}`}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lineIdx} className="h-1" />;

        // Check horizontal rule (--- or ***)
        if (/^[-*_]{3,}$/.test(trimmed)) {
          return <hr key={lineIdx} className="border-border/60 my-2" />;
        }

        // Check headings (# or ## or ###)
        if (/^#{1,4}\s+/.test(trimmed)) {
          const headingText = trimmed.replace(/^#{1,4}\s+/, '');
          return (
            <p key={lineIdx} className="font-semibold text-foreground text-sm pt-1">
              {parseInlineBold(headingText)}
            </p>
          );
        }

        // Check if line is a bullet item (* item or - item or • item)
        const isBullet = /^[*\-•]\s+/.test(trimmed);
        if (isBullet) {
          const bulletContent = trimmed.replace(/^[*\-•]\s+/, '');
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <div className="flex-1">{parseInlineBold(bulletContent)}</div>
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={lineIdx} className="leading-relaxed">
            {parseInlineBold(trimmed)}
          </p>
        );
      })}
    </div>
  );
};
