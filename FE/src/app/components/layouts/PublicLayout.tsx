import { Outlet, ScrollRestoration } from 'react-router';
import { Header } from './Header';
import { Footer } from './Footer';
import { GlobalAiChatbot } from '../GlobalAiChatbot';
import { CinematicBackground } from '../CinematicBackground';

export function PublicLayout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#020B18] text-slate-100 selection:bg-cyan-500 selection:text-white font-sans overflow-x-hidden">
      {/* Seamless Continuous Cinematic Background Atmosphere */}
      <CinematicBackground showVideo={true} />

      {/* Transparent Floating Navbar */}
      <Header />

      {/* Main Editorial Content */}
      <main className="relative z-10 flex-1 bg-transparent">
        <Outlet />
      </main>

      {/* Editorial Dark Footer */}
      <Footer />

      {/* AI Assistant */}
      <GlobalAiChatbot />
      <ScrollRestoration />
    </div>
  );
}
