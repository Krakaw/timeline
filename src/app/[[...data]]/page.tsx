import {convertTime} from "@/lib/timezone";
import {Metadata} from "next";
import {parseInputParamsArray} from "@/lib/parseParams";
import dynamic from "next/dynamic";

// TimelineMap uses Leaflet which requires browser APIs — disable SSR at the page boundary.
const TimelineMap = dynamic(() => import("@/components/TimelineMap"), {
    ssr: false,
});

interface PageProps {
    params: {
        data?: string[]
    };
}


export async function generateMetadata({params}: PageProps): Promise<Metadata> {
    const {data} = params;

    const {from_zone, to_zones, from_time, from_date} = parseInputParamsArray(data || []);
    if (!from_zone || !to_zones.length) {
        return {
            title: 'Timeline'
        }
    }
    const pins = convertTime(from_zone, to_zones, from_time, from_date);

    const fromPin = pins.find(({isFrom}) => isFrom);
    const formattedFromTime = fromPin?.time;
    return {
        metadataBase: new URL('https://timeline.dyn-ip.me'),
        title: `Timeline`,
        description: `When the time is ${formattedFromTime}`,
        openGraph: {
            type: 'website',
            url: new URL('https://timeline.dyn-ip.me'),
            title: `Timeline`,
            description: `When the time is ${formattedFromTime}`,
            images: [
                {
                    url: `/api/generateImage.jpg?fromTime=${formattedFromTime}&${pins.filter(p => !p.isFrom).map(({time}) => `toTime=${time}`).join('&')}`,
                    width: 1200,
                    height: 630,
                    alt: 'Converted Time',
                },
            ],
        },
    };
}

export default function ConversionPage({params}: PageProps) {
    const {data} = params;
    const {from_zone = '', to_zones, from_time, from_date} = parseInputParamsArray(data || []);

    return (
        <TimelineMap
            fromZone={from_zone || ''}
            toZones={to_zones}
            time={from_time}
            date={from_date}
        />
    );
}
