import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';

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

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/session" element={<Session />} />
        <Route path="/library" element={<Library />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:slug" element={<Course />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
