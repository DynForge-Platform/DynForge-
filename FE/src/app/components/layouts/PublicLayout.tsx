import { Outlet, ScrollRestoration } from 'react-router';
import { Header } from './Header';
import { Footer } from './Footer';
import { GlobalAiChatbot } from '../GlobalAiChatbot';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <GlobalAiChatbot />
      <ScrollRestoration />
    </div>
  );
}
