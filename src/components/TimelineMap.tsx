'use client';

import './TimelineMap.css';
import { MapContainer, TileLayer, Marker, FeatureGroup, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import React, { useMemo } from 'react';
import { DateTime } from 'luxon';
import { convertTime } from '@/lib/timezone';
import { Pin } from '@/lib/types';

export type { Pin };

export interface TimelineMapProps {
    fromZone: string;
    toZones: string[];
    time?: string;
    date?: string;
    theme?: 'light' | 'dark' | 'auto';
    onPinClick?: (pin: Pin) => void;
}

/**
 * Inner component that uses useMap() to fit bounds after render.
 * Must be rendered inside a MapContainer.
 */
function MapFitter({ pins }: { pins: Pin[] }) {
    const map = useMap();

    React.useEffect(() => {
        if (!map || pins.length === 0) return;

        const validPins = pins.filter(
            (p) => typeof p.latitude === 'number' && typeof p.longitude === 'number'
        );
        if (validPins.length === 0) return;

        const bounds = validPins.map((p): [number, number] => [p.latitude, p.longitude]);

        if (bounds.length === 1) {
            map.setView(bounds[0], 5);
        } else {
            map.fitBounds(bounds, { padding: [40, 40] });
        }
    }, [map, pins]);

    return null;
}

/**
 * Resolve the effective theme ('light' | 'dark') from the theme prop.
 * When theme is 'auto', uses prefers-color-scheme media query.
 */
function useEffectiveTheme(theme: 'light' | 'dark' | 'auto'): 'light' | 'dark' {
    const getSystemTheme = (): 'light' | 'dark' =>
        typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';

    const [effectiveTheme, setEffectiveTheme] = React.useState<'light' | 'dark'>(() =>
        theme === 'auto' ? getSystemTheme() : theme
    );

    React.useEffect(() => {
        if (theme !== 'auto') {
            setEffectiveTheme(theme);
            return;
        }

        setEffectiveTheme(getSystemTheme());

        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => setEffectiveTheme(e.matches ? 'dark' : 'light');
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [theme]);

    return effectiveTheme;
}

/**
 * Standalone TimelineMap component — no Next.js dynamic() wrapper required.
 * Accepts timezone props and internally computes Pin positions via timezone utils.
 */
export default function TimelineMap({
    fromZone,
    toZones,
    time,
    date,
    theme = 'light',
    onPinClick,
}: TimelineMapProps) {
    const effectiveTheme = useEffectiveTheme(theme);

    const [pins, setPins] = React.useState<Pin[]>(() =>
        convertTime(fromZone, toZones, time, date)
    );

    // Recompute pins when props change
    React.useEffect(() => {
        setPins(convertTime(fromZone, toZones, time, date));
    }, [fromZone, toZones, time, date]);

    // Fix 1: Wrap divIcon in useMemo to avoid recreating on every render
    const divIcon = useMemo(
        () =>
            L.divIcon({
                className: 'custom-icon',
                html: `<div class="circle"></div>`,
            }),
        []
    );

    const handlePinClick = (pin: Pin) => {
        setPins((prev) => {
            const updated = prev.map((p) => ({ ...p, isFrom: false }));
            const idx = updated.findIndex(
                (p) => p.latitude === pin.latitude && p.longitude === pin.longitude
            );
            if (idx !== -1) updated[idx] = { ...updated[idx], isFrom: true };
            return updated;
        });
        onPinClick?.(pin);
    };

    const validPins = pins.filter((p) => !p.invalid);
    const invalidPins = pins.filter((p) => p.invalid);

    return (
        <div className={`timeline-map timeline-map--${effectiveTheme}`}>
            {invalidPins.length > 0 && (
                <div className="timeline-map-invalid-banner">
                    Unknown timezone{invalidPins.length > 1 ? 's' : ''}:{' '}
                    {invalidPins.map((p) => `"${p.name}"`).join(', ')}
                </div>
            )}
            <MapContainer
                zoom={3}
                center={[0, 0]}
                className={effectiveTheme === 'dark' ? 'timeline-map-dark' : ''}
                style={{ height: '100vh', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <MapFitter pins={validPins} />
                <FeatureGroup>
                    {validPins.map((pin, index) => {
                        const dt = DateTime.fromISO(pin.date, { setZone: true });
                        return (
                            <Marker
                                key={index}
                                position={[pin.latitude, pin.longitude]}
                                icon={divIcon}
                                eventHandlers={{
                                    add: (e) => {
                                        e.target.openPopup();
                                    },
                                }}
                            >
                                <Popup autoClose={false} closeButton={false} closeOnClick={false}>
                                    {pin.isFrom ? (
                                        <h1>
                                            {pin.time.split(' ').pop()}
                                            <br />
                                            {dt.toFormat('yyyy-MM-dd HH:mm')}
                                        </h1>
                                    ) : (
                                        <h3 onClick={() => handlePinClick(pin)}>
                                            {pin.time.split(' ').pop()}
                                            <br />
                                            {dt.toFormat('yyyy-MM-dd HH:mm')}
                                        </h3>
                                    )}
                                </Popup>
                            </Marker>
                        );
                    })}
                </FeatureGroup>
            </MapContainer>
        </div>
    );
}
