import { useMemo, useState } from 'react';
import { searchDocs, type SearchDocument } from '@/lib/search';

interface SearchBarProps {
  documents: SearchDocument[];
  onNavigate: (path: string) => void;
}

export function SearchBar({ documents, onNavigate }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(() => searchDocs(query, documents), [documents, query]);

  return (
    <div className="search">
      <input
        className="search-input"
        type="search"
        placeholder="Search docs..."
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => setQuery(event.target.value)}
      />
      {open && query.trim() && (
        <div className="search-results" role="listbox">
          {results.length === 0 && <div className="search-empty">No matching pages</div>}
          {results.map((result) => (
            <button
              key={result.id}
              className="search-result"
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onNavigate(result.path);
                setOpen(false);
                setQuery('');
              }}
            >
              <span className="search-result-title">{result.title}</span>
              <span className="search-result-snippet">{result.snippet}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
