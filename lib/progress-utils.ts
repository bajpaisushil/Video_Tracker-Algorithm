/**
 * Merges overlapping intervals to calculate unique watched time
 * @param intervals Array of [start, end] time intervals
 * @returns Array of merged intervals with no overlaps
 */
export function mergeIntervals(intervals: [number, number][]): [number, number][] {
    if (intervals.length === 0) return []
  
    // Sort intervals by start time
    const sortedIntervals = [...intervals].sort((a, b) => a[0] - b[0])
  
    const result: [number, number][] = [sortedIntervals[0]]
  
    for (let i = 1; i < sortedIntervals.length; i++) {
      const current = sortedIntervals[i]
      const lastMerged = result[result.length - 1]
  
      // If current interval overlaps with the last merged interval
      if (current[0] <= lastMerged[1]) {
        // Extend the last merged interval if needed
        lastMerged[1] = Math.max(lastMerged[1], current[1])
      } else {
        // Add the current interval to the result
        result.push(current)
      }
    }
  
    return result
  }
  
  /**
   * Calculates the percentage of unique video watched
   * @param intervals Array of merged [start, end] time intervals
   * @param duration Total duration of the video
   * @returns Percentage of unique video watched (0-100)
   */
  export function calculateProgress(intervals: [number, number][], duration: number): number {
    if (duration === 0 || intervals.length === 0) return 0
  
    // Calculate total unique time watched
    const totalWatched = intervals.reduce((sum, interval) => {
      return sum + (interval[1] - interval[0])
    }, 0)
  
    // Calculate percentage
    return Math.min(100, (totalWatched / duration) * 100)
  }
  
  /**
   * Visualizes watched intervals on a timeline
   * @param intervals Array of [start, end] time intervals
   * @param duration Total duration of the video
   * @returns Array of objects with start and width percentages for visualization
   */
  export function visualizeIntervals(
    intervals: [number, number][],
    duration: number,
  ): { start: number; width: number }[] {
    if (duration === 0) return []
  
    return intervals.map((interval) => {
      const start = (interval[0] / duration) * 100
      const width = ((interval[1] - interval[0]) / duration) * 100
      return { start, width }
    })
  }
  