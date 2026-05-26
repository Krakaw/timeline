'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { TimelineConfig } from '@/components/TimelineMap';

// TimelineMap uses Leaflet which requires browser APIs — disable SSR.
const TimelineMap = dynamic(() => import('@/components/TimelineMap'), {
    ssr: false,
});

interface Props {
    fromZone: string;
    toZones: string[];
    time?: string;
    date?: string;
}

function buildPath({ fromZone, toZones, time, date }: TimelineConfig): string {
    const parts: string[] = [];
    if (fromZone) parts.push(fromZone);
    parts.push(...toZones);
    if (date) parts.push(date);
    if (time) parts.push(time);
    if (parts.length === 0) return '/';
    return '/' + parts.map(encodeURIComponent).join('/');
}

export default function TimelineMapWithUrlSync(initial: Props) {
    const router = useRouter();
    const [config, setConfig] = useState<TimelineConfig>({
        fromZone: initial.fromZone,
        toZones: initial.toZones,
        time: initial.time,
        date: initial.date,
    });

    // Push URL changes whenever config changes
    useEffect(() => {
        router.replace(buildPath(config), { scroll: false });
    }, [router, config]);

    return (
        <TimelineMap
            fromZone={config.fromZone}
            toZones={config.toZones}
            time={config.time}
            date={config.date}
            terminator
            onConfigChange={setConfig}
        />
    );
}
