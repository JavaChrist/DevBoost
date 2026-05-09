import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes.jsx';
import PageWrapper from './components/layout/PageWrapper.jsx';
import BottomNav from './components/layout/BottomNav.jsx';
import Toaster from './components/ui/Toaster.jsx';
import useDbInit from './hooks/useDbInit.js';
import useDailyNotification from './hooks/useDailyNotification.js';

export default function App() {
  const { ready, error } = useDbInit();
  useDailyNotification();

  if (error) {
    return (
      <div className="app-shell items-center justify-center p-6 text-center">
        <p className="text-rose-400">Erreur d'initialisation : {error.message}</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="app-shell items-center justify-center gap-3 p-6">
        <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
        <p className="text-sm text-slate-400">Préparation de DevBoost…</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <PageWrapper>
        <AppRoutes />
      </PageWrapper>
      <BottomNav />
      <Toaster />
    </BrowserRouter>
  );
}
