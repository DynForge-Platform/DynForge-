import { useNavigate, Link } from 'react-router';

export function VelorahLanding() {
  const navigate = useNavigate();

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden select-none"
      style={{
        backgroundColor: 'hsl(201, 100%, 13%)',
        color: 'hsl(0, 0%, 100%)',
        fontFamily: "'Inter', sans-serif",
        // Scoped color variables for Velorah theme
        ['--foreground' as any]: '0 0% 100%',
        ['--muted-foreground' as any]: '240 4% 66%',
      }}
    >
      {/* ── VIDEO BACKGROUND ─────────────────────────────────────────────── */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* ── GLASSMORPHIC NAVIGATION ──────────────────────────────────────── */}
      <nav className="relative z-10 flex flex-row items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        {/* Logo */}
        <Link
          to="/"
          className="text-3xl tracking-tight text-white font-normal hover:opacity-90 transition-opacity"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Velorah®
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex flex-row items-center gap-8 text-sm">
          <Link to="/" className="text-sm font-medium text-white transition-colors">
            Home
          </Link>
          <Link to="/mentors" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
            Studio
          </Link>
          <Link to="/about" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
            About
          </Link>
          <Link to="/resources" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
            Journal
          </Link>
          <Link to="/support/contact" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
            Reach Us
          </Link>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => navigate('/mentors')}
          className="liquid-glass rounded-full px-6 py-2.5 text-sm text-white hover:scale-[1.03] transition-transform cursor-pointer font-medium"
        >
          Begin Journey
        </button>
      </nav>

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-32 pb-40 min-h-screen">
        {/* H1 Heading */}
        <h1
          className="text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-[-2.46px] max-w-7xl font-normal animate-fade-rise"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Where <span className="text-white">dreams</span> rise{' '}
          <span className="text-white/70 italic">through the silence.</span>
        </h1>

        {/* Subtext */}
        <p className="text-white/70 text-base sm:text-lg max-w-2xl mt-8 leading-relaxed animate-fade-rise-delay">
          We&apos;re designing tools for deep thinkers, bold creators, and quiet rebels. Amid the chaos, we build digital spaces for sharp focus and inspired work.
        </p>

        {/* Hero CTA */}
        <button
          onClick={() => navigate('/mentors')}
          className="liquid-glass rounded-full px-14 py-5 text-base text-white mt-12 cursor-pointer hover:scale-[1.03] transition-transform animate-fade-rise-delay-2 font-medium"
        >
          Begin Journey
        </button>
      </main>
    </div>
  );
}
