import { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import AppRoutes from './routes.jsx';
import PageWrapper from './components/layout/PageWrapper.jsx';
import BottomNav from './components/layout/BottomNav.jsx';
import Toaster from './components/ui/Toaster.jsx';
import useDbInit from './hooks/useDbInit.js';
import useDailyNotification from './hooks/useDailyNotification.js';
import { useAuthStore } from './store/useAuthStore.js';

// Routes où la BottomNav ne doit pas apparaître.
const BARE_ROUTES = ['/login', '/reset-password', '/update-password'];

function Shell() {
  const { pathname } = useLocation();
  const showNav = !BARE_ROUTES.includes(pathname);
  const user = useAuthStore((s) => s.user);

  return (
    <>
      <PageWrapper>
        <AppRoutes />
      </PageWrapper>
      {showNav && user && <BottomNav />}
      <Toaster />
    </>
  );
}

export default function App() {
  const { ready, error } = useDbInit();
  useDailyNotification();
  const authReady = useAuthStore((s) => s.ready);
  const hydrateAuth = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  if (error) {
    return (
      <div className="app-shell items-center justify-center p-6 text-center">
        <p className="text-rose-400">Erreur d&apos;initialisation : {error.message}</p>
      </div>
    );
  }

  if (!ready || !authReady) {
    return (
      <div className="app-shell items-center justify-center gap-4 p-6">
        <img
          src="/logo128.png"
          alt="DevBoost"
          width="96"
          height="96"
          className="h-24 w-24 animate-pulse rounded-2xl shadow-card ring-1 ring-slate-800"
        />
        <p className="text-sm text-slate-400">Préparation de DevBoost…</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
