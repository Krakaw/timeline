import {notFound} from 'next/navigation';
import {convertTime} from "@/app/utils/timezone";
import {Metadata} from "next";
import {parseInputParamsArray} from "@/app/utils/parseParams";
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

    const {from_zone, to_zones, from_time} = parseInputParamsArray(data || []);
    if (!from_zone || !to_zones.length) {
        return {
            title: 'Timeline'
        }
    }
    const pins = convertTime(from_zone, to_zones, from_time);

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
                    url: `/api/generateImage.jpg?fromTime=${formattedFromTime}&${pins.map(({time}) => `toTime=${time}`).join('&')}`,
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
    const {from_zone = '', to_zones, from_time} = parseInputParamsArray(data || []);


    try {
        const pins = convertTime(from_zone || '', to_zones, from_time);

        return (
            <>
                <WorldMap pins={pins}/>
            </>
        );
    } catch (error) {
        console.log(error)
        notFound(); // Return a 404 page if an error occurs
    }
}
