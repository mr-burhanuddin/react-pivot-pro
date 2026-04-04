import type { DocRoute } from '@/App';

interface SidebarProps {
  routes: DocRoute[];
  currentPath: string;
}

export function Sidebar({ routes, currentPath }: SidebarProps) {
  const categories = routes.reduce((acc, route) => {
    if (!acc[route.category]) {
      acc[route.category] = [];
    }
    acc[route.category].push(route);
    return acc;
  }, {} as Record<string, DocRoute[]>);

  return (
    <aside className="sidebar" aria-label="Documentation sections">
      <nav>
        {Object.entries(categories).map(([category, catRoutes]) => (
          <div key={category} className="sidebar-group">
            <h4 className="sidebar-group-title">{category}</h4>
            <ul className="sidebar-nav">
              {catRoutes.map((route) => (
                <li key={route.path}>
                  <a
                    href={`#${route.path}`}
                    className={route.path === currentPath ? 'sidebar-link active' : 'sidebar-link'}
                  >
                    {route.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
