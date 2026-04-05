import { useState, useCallback, useEffect } from 'react';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { NAV_ITEMS } from '../config/nav';

interface LandingLayoutProps {
  children: React.ReactNode;
  onNavigate: (path: string) => void;
}

export default function LandingLayout({ children, onNavigate }: LandingLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const toggleDark = useCallback(() => setDark((d) => !d), []);
  const toggleMobile = useCallback(() => setMobileOpen((o) => !o), []);

  const handleNav = useCallback(
    (path: string) => {
      onNavigate(path);
      setMobileOpen(false);
    },
    [onNavigate],
  );

  return (
    <div className="landing-layout">
      <header className="landing-topbar">
        <div className="landing-topbar-inner">
          <a href="#/" className="landing-logo" onClick={(e) => { e.preventDefault(); onNavigate('/'); }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>react-pivot-pro</span>
          </a>

          <nav className="landing-nav">
            {NAV_ITEMS.slice(0, 3).map((g) => (
              <a
                key={g.title}
                href={`#${g.items[0].path}`}
                className="landing-nav-link"
                onClick={(e) => { e.preventDefault(); handleNav(g.items[0].path); }}
              >
                {g.title}
              </a>
            ))}
          </nav>

          <div className="landing-topbar-actions">
            <a href="https://github.com/mr-burhanuddin/react-pivot-pro" target="_blank" rel="noreferrer" className="landing-icon-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <button className="landing-icon-btn" onClick={toggleDark}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="landing-icon-btn landing-menu-toggle" onClick={toggleMobile}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="landing-mobile-nav">
            {NAV_ITEMS.map((g) => (
              <div key={g.title} className="landing-mobile-group">
                <div className="landing-mobile-group-title">{g.title}</div>
                {g.items.map((item) => (
                  <a
                    key={item.path}
                    href={`#${item.path}`}
                    className="landing-mobile-link"
                    onClick={(e) => { e.preventDefault(); handleNav(item.path); }}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        )}
      </header>

      {children}
    </div>
  );
}
