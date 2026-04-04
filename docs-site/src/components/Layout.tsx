import { useEffect } from 'react';
import type { DocRoute } from '@/App';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import type { SearchDocument } from '@/lib/search';

interface LayoutProps {
  route: DocRoute;
  routes: DocRoute[];
  searchDocuments: SearchDocument[];
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export function Layout({
  route,
  routes,
  searchDocuments,
  onNavigate,
  children,
}: LayoutProps) {
  useEffect(() => {
    document.title = `${route.title} | React Pivot Pro Docs`;

    const description = document.querySelector(
      'meta[name="description"]',
    ) as HTMLMetaElement | null;
    if (description) {
      description.content = route.description;
    }
  }, [route.description, route.title]);

  return (
    <div className="layout">
      <Sidebar routes={routes} currentPath={route.path} />
      <div className="content-shell">
        <Header title={route.title} documents={searchDocuments} onNavigate={onNavigate} />
        <main className="content" id="content">
          {children}
        </main>
      </div>
    </div>
  );
}
