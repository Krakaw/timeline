import { NextRequest } from 'next/server';
import {timezoneLocations} from "@/app/utils/timezoneLocations";

export const runtime = "edge";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const timezone = decodeURIComponent(searchParams.get('timezone') || '');
    return timezoneLocations.find((location) => location.timezone === timezone) || {timezone: 'Unknown'};
}