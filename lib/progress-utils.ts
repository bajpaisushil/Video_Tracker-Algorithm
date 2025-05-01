export function mergeIntervals(
  intervals: [number, number][]
): [number, number][] {
  if (intervals.length === 0) return [];

  const sortedIntervals = [...intervals].sort((a, b) => a[0] - b[0]);

  const result: [number, number][] = [sortedIntervals[0]];

  for (let i = 1; i < sortedIntervals.length; i++) {
    const current = sortedIntervals[i];
    const lastMerged = result[result.length - 1];

    if (current[0] <= lastMerged[1]) {
      lastMerged[1] = Math.max(lastMerged[1], current[1]);
    } else {
      result.push(current);
    }
  }

  return result;
}

export function calculateProgress(
  intervals: [number, number][],
  duration: number
): number {
  if (duration === 0 || intervals.length === 0) return 0;

  const totalWatched = intervals.reduce((sum, interval) => {
    return sum + (interval[1] - interval[0]);
  }, 0);

  return Math.min(100, (totalWatched / duration) * 100);
}

export function visualizeIntervals(
  intervals: [number, number][],
  duration: number
): { start: number; width: number }[] {
  if (duration === 0) return [];

  return intervals.map((interval) => {
    const start = (interval[0] / duration) * 100;
    const width = ((interval[1] - interval[0]) / duration) * 100;
    return { start, width };
  });
}
