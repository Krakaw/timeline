'use client';

import './TimelineMap.css';
import { MapContainer, TileLayer, Marker, FeatureGroup, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import terminator from '@joergdietrich/leaflet.terminator';
import React, { useMemo } from 'react';
import { DateTime } from 'luxon';
import { convertTime } from '@/lib/timezone';
import { parseTime } from '@/lib/parseParams';
import { Pin } from '@/lib/types';

export type { Pin };

export interface TimelineConfig {
    fromZone: string;
    toZones: string[];
    time?: string;
    date?: string;
}

export interface TimelineMapProps {
    fromZone: string;
    toZones: string[];
    time?: string;
    date?: string;
    theme?: 'light' | 'dark' | 'auto';
    terminator?: boolean;
    showControls?: boolean;
    onPinClick?: (pin: Pin) => void;
    onConfigChange?: (config: TimelineConfig) => void;
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
 * Renders the day/night terminator overlay on the map.
 * Uses the from-pin's datetime so the shadow matches the displayed time.
 */
function DayNightTerminator({ pins }: { pins: Pin[] }) {
    const map = useMap();

    React.useEffect(() => {
        if (!map) return;

        const fromPin = pins.find((p) => p.isFrom && p.date);
        const time = fromPin ? new Date(fromPin.date) : undefined;

        const layer = terminator({ time });
        layer.addTo(map);

        return () => {
            map.removeLayer(layer);
        };
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

interface ControlsPanelProps {
    fromZone: string;
    toZones: string[];
    time: string;
    date: string;
    onChange: (config: TimelineConfig) => void;
}

function ControlsPanel({ fromZone, toZones, time, date, onChange }: ControlsPanelProps) {
    const [newZone, setNewZone] = React.useState('');
    const [timeInput, setTimeInput] = React.useState(time);
    const [timeError, setTimeError] = React.useState(false);

    // Keep the local time input in sync when external time changes
    React.useEffect(() => {
        setTimeInput(time);
        setTimeError(false);
    }, [time]);

    const addZone = () => {
        const trimmed = newZone.trim();
        if (!trimmed) return;
        if (!fromZone) {
            onChange({ fromZone: trimmed, toZones, time, date });
        } else {
            onChange({ fromZone, toZones: [...toZones, trimmed], time, date });
        }
        setNewZone('');
    };

    const removeZone = (index: number) => {
        // index 0 = fromZone; index >= 1 = toZones[index - 1]
        if (index === 0) {
            // Promote the first toZone (if any) to fromZone
            const [nextFrom, ...rest] = toZones;
            onChange({ fromZone: nextFrom || '', toZones: rest, time, date });
        } else {
            const nextToZones = toZones.filter((_, i) => i !== index - 1);
            onChange({ fromZone, toZones: nextToZones, time, date });
        }
    };

    const commitTime = () => {
        const trimmed = timeInput.trim();
        if (!trimmed) {
            // Empty = clear time (use "now")
            setTimeError(false);
            if (time) onChange({ fromZone, toZones, time: undefined, date });
            return;
        }
        const parsed = parseTime(trimmed);
        if (!parsed) {
            setTimeError(true);
            return;
        }
        setTimeError(false);
        setTimeInput(parsed);
        if (parsed !== time) {
            onChange({ fromZone, toZones, time: parsed, date });
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onChange({ fromZone, toZones, time, date: value || undefined });
    };

    const allZones = fromZone ? [fromZone, ...toZones] : toZones;

    return (
        <div className="timeline-map-controls">
            <div className="timeline-map-controls-row">
                <label className="timeline-map-controls-label">Date</label>
                <input
                    type="date"
                    className="timeline-map-controls-input"
                    value={date || ''}
                    onChange={handleDateChange}
                />
                <label className="timeline-map-controls-label">Time</label>
                <input
                    type="text"
                    className={`timeline-map-controls-input timeline-map-controls-input--time${
                        timeError ? ' timeline-map-controls-input--error' : ''
                    }`}
                    value={timeInput}
                    placeholder="e.g. 1900 or 08:00"
                    onChange={(e) => {
                        setTimeInput(e.target.value);
                        if (timeError) setTimeError(false);
                    }}
                    onBlur={commitTime}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            commitTime();
                        }
                    }}
                />
            </div>
            <div className="timeline-map-controls-zones">
                {allZones.length === 0 && (
                    <span className="timeline-map-controls-empty">No timezones added yet</span>
                )}
                {allZones.map((zone, i) => (
                    <span
                        key={`${zone}-${i}`}
                        className={`timeline-map-controls-chip${
                            i === 0 ? ' timeline-map-controls-chip--from' : ''
                        }`}
                    >
                        {i === 0 && <span className="timeline-map-controls-chip-label">from</span>}
                        {zone}
                        <button
                            type="button"
                            className="timeline-map-controls-chip-remove"
                            aria-label={`Remove ${zone}`}
                            onClick={() => removeZone(i)}
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>
            <div className="timeline-map-controls-row">
                <input
                    type="text"
                    className="timeline-map-controls-input timeline-map-controls-input--zone"
                    value={newZone}
                    placeholder="Add timezone (e.g. tokyo, pst, Europe/London)"
                    onChange={(e) => setNewZone(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addZone();
                        }
                    }}
                />
                <button
                    type="button"
                    className="timeline-map-controls-button"
                    onClick={addZone}
                    disabled={!newZone.trim()}
                >
                    Add
                </button>
            </div>
        </div>
    );
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
    terminator: showTerminator = false,
    showControls = true,
    onPinClick,
    onConfigChange,
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
        // Notify parent so URL/state can swap from/to ordering
        if (onConfigChange && pin.name) {
            const clickedName = pin.name;
            if (clickedName !== fromZone) {
                const nextToZones = toZones.filter((z) => z !== clickedName);
                if (fromZone) nextToZones.unshift(fromZone);
                onConfigChange({ fromZone: clickedName, toZones: nextToZones, time, date });
            }
        }
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
            {showControls && onConfigChange && (
                <ControlsPanel
                    fromZone={fromZone}
                    toZones={toZones}
                    time={time || ''}
                    date={date || ''}
                    onChange={onConfigChange}
                />
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
                {showTerminator && <DayNightTerminator pins={validPins} />}
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
