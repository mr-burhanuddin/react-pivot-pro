import { useEffect, useLayoutEffect, useMemo, useReducer, useRef } from 'react';
import {
  Virtualizer,
  elementScroll,
  observeElementOffset,
  observeElementRect,
  observeWindowOffset,
  observeWindowRect,
  windowScroll,
  type VirtualItem,
  type VirtualizerOptions,
} from '@tanstack/virtual-core';

export type ScrollMode = 'element' | 'window';

export interface UseVirtualRowsOptions<
  TScrollElement extends Element | Window = Element,
  TItemElement extends Element = Element,
> {
  count: number;
  getScrollElement: () => TScrollElement | null;
  estimateSize: (index: number) => number;
  scrollMode?: ScrollMode;
  overscan?: number;
  paddingStart?: number;
  paddingEnd?: number;
  scrollPaddingStart?: number;
  scrollPaddingEnd?: number;
  initialOffset?: number | (() => number);
  enabled?: boolean;
  debug?: boolean;
  getItemKey?: VirtualizerOptions<TScrollElement, TItemElement>['getItemKey'];
  rangeExtractor?: VirtualizerOptions<TScrollElement, TItemElement>['rangeExtractor'];
  observeElementRect?: VirtualizerOptions<TScrollElement, TItemElement>['observeElementRect'];
  observeElementOffset?: VirtualizerOptions<TScrollElement, TItemElement>['observeElementOffset'];
  scrollToFn?: VirtualizerOptions<TScrollElement, TItemElement>['scrollToFn'];
  measureElement?: VirtualizerOptions<TScrollElement, TItemElement>['measureElement'];
  onChange?: (instance: Virtualizer<TScrollElement, TItemElement>, sync: boolean) => void;
}

export interface UseVirtualRowsResult<
  TScrollElement extends Element | Window = Element,
  TItemElement extends Element = Element,
> {
  virtualizer: Virtualizer<TScrollElement, TItemElement>;
  virtualRows: VirtualItem[];
  totalSize: number;
}

export function useVirtualRows<
  TScrollElement extends Element | Window = Element,
  TItemElement extends Element = Element,
>(
  options: UseVirtualRowsOptions<TScrollElement, TItemElement>,
): UseVirtualRowsResult<TScrollElement, TItemElement> {
  const useIsomorphicLayoutEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect;
  const [, forceUpdate] = useReducer((value: number) => value + 1, 0);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const virtualizerRef = useRef<Virtualizer<TScrollElement, TItemElement> | null>(null);
  if (!virtualizerRef.current) {
    const seedOptions = optionsRef.current;
    virtualizerRef.current = new Virtualizer<TScrollElement, TItemElement>({
      count: seedOptions.count,
      getScrollElement: seedOptions.getScrollElement,
      estimateSize: seedOptions.estimateSize,
      horizontal: false,
      observeElementRect: observeElementRect as VirtualizerOptions<
        TScrollElement,
        TItemElement
      >['observeElementRect'],
      observeElementOffset: observeElementOffset as VirtualizerOptions<
        TScrollElement,
        TItemElement
      >['observeElementOffset'],
      scrollToFn: elementScroll as VirtualizerOptions<
        TScrollElement,
        TItemElement
      >['scrollToFn'],
    });
  }

  const virtualizer = virtualizerRef.current;

  const {
    count,
    getScrollElement,
    estimateSize,
    scrollMode = 'element',
    overscan,
    paddingStart,
    paddingEnd,
    scrollPaddingStart,
    scrollPaddingEnd,
    initialOffset,
    enabled,
    debug,
    getItemKey,
    rangeExtractor,
    measureElement,
    onChange,
    observeElementRect: customObserveElementRect,
    observeElementOffset: customObserveElementOffset,
    scrollToFn: customScrollToFn,
  } = options;

  const resolvedOptions = useMemo(() => {
    const isWindowMode = scrollMode === 'window';

    const observeRect = customObserveElementRect
      ? customObserveElementRect
      : isWindowMode
        ? (observeWindowRect as unknown as VirtualizerOptions<
            TScrollElement,
            TItemElement
          >['observeElementRect'])
        : (observeElementRect as VirtualizerOptions<
            TScrollElement,
            TItemElement
          >['observeElementRect']);

    const observeOffset = customObserveElementOffset
      ? customObserveElementOffset
      : isWindowMode
        ? (observeWindowOffset as unknown as VirtualizerOptions<
            TScrollElement,
            TItemElement
          >['observeElementOffset'])
        : (observeElementOffset as VirtualizerOptions<
            TScrollElement,
            TItemElement
          >['observeElementOffset']);

    const scrollToFn = customScrollToFn
      ? customScrollToFn
      : isWindowMode
        ? (windowScroll as VirtualizerOptions<TScrollElement, TItemElement>['scrollToFn'])
        : (elementScroll as VirtualizerOptions<TScrollElement, TItemElement>['scrollToFn']);

    const nextOptions: VirtualizerOptions<TScrollElement, TItemElement> = {
      count,
      getScrollElement,
      estimateSize,
      horizontal: false,
      overscan,
      paddingStart,
      paddingEnd,
      scrollPaddingStart,
      scrollPaddingEnd,
      initialOffset,
      enabled,
      debug,
      getItemKey,
      rangeExtractor,
      measureElement,
      observeElementRect: observeRect,
      observeElementOffset: observeOffset,
      scrollToFn,
      onChange: (instance, sync) => {
        forceUpdate();
        onChange?.(instance, sync);
      },
    };

    return nextOptions;
  }, [
    count,
    debug,
    enabled,
    estimateSize,
    getItemKey,
    getScrollElement,
    initialOffset,
    measureElement,
    onChange,
    overscan,
    paddingEnd,
    paddingStart,
    rangeExtractor,
    scrollMode,
    scrollPaddingEnd,
    scrollPaddingStart,
    customObserveElementOffset,
    customObserveElementRect,
    customScrollToFn,
  ]);

  useIsomorphicLayoutEffect(() => {
    virtualizer.setOptions(resolvedOptions);
  }, [resolvedOptions, virtualizer]);

  useIsomorphicLayoutEffect(() => {
    if (typeof virtualizer._didMount === 'function') {
      return virtualizer._didMount();
    }
    return undefined;
  }, [virtualizer]);

  useIsomorphicLayoutEffect(() => {
    if (typeof virtualizer._willUpdate === 'function') {
      virtualizer._willUpdate();
    }
  });

  return {
    virtualizer,
    virtualRows: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize(),
  };
}
