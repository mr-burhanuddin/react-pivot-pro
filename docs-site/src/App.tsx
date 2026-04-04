import type { LazyExoticComponent, ReactElement } from 'react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import type { SearchDocument } from '@/lib/search';

export interface DocRoute {
  path: string;
  title: string;
  description: string;
  headings: string[];
  category: string;
}

interface DocPageProps {
  route: DocRoute;
}

export const routes: DocRoute[] = [
  // Core Concepts
  {
    path: '/getting-started',
    title: 'Getting Started',
    description: 'Understand architecture and core table workflow.',
    headings: ['Core model', 'Feature pipeline', 'Rendering strategy'],
    category: 'Core Concepts',
  },
  {
    path: '/installation',
    title: 'Installation',
    description: 'Install package, configure TypeScript, and set up first table.',
    headings: ['Install package', 'Peer dependencies', 'Project setup'],
    category: 'Core Concepts',
  },
  {
    path: '/basic-usage',
    title: 'Basic Usage',
    description: 'Render your first table with typed columns and row model access.',
    headings: ['Define columns', 'Use row model', 'Render headless table'],
    category: 'Core Concepts',
  },
  // Features
  {
    path: '/sorting-filtering',
    title: 'Sorting & Filtering',
    description: 'Combine sorting and filtering plugins for interactive exploration.',
    headings: ['Column sorting', 'Global filter', 'Column filter'],
    category: 'Features',
  },
  {
    path: '/grouping',
    title: 'Grouping',
    description: 'Create expandable grouped rows for hierarchy-focused views.',
    headings: ['Group state', 'Nested groups', 'Expand and collapse'],
    category: 'Features',
  },
  {
    path: '/pivot-guide',
    title: 'Pivot & Aggregation',
    description: 'Build multi-column aggregations with pivot and grouping plugins.',
    headings: ['Pivot values', 'Row and column grouping', 'Aggregation'],
    category: 'Features',
  },
  // Advanced
  {
    path: '/virtualization',
    title: 'Virtualization',
    description: 'Handle large datasets efficiently with virtual row rendering.',
    headings: ['useVirtualRows', 'Large datasets', 'Viewport rendering'],
    category: 'Advanced',
  },
  {
    path: '/performance',
    title: 'Performance & Scaling',
    description: 'Best practices for rendering 100k+ rows with React Pivot Pro.',
    headings: ['Memoization', 'Virtualization setup', 'Bundle splitting'],
    category: 'Advanced',
  },
  // Examples
  {
    path: '/examples/enterprise-grid',
    title: 'Enterprise Data Grid',
    description: 'Full-featured enterprise grid with pinning, sorting, and inline editing.',
    headings: ['Features', 'Implementation details'],
    category: 'Examples',
  },
  {
    path: '/examples/pivot-analytics',
    title: 'Pivot Analytics Dashboard',
    description: 'Multi-level pivot table for analytics and reporting.',
    headings: ['Aggregation formulas', 'Pivot setup'],
    category: 'Examples',
  },
  {
    path: '/examples/financial-sales',
    title: 'Financial & Sales Dashboard',
    description: 'High-performance simulated dashboard with formatting and virtualized rows.',
    headings: ['Formatting', 'Massive datasets'],
    category: 'Examples',
  },
  {
    path: '/examples/server-side',
    title: 'Server-side Data',
    description: 'Simulated server-side pagination, sorting, and filtering.',
    headings: ['Data fetching', 'Mock API'],
    category: 'Examples',
  },
  {
    path: '/examples/customization',
    title: 'Customization UI',
    description: 'Custom cell rendering, highly styled themes, and toolbars.',
    headings: ['Cell renderers', 'Theme overrides'],
    category: 'Examples',
  },
  // API
  {
    path: '/api/core',
    title: 'Core Hooks',
    description: 'Detailed types and hooks for core functionality.',
    headings: ['usePivotTable', 'ColumnDef'],
    category: 'API Reference',
  },
  {
    path: '/api/plugins',
    title: 'Plugin System',
    description: 'API for built-in tools and writing custom plugins.',
    headings: ['Plugin architecture', 'Built-in plugins'],
    category: 'API Reference',
  },
];

type DocPageComponent = (props: DocPageProps) => ReactElement;

const pageModules: Record<string, LazyExoticComponent<DocPageComponent>> = {
  '/getting-started': lazy(() => import('@/pages/getting-started')),
  '/installation': lazy(() => import('@/pages/installation')),
  '/basic-usage': lazy(() => import('@/pages/basic-usage')),
  '/pivot-guide': lazy(() => import('@/pages/pivot-guide')),
  '/grouping': lazy(() => import('@/pages/grouping')),
  '/sorting-filtering': lazy(() => import('@/pages/sorting-filtering')),
  '/virtualization': lazy(() => import('@/pages/virtualization')),
  '/performance': lazy(() => import('@/pages/performance')),
  '/api/core': lazy(() => import('@/pages/api-core')),
  '/api/plugins': lazy(() => import('@/pages/api-plugins')),
  '/examples/enterprise-grid': lazy(() => import('@/pages/examples/enterprise-grid')),
  '/examples/pivot-analytics': lazy(() => import('@/pages/examples/pivot-analytics')),
  '/examples/financial-sales': lazy(() => import('@/pages/examples/financial-sales')),
  '/examples/server-side': lazy(() => import('@/pages/examples/server-side')),
  '/examples/customization': lazy(() => import('@/pages/examples/customization')),
};

function normalizePath(rawHash: string): string {
  const cleaned = rawHash.replace(/^#/, '');
  if (!cleaned || cleaned === '/') {
    return '/getting-started';
  }
  return cleaned;
}

function navigate(path: string): void {
  if (normalizePath(window.location.hash) === path) {
    return;
  }
  window.location.hash = path;
}

export function App() {
  const [path, setPath] = useState(() => normalizePath(window.location.hash));

  useEffect(() => {
    const onHashChange = () => {
      setPath(normalizePath(window.location.hash));
    };

    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  const currentRoute = useMemo(
    () => routes.find((route) => route.path === path) ?? routes[0],
    [path],
  );
  
  // Create a fallback handler for paths that might miss but we still want to show a 404 or redirect.
  const PageComponent = pageModules[currentRoute.path] || (() => <div>Page not found</div>);

  const searchDocuments: SearchDocument[] = useMemo(
    () =>
      routes.map((route) => ({
        id: route.path,
        path: route.path,
        title: route.title,
        description: route.description,
        headings: route.headings,
      })),
    [],
  );

  return (
    <Layout
      route={currentRoute}
      routes={routes}
      searchDocuments={searchDocuments}
      onNavigate={navigate}
    >
      <Suspense fallback={<div className="page-skeleton">Loading documentation...</div>}>
        <PageComponent route={currentRoute} />
      </Suspense>
    </Layout>
  );
}
