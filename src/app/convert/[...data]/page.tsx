import {notFound} from 'next/navigation';
import {convertTime} from "@/app/utils/timezone";
import {Metadata} from "next";

interface PageProps {
    params: {
        data?: string[]
        // from_time?: string;
        // from_zone: string;
        // to_zone: string;
    };
}


export async function generateMetadata({params}: PageProps) : Promise<Metadata>{
    const {data} = params;
    const [from_zone, to_zone, from_time] = data || [];
    const {fromTime, fromZone, toZone, convertedTime, formattedFromTime} = convertTime(from_zone, to_zone, from_time);


    return {
        // metadataBase: ''
        title: `${formattedFromTime}`,
        description: `${fromTime} ${fromZone} is ${convertedTime} ${toZone}.`,
        openGraph: {
            title: `Convert ${fromTime} ${fromZone} to ${toZone}`,
            description: `${fromTime} ${fromZone} is ${convertedTime} ${toZone}.`,
            images: [
                {
                    url: `/api/generateImage?fromTime=${formattedFromTime}&toTime=${convertedTime}`,
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
    const [from_zone, to_zone, from_time] = data || [];

    try {

        const {convertedTime, formattedFromTime} = convertTime(from_zone, to_zone, from_time);


        return (
            <div style={{fontFamily: 'Arial, sans-serif', textAlign: 'center', padding: '50px'}}>
                <h1>Timezone Conversion</h1>
                <p>
                    <strong>From:</strong> {formattedFromTime}
                </p>
                <p>
                    <strong>To:</strong> {convertedTime}
                </p>
            </div>
        );
    } catch (error) {
        console.log(error)
        notFound(); // Return a 404 page if an error occurs
    }
}
