export function referenceTime() {
  // If no performance, then we always used Date.now(), which is a full
  // (if inaccurate) timestamp
  if (typeof performance === 'undefined') {
    return 0;
  }

  // Safari does not support performance.timeOrigin. We simulate it by using the
  // (less precise) Date.now(), and subtracting the time since the timeOrigin
  // (performance.now())
  return performance.timeOrigin || Date.now() - performance.now();
}

export function now() {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}

interface EntryMap {
  resource: PerformanceResourceTiming;
  longtask: PerformanceEntry;
  paint: PerformanceEntry;
  mark: PerformanceMark;
  navigation: PerformanceNavigationTiming;
}

export function withEntriesOfType<T extends keyof EntryMap>(
  type: T,
  handler: (entry: EntryMap[T]) => void,
) {
  const initialEntries = performance.getEntriesByType(type);

  initialEntries.forEach(entry => handler(entry));

  const observer = new PerformanceObserver(entries => {
    entries.getEntriesByType(type).forEach(entry => handler(entry));
  });

  observer.observe({
    entryTypes: [type],
    buffered: true,
  });
}

export function withNavigation(
  handler: (details?: {target?: string; timeStamp?: number}) => void,
) {
  const {pushState} = window.history;

  window.addEventListener('popstate', () => {
    handler();
  });

  history.pushState = (...args) => {
    handler({target: args[2] || undefined});
    pushState.call(history, ...args);
  };
}

export function withTiming(
  handler: (timing: typeof performance.timing) => void,
) {
  if (typeof document === 'undefined' || typeof performance === 'undefined') {
    return;
  }

  if (document.readyState === 'complete') {
    handler(performance.timing);
  } else {
    window.addEventListener('load', () => handler(performance.timing), {
      once: true,
    });
  }
}

export const supportsPerformanceObserver =
  typeof PerformanceObserver !== 'undefined';

export function hasGlobal(global: string) {
  return typeof window !== 'undefined' && global in window;
}

interface Range {
  start: number;
  duration: number;
}

export function getUniqueRanges(ranges: Range[]) {
  const uniqueRanges = new Set<Range>();

  ranges.forEach(range => {
    const overlappingRanges = [...uniqueRanges].filter(
      // eslint-disable-next-line no-loop-func
      otherRange => rangesOverlap(range, otherRange),
    );

    for (const overlappingRange of overlappingRanges) {
      uniqueRanges.delete(overlappingRange);
    }

    uniqueRanges.add(squashRanges([range, ...overlappingRanges]));
  });

  return [...uniqueRanges];
}

function rangesOverlap(rangeOne: Range, rangeTwo: Range) {
  const rangeOneEnd = rangeOne.start + rangeOne.duration;
  const rangeTwoEnd = rangeTwo.start + rangeTwo.duration;

  return (
    // rangeOne starts in rangeTwo
    (rangeOne.start >= rangeTwo.start && rangeOne.start <= rangeTwoEnd) ||
    // rangeOne ends in rangeTwo
    (rangeOneEnd >= rangeTwo.start && rangeOneEnd <= rangeTwoEnd) ||
    // rangeTwo entirely within rangeOne
    (rangeTwo.start >= rangeOne.start && rangeTwo.start <= rangeOneEnd)
  );
}

function squashRanges(ranges: Range[]) {
  const [first, ...rest] = ranges;
  return rest.reduce<Range>((fullRange, range) => {
    const start = Math.min(range.start, fullRange.start);
    return {
      start,
      duration:
        Math.max(
          range.start + range.duration,
          fullRange.start + fullRange.duration,
        ) - start,
    };
  }, first);
}
