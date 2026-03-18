'use client';

import './TimelineMap.css';
import { MapContainer, TileLayer, Marker, FeatureGroup, Popup, useMap } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import React from 'react';
import { DateTime } from 'luxon';
import { convertTime } from '@/lib/timezone';
import { Pin } from '@/lib/types';

export type { Pin };

export interface TimelineMapProps {
    fromZone: string;
    toZones: string[];
    time?: string;
    date?: string;
    theme?: 'dark' | 'light';
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
 * Standalone TimelineMap component — no Next.js dynamic() wrapper required.
 * Accepts timezone props and internally computes Pin positions via timezone utils.
 */
export default function TimelineMap({
    fromZone,
    toZones,
    time,
    date,
    theme = 'dark',
    onPinClick,
}: TimelineMapProps) {
    const [pins, setPins] = React.useState<Pin[]>(() =>
        convertTime(fromZone, toZones, time, date)
    );

    // Recompute pins when props change
    React.useEffect(() => {
        setPins(convertTime(fromZone, toZones, time, date));
    }, [fromZone, toZones, time, date]);

    const divIcon = new DivIcon({
        className: 'custom-icon',
        html: `<div class="circle"></div>`,
    });

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

    return (
        <MapContainer
            zoom={3}
            center={[0, 0]}
            className={theme === 'dark' ? 'timeline-map-dark' : ''}
            style={{ height: '100vh', width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <MapFitter pins={pins} />
            <FeatureGroup>
                {pins.map((pin, index) => {
                    const dt = DateTime.fromISO(pin.date, { setZone: true });
                    return (
                        <Marker
                            key={index}
                            position={[pin.latitude, pin.longitude]}
                            icon={divIcon}
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
    );
}
