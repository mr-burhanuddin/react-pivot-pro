import { ThemeToggle } from '@/components/ThemeToggle';
import { SearchBar } from '@/components/SearchBar';
import type { SearchDocument } from '@/lib/search';

interface HeaderProps {
  title: string;
  documents: SearchDocument[];
  onNavigate: (path: string) => void;
}

export function Header({ title, documents, onNavigate }: HeaderProps) {
  return (
    <header className="header">
      <div>
        <p className="product-name">React Pivot Pro</p>
        <h1 className="page-title">{title}</h1>
      </div>
      <div className="header-controls">
        <SearchBar documents={documents} onNavigate={onNavigate} />
        <ThemeToggle />
      </div>
    </header>
  );
}
