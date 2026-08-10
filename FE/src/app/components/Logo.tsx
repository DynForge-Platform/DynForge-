import { Link } from 'react-router';
import logoImg from '../../imports/logo.jpg';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="inline-flex items-center gap-3 shrink-0 select-none">
      {/* Icon logo with white background removed */}
      <img
        src={logoImg}
        alt="GRADORA"
        className={`h-9 w-auto object-contain ${light ? 'mix-blend-screen brightness-0 invert' : 'mix-blend-multiply'}`}
      />
      {/* Website Name */}
      <span
        className="font-extrabold tracking-wider text-xl"
        style={{
          fontFamily: 'Sora, var(--font-heading)',
          color: light ? '#ffffff' : 'var(--navy)',
        }}
      >
        GRADORA
      </span>
    </Link>
  );
}
