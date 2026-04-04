import Prism from 'prismjs';

export function highlightCode(code: string, language: string = 'tsx'): string {
  const grammar = Prism.languages[language] ?? Prism.languages.tsx ?? Prism.languages.markup;
  return Prism.highlight(code.trim(), grammar, language);
}
