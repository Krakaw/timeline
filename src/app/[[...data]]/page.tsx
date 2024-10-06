import {notFound} from 'next/navigation';
import {convertTime} from "@/app/utils/timezone";
import {Metadata} from "next";
import {parseArray} from "@/app/utils/parseParams";
import {Pin} from "@/app/components/WorldMap";
import {timezoneLocations} from "@/app/utils/timezoneLocations";
import dynamic from "next/dynamic";

const WorldMap = dynamic(() => import("@/app/components/WorldMap"), {
    ssr: false, // Disables server-side rendering for this component
});

interface PageProps {
    params: {
        data?: string[]
    };
}


export async function generateMetadata({params}: PageProps): Promise<Metadata> {
    const {data} = params;

    const {from_zone, to_zones, from_time} = parseArray(data || []);
    if (!from_zone || !to_zones.length) {
        return {
            title: 'Timeline'
        }
    }
    const {convertedTimes, formattedFromTime} = convertTime(from_zone, to_zones, from_time);


    return {
        title: `${formattedFromTime}`,
        description: `${formattedFromTime} to ${convertedTimes.length > 0 ? convertedTimes[0] : 'N/A'}.`,
        openGraph: {
            title: `${formattedFromTime}`,
            description: `${formattedFromTime} to ${convertedTimes.length > 0 ? convertedTimes[0] : 'N/A'}.`,
            images: [
                {
                    url: `/api/generateImage?fromTime=${formattedFromTime}&${convertedTimes.map((time) => `toTime=${time}`).join('&')}`,
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
    const {from_zone = '', to_zones, from_time} = parseArray(data || []);


    try {

        const {
            convertedTimes,
            formattedFromTime,
            fromZone
        } = convertTime(from_zone || '', to_zones, from_time);

        const {
            latitude,
            longitude
        } = timezoneLocations.find((location) => location.timezone === fromZone) || {latitude: 0, longitude: 0};
        const fromZoneData = {
            name: from_zone,
            latitude,
            longitude,
            time: formattedFromTime
        }


        return (
            <>
                <WorldMap fromZone={fromZoneData} toZones={convertedTimes}/>
            </>
        );
    } catch (error) {
        console.log(error)
        notFound(); // Return a 404 page if an error occurs
    }
}
