import { Link } from 'react-router';
import logoImg from '../../imports/logo.jpg';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5">
      {/* Icon mark only — just the G symbol portion */}
      <img
        src={logoImg}
        alt="GRADORA icon"
        style={{
          height: '38px',
          width: '38px',
          objectFit: 'cover',
          objectPosition: 'center top',
          borderRadius: '10px',
          mixBlendMode: light ? 'normal' : 'multiply',
          filter: light ? 'brightness(0) invert(1)' : 'none',
        }}
      />
      {/* Wordmark */}
      <span
        style={{
          fontFamily: 'Sora, var(--font-heading)',
          fontWeight: 800,
          fontSize: '1.2rem',
          letterSpacing: '0.08em',
          color: light ? '#ffffff' : 'var(--navy)',
        }}
      >
        GRADORA
      </span>
    </Link>
  );
}
