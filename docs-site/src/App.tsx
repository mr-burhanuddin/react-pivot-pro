import { lazy, Suspense, useState, useEffect, useMemo, useCallback, type ReactElement } from 'react';
import { Analytics } from '@vercel/analytics/react';
import DocsLayout from './layouts/DocsLayout';
import LandingLayout from './layouts/LandingLayout';
import { ALL_ROUTES } from './config/nav';
import LandingPage from './pages/landing';
import './styles/global.css';

type PageComponent = React.LazyExoticComponent<() => ReactElement>;

const PAGE_MODULES: Record<string, PageComponent> = {
  '/quick-start': lazy(() => import('./pages/quick-start')),
  '/core-concepts': lazy(() => import('./pages/core-concepts')),
  '/showcase': lazy(() => import('./pages/showcase')),
  '/api/use-pivot-table': lazy(() => import('./pages/api-use-pivot-table')),
  '/api/column-def': lazy(() => import('./pages/api-column-def')),
  '/api/plugin-api': lazy(() => import('./pages/api-plugin-api')),
  '/plugins/aggregation': lazy(() => import('./pages/plugin-aggregation')),
  '/plugins/sorting': lazy(() => import('./pages/plugin-sorting')),
  '/plugins/filtering': lazy(() => import('./pages/plugin-filtering')),
  '/plugins/grouping': lazy(() => import('./pages/plugin-grouping')),
  '/plugins/drag-drop': lazy(() => import('./pages/plugin-drag-drop')),
  '/plugins/virtualization': lazy(() => import('./pages/plugin-virtualization')),
  '/guides/performance': lazy(() => import('./pages/guide-performance')),
  '/guides/i18n': lazy(() => import('./pages/guide-i18n')),
  '/guides/migration': lazy(() => import('./pages/guide-migration')),
  '/guides/recipes': lazy(() => import('./pages/guide-recipes')),
  '/contributing/setup': lazy(() => import('./pages/contributing-setup')),
  '/contributing/plugin-authoring': lazy(() => import('./pages/contributing-plugin-authoring')),
  '/contributing/changelog': lazy(() => import('./pages/contributing-changelog')),
};

function normalizePath(rawHash: string): string {
  const cleaned = rawHash.replace(/^#/, '');
  if (!cleaned || cleaned === '/') return '/';
  return cleaned;
}

function LoadingFallback() {
  return (
    <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
      Loading...
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ padding: '48px 0', textAlign: 'center' }}>
      <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>404</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>Page not found.</p>
      <a href="#/" style={{ color: 'var(--color-accent)' }}>Back to home</a>
    </div>
  );
}

export function App() {
  const [path, setPath] = useState(() => normalizePath(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setPath(normalizePath(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((newPath: string) => {
    window.location.hash = newPath;
  }, []);

  const isLanding = path === '/';
  const PageComponent = PAGE_MODULES[path];

  const content = PageComponent ? (
    <Suspense fallback={<LoadingFallback />}>
      <PageComponent />
    </Suspense>
  ) : (
    <NotFound />
  );

  if (isLanding) {
    return (
      <>
        <Analytics />
        <LandingLayout onNavigate={navigate}>
          <LandingPage onNavigate={navigate} />
        </LandingLayout>
      </>
    );
  }

  return (
    <>
      <Analytics />
      <DocsLayout currentPath={path} onNavigate={navigate}>
        {content}
      </DocsLayout>
    </>
  );
}
