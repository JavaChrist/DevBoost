import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import RequireAuth from './components/auth/RequireAuth.jsx';

// Pages secondaires lazy-loaded : Session embarque framer-motion + cards,
// les autres écrans ne servent pas au premier render.
const Session = lazy(() => import('./pages/Session.jsx'));
const Library = lazy(() => import('./pages/Library.jsx'));
const Stats = lazy(() => import('./pages/Stats.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Courses = lazy(() => import('./pages/Courses.jsx'));
const Course = lazy(() => import('./pages/Course.jsx'));

function RouteFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-500">
      Chargement…
    </div>
  );
}

// Wrapper court pour réduire la verbosité des routes protégées.
const Protected = (el) => <RequireAuth>{el}</RequireAuth>;

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protégées */}
        <Route path="/" element={Protected(<Dashboard />)} />
        <Route path="/session" element={Protected(<Session />)} />
        <Route path="/library" element={Protected(<Library />)} />
        <Route path="/courses" element={Protected(<Courses />)} />
        <Route path="/courses/:slug" element={Protected(<Course />)} />
        <Route path="/stats" element={Protected(<Stats />)} />
        <Route path="/settings" element={Protected(<Settings />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
