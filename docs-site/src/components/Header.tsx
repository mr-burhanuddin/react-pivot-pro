import { useState, useEffect, useCallback } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SearchBar } from '@/components/SearchBar';
import type { SearchDocument } from '@/lib/search';
import { Maximize2, Minimize2 } from 'lucide-react';

interface HeaderProps {
  title: string;
  documents: SearchDocument[];
  onNavigate: (path: string) => void;
}

export function Header({ title, documents, onNavigate }: HeaderProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen not supported:', error);
    }
  }, []);

  return (
    <header className="header">
      <div>
        <p className="product-name">React Pivot Pro</p>
        <h1 className="page-title">{title}</h1>
      </div>
      <div className="header-controls">
        <SearchBar documents={documents} onNavigate={onNavigate} />
        <button
          className="ghost-btn icon-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          type="button"
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
