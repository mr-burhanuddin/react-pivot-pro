export interface NavItem {
  label: string;
  path: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_ITEMS: NavGroup[] = [
  {
    title: 'Getting Started',
    items: [
      { label: 'Introduction', path: '/' },
      { label: 'Quick Start', path: '/quick-start' },
      { label: 'Core Concepts', path: '/core-concepts' },
      { label: 'Showcase', path: '/showcase' },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { label: 'usePivotTable', path: '/api/use-pivot-table' },
      { label: 'ColumnDef', path: '/api/column-def' },
      { label: 'Plugin API', path: '/api/plugin-api' },
    ],
  },
  {
    title: 'Plugins',
    items: [
      { label: 'Aggregation', path: '/plugins/aggregation' },
      { label: 'Sorting', path: '/plugins/sorting' },
      { label: 'Filtering', path: '/plugins/filtering' },
      { label: 'Row Grouping', path: '/plugins/grouping' },
      { label: 'Drag & Drop', path: '/plugins/drag-drop' },
      { label: 'Virtualization', path: '/plugins/virtualization' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { label: 'Performance', path: '/guides/performance' },
      { label: 'Internationalization', path: '/guides/i18n' },
      { label: 'Migration', path: '/guides/migration' },
      { label: 'Recipes', path: '/guides/recipes' },
    ],
  },
  {
    title: 'Contributing',
    items: [
      { label: 'Dev Setup', path: '/contributing/setup' },
      { label: 'Plugin Authoring', path: '/contributing/plugin-authoring' },
      { label: 'Changelog', path: '/contributing/changelog' },
    ],
  },
];

export const ALL_ROUTES = NAV_ITEMS.flatMap((g) => g.items);
