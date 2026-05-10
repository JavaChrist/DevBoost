import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import RequireAuth from './components/auth/RequireAuth.jsx';
import { useAuthStore } from './store/useAuthStore.js';

// Pages secondaires lazy-loaded : Session embarque framer-motion + cards,
// les autres écrans ne servent pas au premier render.
const Session = lazy(() => import('./pages/Session.jsx'));
const Library = lazy(() => import('./pages/Library.jsx'));
const Stats = lazy(() => import('./pages/Stats.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Courses = lazy(() => import('./pages/Courses.jsx'));
const Course = lazy(() => import('./pages/Course.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword.jsx'));
const Landing = lazy(() => import('./pages/Landing.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));
const Privacy = lazy(() => import('./pages/Privacy.jsx'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess.jsx'));
const PaymentCancel = lazy(() => import('./pages/PaymentCancel.jsx'));

function RouteFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-500">
      Chargement…
    </div>
  );
}

// Wrapper court pour réduire la verbosité des routes protégées.
const Protected = (el) => <RequireAuth>{el}</RequireAuth>;

// La home est publique : Landing pour les visiteurs, Dashboard pour les
// utilisateurs connectés. Évite que la 1re visite tombe sur un login froid.
function Home() {
  const user = useAuthStore((s) => s.user);
  return user ? <Dashboard /> : <Landing />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* Home publique (Landing si non connecté, Dashboard si connecté) */}
        <Route path="/" element={<Home />} />

        {/* Protégées */}
        <Route path="/session" element={Protected(<Session />)} />
        <Route path="/library" element={Protected(<Library />)} />
        <Route path="/courses" element={Protected(<Courses />)} />
        <Route path="/courses/:slug" element={Protected(<Course />)} />
        <Route path="/stats" element={Protected(<Stats />)} />
        <Route path="/settings" element={Protected(<Settings />)} />
        <Route path="/payment-success" element={Protected(<PaymentSuccess />)} />
        <Route path="/payment-cancel" element={Protected(<PaymentCancel />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
