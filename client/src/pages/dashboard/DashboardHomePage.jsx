import { useEffect, useState } from 'react';

import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import StatCard from '../../components/StatCard';
import api from '../../services/api.js';
import useAuthStore from '../../store/auth.store.js';

const defaultStats = {
  totalAssets: 0,
  activeScans: 0,
  violations: 0,
  alertsSent: 0,
};

export default function DashboardHomePage() {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState(defaultStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardStats() {
      try {
        const response = await api.get('/dashboard/stats');

        if (!isMounted) {
          return;
        }

        setStats(response.data.stats || defaultStats);
      } catch {
        if (isMounted) {
          setError('Unable to load dashboard metrics right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboardStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const statsCards = [
    { label: 'Total Assets', value: stats.totalAssets },
    { label: 'Active Scans', value: stats.activeScans },
    { label: 'Violations', value: stats.violations },
    { label: 'Alerts Sent', value: stats.alertsSent },
  ];

  return (
    <div className='space-y-8'>
      <section className='grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
        <Card className='border-(--app-color-border) shadow-lg shadow-slate-900/5' style={{ backgroundColor: 'var(--app-color-surface-panel)' }} title={`Welcome back, ${user?.orgName || 'team'}`} subtitle='Phase 1 is live: protected auth, refresh tokens, and a working dashboard shell.'>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {statsCards.map((item) => (
              <StatCard key={item.label} label={item.label} value={isLoading ? '—' : item.value.toString()} subtitle='Current stub value' />
            ))}
          </div>
        </Card>

        <Card className='border-(--app-color-border) shadow-lg shadow-slate-900/5' style={{ backgroundColor: 'var(--app-color-surface-panel)' }} title='Session state' subtitle='What the app knows after authentication.'>
          <div className='space-y-4 text-sm text-(--app-color-text-muted)'>
            <p><span className='font-semibold text-(--app-color-text)'>Organization:</span> {user?.orgName || 'Not loaded'}</p>
            <p><span className='font-semibold text-(--app-color-text)'>Email:</span> {user?.email || 'Not loaded'}</p>
            <p><span className='font-semibold text-(--app-color-text)'>Plan:</span> {user?.plan || 'free'}</p>
          </div>
        </Card>
      </section>

      <Card className='border-(--app-color-border) shadow-lg shadow-slate-900/5' style={{ backgroundColor: 'var(--app-color-surface-panel)' }} title='Recent activity' subtitle='No content yet, which is exactly expected for Phase 1.'>
        {error ? (
          <p className='text-sm text-red-600'>{error}</p>
        ) : isLoading ? (
          <div className='flex items-center gap-3 text-sm text-(--app-color-text-muted)'>
            <Spinner size='sm' />
            Loading dashboard summary...
          </div>
        ) : (
          <EmptyState title='No activity yet' message='Upload assets and start scanning once Phase 2 is in place.' />
        )}
      </Card>
    </div>
  );
}
