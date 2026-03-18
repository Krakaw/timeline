import React from 'react';
import { DateTime } from 'luxon';

interface Pin {
    name: string;
    latitude: number;
    longitude: number;
    time: string;
    date: string;
    dateTime?: DateTime;
    isFrom: boolean;
}

interface TimelineMapProps {
    fromZone: string;
    toZones: string[];
    time?: string;
    date?: string;
    theme?: 'dark' | 'light';
    onPinClick?: (pin: Pin) => void;
}
/**
 * Standalone TimelineMap component — no Next.js dynamic() wrapper required.
 * Accepts timezone props and internally computes Pin positions via timezone utils.
 */
declare function TimelineMap({ fromZone, toZones, time, date, theme, onPinClick, }: TimelineMapProps): React.JSX.Element;

declare function findClosestTimezone(query: string): string | undefined;
declare function convertTime(fromZoneRaw: string, toZonesRaw: string[], fromTimeRaw?: string, fromDateRaw?: string): Pin[];

export { type Pin, TimelineMap, type TimelineMapProps, convertTime, TimelineMap as default, findClosestTimezone };
