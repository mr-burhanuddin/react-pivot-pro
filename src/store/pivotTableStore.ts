import { createStore, type StoreApi } from 'zustand/vanilla';
import type { TableState, Updater } from '../types';
import { createDefaultTableState } from '../types';

export interface PivotTableStore<TState extends TableState> {
  state: TState;
  setState: (updater: Updater<TState>) => void;
  resetState: (nextState: TState) => void;
}

function resolveUpdater<TState extends TableState>(
  updater: Updater<TState>,
  previousState: TState,
): TState {
  if (typeof updater === 'function') {
    return (updater as (previous: TState) => TState)(previousState);
  }
  return updater;
}

export function createPivotTableStore<TState extends TableState>(
  initialState: TState,
): StoreApi<PivotTableStore<TState>> {
  return createStore<PivotTableStore<TState>>((set, get) => ({
    state: initialState,
    setState: (updater) => {
      const currentState = get().state;
      const nextState = resolveUpdater(updater, currentState);

      set((previousStore) => ({
        ...previousStore,
        state: nextState,
      }));
    },
    resetState: (nextState) => {
      set((previousStore) => ({ ...previousStore, state: nextState }));
    },
  }));
}
