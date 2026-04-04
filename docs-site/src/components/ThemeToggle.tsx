import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const storageKey = 'pivot-docs-theme';

function readTheme(): Theme {
  const stored = window.localStorage.getItem(storageKey);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => readTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(storageKey, theme);
  }, [theme]);

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label="Toggle light and dark mode"
      onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
