export interface SearchDocument {
  id: string;
  path: string;
  title: string;
  description: string;
  headings: string[];
}

export interface SearchResult {
  id: string;
  path: string;
  title: string;
  snippet: string;
  score: number;
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function searchDocs(query: string, documents: SearchDocument[]): SearchResult[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return [];
  }

  return documents
    .map((document) => {
      const title = document.title.toLowerCase();
      const description = document.description.toLowerCase();
      const headingText = document.headings.join(' ').toLowerCase();

      let score = 0;
      for (const token of tokens) {
        if (title.includes(token)) score += 5;
        if (headingText.includes(token)) score += 3;
        if (description.includes(token)) score += 2;
      }

      return {
        id: document.id,
        path: document.path,
        title: document.title,
        snippet: document.description,
        score,
      };
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 8);
}
