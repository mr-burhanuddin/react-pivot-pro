import { createStore, type StoreApi } from 'zustand/vanilla';
import type { TableState, Updater, SortingRule, ColumnFilter } from '../types';

export interface StateValidator<TState extends TableState = TableState> {
  name: string;
  validate: (state: Partial<TState>) => { valid: boolean; message?: string };
}

export interface PivotTableStore<TState extends TableState> {
  state: TState;
  setState: (updater: Updater<TState>) => void;
  resetState: (nextState: TState) => void;
  addValidator: (validator: StateValidator<TState>) => void;
  removeValidator: (name: string) => void;
}

const DEFAULT_VALIDATORS: StateValidator<TableState>[] = [
  {
    name: 'sorting',
    validate: (state) => {
      const sorting = state.sorting;
      if (sorting !== undefined) {
        if (!Array.isArray(sorting)) {
          return { valid: false, message: 'sorting must be an array' };
        }
        for (const rule of sorting) {
          if (!rule || typeof rule.id !== 'string' || typeof rule.desc !== 'boolean') {
            return { valid: false, message: 'Invalid sorting rule' };
          }
        }
      }
      return { valid: true };
    },
  },
  {
    name: 'filters',
    validate: (state) => {
      const filters = state.filters;
      if (filters !== undefined) {
        if (!Array.isArray(filters)) {
          return { valid: false, message: 'filters must be an array' };
        }
        for (const filter of filters) {
          if (!filter || typeof filter.id !== 'string') {
            return { valid: false, message: 'Invalid filter' };
          }
        }
      }
      return { valid: true };
    },
  },
  {
    name: 'columnVisibility',
    validate: (state) => {
      const visibility = state.columnVisibility;
      if (visibility !== undefined) {
        if (typeof visibility !== 'object' || visibility === null || Array.isArray(visibility)) {
          return { valid: false, message: 'columnVisibility must be a record' };
        }
      }
      return { valid: true };
    },
  },
  {
    name: 'rowSelection',
    validate: (state) => {
      const selection = state.rowSelection;
      if (selection !== undefined) {
        if (typeof selection !== 'object' || selection === null || Array.isArray(selection)) {
          return { valid: false, message: 'rowSelection must be a record' };
        }
        for (const key of Object.keys(selection)) {
          if (typeof selection[key] !== 'boolean') {
            return { valid: false, message: 'rowSelection values must be booleans' };
          }
        }
      }
      return { valid: true };
    },
  },
  {
    name: 'expanded',
    validate: (state) => {
      const expanded = state.expanded;
      if (expanded !== undefined) {
        if (typeof expanded !== 'object' || expanded === null || Array.isArray(expanded)) {
          return { valid: false, message: 'expanded must be a record' };
        }
      }
      return { valid: true };
    },
  },
];

function resolveUpdater<TState extends TableState>(
  updater: Updater<TState>,
  previousState: TState,
): TState {
  if (typeof updater === 'function') {
    return (updater as (previous: TState) => TState)(previousState);
  }
  return updater;
}

function validateState<TState extends TableState>(
  state: Partial<TState>,
  validators: StateValidator<TState>[]
): { valid: boolean; corrected?: Partial<TState> } {
  for (const validator of validators) {
    const result = validator.validate(state);
    if (!result.valid) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[PivotTableStore] Validation failed (${validator.name}):`, result.message);
      }
      return { valid: false };
    }
  }
  return { valid: true };
}

export function createPivotTableStore<TState extends TableState>(
  initialState: TState,
): StoreApi<PivotTableStore<TState>> {
  const validators = new Set<StateValidator<TState>>(DEFAULT_VALIDATORS as StateValidator<TState>[]);
  
  const validatedInitial = validateState(initialState, Array.from(validators));
  const safeInitial = validatedInitial.valid ? initialState : Object.assign({}, createDefaultState(), initialState);

  return createStore<PivotTableStore<TState>>((set, get) => ({
    state: safeInitial,
    setState: (updater) => {
      const currentState = get().state;
      const nextState = resolveUpdater(updater, currentState);
      
      const validation = validateState(nextState, Array.from(validators));
      if (!validation.valid) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[PivotTableStore] Invalid state rejected:', nextState);
        }
        return;
      }
      
      set((previousStore) => ({
        ...previousStore,
        state: nextState,
      }));
    },
    resetState: (nextState) => {
      const validation = validateState(nextState, Array.from(validators));
      if (!validation.valid) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[PivotTableStore] Invalid resetState rejected');
        }
        return;
      }
      set((previousStore) => ({ ...previousStore, state: nextState }));
    },
    addValidator: (validator) => {
      validators.add(validator);
    },
    removeValidator: (name) => {
      for (const v of validators) {
        if (v.name === name) {
          validators.delete(v);
          break;
        }
      }
    },
  }));
}

function createDefaultState(): TableState {
  return {
    sorting: [],
    filters: [],
    columnVisibility: {},
    rowSelection: {},
    expanded: {},
  };
}
