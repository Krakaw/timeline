'use client';

import './TimelineMap.css';
import { MapContainer, TileLayer, Marker, FeatureGroup, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import terminator from '@joergdietrich/leaflet.terminator';
import React, { useMemo } from 'react';
import { DateTime } from 'luxon';
import { convertTime, findClosestTimezone } from '@/lib/timezone';
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

interface PinPopupProps {
    pin: Pin;
    onEdit: (pin: Pin, date: string, time: string) => void;
}

function PinPopup({ pin, onEdit }: PinPopupProps) {
    const dt = DateTime.fromISO(pin.date, { setZone: true });
    const dtDate = dt.toFormat('yyyy-MM-dd');
    const dtTime = dt.toFormat('HH:mm');
    const tzAbbr = pin.time.split(' ').pop() || '';

    const [timeInput, setTimeInput] = React.useState(dtTime);
    const [timeError, setTimeError] = React.useState(false);

    React.useEffect(() => {
        setTimeInput(dtTime);
        setTimeError(false);
    }, [dtTime]);

    const commitTime = () => {
        const trimmed = timeInput.trim();
        if (!trimmed) {
            setTimeInput(dtTime);
            setTimeError(false);
            return;
        }
        const parsed = parseTime(trimmed);
        if (!parsed) {
            setTimeError(true);
            return;
        }
        setTimeError(false);
        setTimeInput(parsed);
        if (parsed !== dtTime) {
            onEdit(pin, dtDate, parsed);
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        if (newDate && newDate !== dtDate) {
            onEdit(pin, newDate, dtTime);
        }
    };

    return (
        <div className={`pin-popup pin-popup--${pin.isFrom ? 'from' : 'to'}`}>
            <div className="pin-popup-name">{pin.name}</div>
            <div className="pin-popup-row">
                <input
                    type="date"
                    className="pin-popup-input pin-popup-input--date"
                    value={dtDate}
                    onChange={handleDateChange}
                />
                <input
                    type="text"
                    className={`pin-popup-input pin-popup-input--time${
                        timeError ? ' pin-popup-input--error' : ''
                    }`}
                    value={timeInput}
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
            <div className="pin-popup-tz">{tzAbbr}</div>
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

    const handlePinEdit = (pin: Pin, newDate: string, newTime: string) => {
        if (!pin.name) return;
        const newCanonical = pin.name;
        const currentFromCanonical = fromZone ? findClosestTimezone(fromZone) : undefined;

        let newFromZone: string;
        let newToZones: string[];

        if (newCanonical === currentFromCanonical) {
            // Editing the current from-zone — just update time/date, keep zone order/raw form
            newFromZone = fromZone;
            newToZones = toZones;
        } else {
            // Promote this pin to from. Prefer the existing raw form in toZones for clean URLs.
            const existingRaw = toZones.find((z) => findClosestTimezone(z) === newCanonical);
            newFromZone = existingRaw || newCanonical;
            // Remove any toZone that canonicalizes to the new from
            newToZones = toZones.filter((z) => findClosestTimezone(z) !== newCanonical);
            // Prepend the previous from
            if (fromZone) newToZones.unshift(fromZone);
        }

        // Update local pins immediately so library users (no onConfigChange) still see the update
        setPins(convertTime(newFromZone, newToZones, newTime, newDate));

        onConfigChange?.({
            fromZone: newFromZone,
            toZones: newToZones,
            time: newTime,
            date: newDate,
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
                    {validPins.map((pin) => (
                        <Marker
                            key={pin.name}
                            position={[pin.latitude, pin.longitude]}
                            icon={divIcon}
                            eventHandlers={{
                                add: (e) => {
                                    e.target.openPopup();
                                },
                            }}
                        >
                            <Popup autoClose={false} closeButton={false} closeOnClick={false}>
                                <PinPopup pin={pin} onEdit={handlePinEdit} />
                            </Popup>
                        </Marker>
                    ))}
                </FeatureGroup>
            </MapContainer>
        </div>
    );
}
