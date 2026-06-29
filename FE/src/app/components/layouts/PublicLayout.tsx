import { Outlet, ScrollRestoration } from 'react-router';
import { Header } from './Header';
import { Footer } from './Footer';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
