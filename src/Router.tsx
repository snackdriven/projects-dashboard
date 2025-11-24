import { Routes, Route } from 'react-router-dom';
import { MemoryManagerPage } from '@/pages/MemoryManagerPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { Navigation } from '@/components/Navigation';

/**
 * Application Router
 *
 * Routes:
 * - / - Projects Dashboard (default)
 * - /memory - Memory Manager
 */
export function Router() {
  return (
    <>
      <Navigation />
      <div className="pt-14">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/memory" element={<MemoryManagerPage />} />
        </Routes>
      </div>
    </>
  );
}
