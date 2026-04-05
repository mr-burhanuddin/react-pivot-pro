import type { PivotTablePlugin, TableState } from '../types';

export interface PluginManifest {
  name: string;
  stateKeys: string[];
  conflictsWith: string[];
  description?: string;
}

export interface PluginRegistry<TState extends TableState = TableState> {
  register: (plugin: PivotTablePlugin<any, TState>, manifest: PluginManifest) => void;
  unregister: (pluginName: string) => boolean;
  getPlugin: (name: string) => PivotTablePlugin<any, TState> | undefined;
  getManifest: (name: string) => PluginManifest | undefined;
  getAll: () => PivotTablePlugin<any, TState>[];
  getAllManifests: () => PluginManifest[];
  hasConflict: (name: string) => { hasConflict: boolean; conflictsWith: string[] };
}

export function createPluginRegistry<TState extends TableState = TableState>(): PluginRegistry<TState> {
  const plugins = new Map<string, { plugin: PivotTablePlugin<any, TState>; manifest: PluginManifest }>();

  function detectConflicts(
    newManifest: PluginManifest
  ): { hasConflict: boolean; conflictsWith: string[] } {
    const conflicts: string[] = [];

    for (const [name, { manifest }] of plugins.entries()) {
      if (manifest.conflictsWith.includes(newManifest.name)) {
        conflicts.push(name);
        continue;
      }

      if (newManifest.conflictsWith.includes(manifest.name)) {
        conflicts.push(name);
        continue;
      }

      const sharedStateKeys = manifest.stateKeys.filter((key) =>
        newManifest.stateKeys.includes(key)
      );
      if (sharedStateKeys.length > 0 && newManifest.name !== manifest.name) {
        conflicts.push(name);
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflictsWith: conflicts,
    };
  }

  return {
    register(plugin: PivotTablePlugin<any, TState>, manifest: PluginManifest): void {
      if (plugins.has(manifest.name)) {
        const existing = plugins.get(manifest.name)!;
        const newManifest = { ...existing.manifest, ...manifest };
        
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[PluginRegistry] Plugin '${manifest.name}' already registered. ` +
            `Manifest has been updated.`
          );
        }
        
        plugins.set(manifest.name, { plugin, manifest: newManifest });
        return;
      }

      const conflictCheck = detectConflicts(manifest);
      if (conflictCheck.hasConflict) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(
            `[PluginRegistry] Cannot register plugin '${manifest.name}'. ` +
            `Conflicts with: ${conflictCheck.conflictsWith.join(', ')}`
          );
        }
        throw new Error(
          `Plugin '${manifest.name}' conflicts with existing plugins: ` +
          `${conflictCheck.conflictsWith.join(', ')}. ` +
          `Shared state keys or explicit conflicts detected. ` +
          `Unregister conflicting plugins first or choose different plugin names.`
        );
      }

      plugins.set(manifest.name, { plugin, manifest });
    },

    unregister(pluginName: string): boolean {
      return plugins.delete(pluginName);
    },

    getPlugin(name: string): PivotTablePlugin<any, TState> | undefined {
      return plugins.get(name)?.plugin;
    },

    getManifest(name: string): PluginManifest | undefined {
      return plugins.get(name)?.manifest;
    },

    getAll(): PivotTablePlugin<any, TState>[] {
      return Array.from(plugins.values()).map((p) => p.plugin);
    },

    getAllManifests(): PluginManifest[] {
      return Array.from(plugins.values()).map((p) => p.manifest);
    },

    hasConflict(name: string): { hasConflict: boolean; conflictsWith: string[] } {
      const manifest = plugins.get(name)?.manifest;
      if (!manifest) {
        return { hasConflict: false, conflictsWith: [] };
      }
      return detectConflicts(manifest);
    },
  };
}

export const DEFAULT_MANIFESTS: Record<string, PluginManifest> = {
  sorting: {
    name: 'sorting',
    stateKeys: ['sorting'],
    conflictsWith: [],
    description: 'Multi-column sorting plugin',
  },
  filtering: {
    name: 'filtering',
    stateKeys: ['filters', 'globalFilter'],
    conflictsWith: [],
    description: 'Column and global filtering plugin',
  },
  grouping: {
    name: 'grouping',
    stateKeys: ['rowGrouping', 'columnGrouping', 'expandedGroups'],
    conflictsWith: [],
    description: 'Hierarchical row grouping plugin',
  },
  pivot: {
    name: 'pivot',
    stateKeys: ['rowGrouping', 'columnGrouping', 'pivotValues', 'pivotEnabled'],
    conflictsWith: ['grouping'],
    description: 'Pivot matrix generation plugin',
  },
  columnVisibility: {
    name: 'columnVisibility',
    stateKeys: ['columnVisibility'],
    conflictsWith: [],
    description: 'Column visibility state plugin',
  },
  columnOrdering: {
    name: 'columnOrdering',
    stateKeys: ['columnOrder'],
    conflictsWith: ['dndColumn'],
    description: 'Explicit column ordering plugin',
  },
  columnPinning: {
    name: 'columnPinning',
    stateKeys: ['columnPinning'],
    conflictsWith: [],
    description: 'Left/right column pinning plugin',
  },
  dndRow: {
    name: 'dndRow',
    stateKeys: ['rowOrder'],
    conflictsWith: [],
    description: 'Row drag-and-drop plugin',
  },
  dndColumn: {
    name: 'dndColumn',
    stateKeys: ['columnOrder'],
    conflictsWith: ['columnOrdering'],
    description: 'Column drag-and-drop plugin',
  },
};
