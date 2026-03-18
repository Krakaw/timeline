/**
 * Public API surface for the timeline package
 * 
 * This barrel export provides the main TimelineMap component,
 * types, and utility functions for timezone conversions.
 */

// Main component - default and named export
export { default, default as TimelineMap } from './TimelineMap';

// Types
export type { TimelineMapProps, Pin } from './TimelineMap';

// Utility functions
export { convertTime, findClosestTimezone } from '../lib/timezone';

// CSS - consumers should import this if using the component
// import 'timeline-v2/dist/TimelineMap.css';
// Or for direct source imports:
// import 'timeline-v2/src/components/TimelineMap.css';
