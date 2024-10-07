import {NextRequest} from 'next/server';
import {timezoneLocations} from "@/app/utils/timezoneLocations";
import {NextApiResponse} from "next";

export const runtime = "edge";

export function GET(req: NextRequest, res: NextApiResponse<{ timezone: string }>) {
    const {searchParams} = new URL(req.url);
    const timezone = decodeURIComponent(searchParams.get('timezone') || '');
    const response = timezoneLocations.find((location) => location.timezone === timezone) || {timezone: 'Unknown'};

    res.status(200).json(response)
}