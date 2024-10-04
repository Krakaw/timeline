import {notFound} from 'next/navigation';
import {convertTime} from "@/app/utils/timezone";
import {Metadata} from "next";
import InteractiveTimeline from "@/components/interactiveTimeline";
import {parseArray} from "@/app/utils/parseParams";

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
    const { convertedTimes, formattedFromTime} = convertTime(from_zone, to_zones, from_time);


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
    const {from_zone, to_zones, from_time} = parseArray(data || []);


    try {
        if (!from_zone || !to_zones.length) {
            return (
                <InteractiveTimeline/>
            );
        }
        const {convertedTimes, formattedFromTime} = convertTime(from_zone, to_zones, from_time);


        return (
            <div style={{fontFamily: 'Arial, sans-serif', textAlign: 'center', padding: '50px'}}>
                <h1>Timezone Conversion</h1>
                <p>
                    <strong>From:</strong> {formattedFromTime}
                </p>
                {convertedTimes.map((convertedTime, index) => (
                    <p key={index}>
                        <strong>To:</strong> {convertedTime}
                    </p>
                ))}
            </div>
        );
    } catch (error) {
        console.log(error)
        notFound(); // Return a 404 page if an error occurs
    }
}
