import { Suspense, lazy } from 'react';
import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';

const OverviewPage = lazy(() => import('./pages/OverviewPage').then((module) => ({ default: module.OverviewPage })));
const ParticipantsPage = lazy(() => import('./pages/ParticipantsPage').then((module) => ({ default: module.ParticipantsPage })));
const ItemsPage = lazy(() => import('./pages/ItemsPage').then((module) => ({ default: module.ItemsPage })));
const AdjustmentsPage = lazy(() => import('./pages/AdjustmentsPage').then((module) => ({ default: module.AdjustmentsPage })));
const ReviewPage = lazy(() => import('./pages/ReviewPage').then((module) => ({ default: module.ReviewPage })));

function RouteLoading() {
  return (
    <div className="flex min-h-60 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 px-6 py-12 shadow-sm">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400" />
    </div>
  );
}

function LazyRoute(props: { children: ReactNode }) {
  return <Suspense fallback={<RouteLoading />}>{props.children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/setup" replace />} />
        <Route path="/setup" element={<LazyRoute><OverviewPage /></LazyRoute>} />
        <Route path="/participants" element={<LazyRoute><ParticipantsPage /></LazyRoute>} />
        <Route path="/items" element={<LazyRoute><ItemsPage /></LazyRoute>} />
        <Route path="/adjustments" element={<LazyRoute><AdjustmentsPage /></LazyRoute>} />
        <Route path="/review" element={<LazyRoute><ReviewPage /></LazyRoute>} />
      </Route>
    </Routes>
  );
}
