import levenshtein from 'fast-levenshtein';
import {DateTime} from "luxon";
import {Pin} from "@/app/components/WorldMap";
import {timezoneLocations} from "@/app/utils/timezoneLocations";

// List of common timezone abbreviations mapped to IANA equivalents
const timezoneAbbreviations: Record<string, string> = {
    "gmt": "Etc/GMT",
    "utc": "Etc/UTC",
    "est": "America/New_York",
    "edt": "America/New_York",
    "cst": "America/Chicago",
    "cdt": "America/Chicago",
    "mst": "America/Denver",
    "mdt": "America/Denver",
    "pst": "America/Los_Angeles",
    "pdt": "America/Los_Angeles",
    "akst": "America/Anchorage",
    "akdt": "America/Anchorage",
    "hst": "Pacific/Honolulu",
    "aest": "Australia/Sydney",
    "aedt": "Australia/Sydney",
    "acst": "Australia/Darwin",
    "acdt": "Australia/Adelaide",
    "awst": "Australia/Perth",
    "bst": "Europe/London",
    "cet": "Europe/Paris",
    "cest": "Europe/Paris",
    "wet": "Europe/Lisbon",
    "wemt": "Europe/Lisbon",
    "eet": "Europe/Athens",
    "eest": "Europe/Athens",
    "ist": "Asia/Kolkata",
    "pkst": "Asia/Karachi",
    "pst_ph": "Asia/Manila",
    "pht": "Asia/Manila",
    "kst": "Asia/Seoul",
    "jst": "Asia/Tokyo",
    "sast": "Africa/Johannesburg",
    "cat": "Africa/Maputo",
    "eat": "Africa/Nairobi",
    "wast": "Africa/Lagos",
    "wat": "Africa/Lagos",
    "wib": "Asia/Jakarta",
    "wita": "Asia/Makassar",
    "wit": "Asia/Jayapura",
    "gulf": "Asia/Dubai",
    "ast": "America/Puerto_Rico",
    "adt": "America/Halifax",
    "nst": "America/St_Johns",
    "ndt": "America/St_Johns",
    "brt": "America/Sao_Paulo",
    "art": "America/Argentina/Buenos_Aires",
    "pyt": "America/Asuncion",
    "uyt": "America/Montevideo",
    "clt": "America/Santiago",
    "vlst": "America/Caracas",
    "msk": "Europe/Moscow",
    "omsk": "Asia/Omsk",
    "yeet": "Asia/Yekaterinburg",
    "krast": "Asia/Krasnoyarsk",
    "irkt": "Asia/Irkutsk",
    "yakt": "Asia/Yakutsk",
    "vlat": "Asia/Vladivostok",
    "chot": "Asia/Choibalsan"
};


// Merge IANA timezones and the shorthand abbreviations into a single array
const allTimezones: { name: string, canonical: string }[] = [


    ...Intl.supportedValuesOf('timeZone').map((tz) => ({name: tz, canonical: tz})),
];

export function findClosestTimezone(query: string): string | undefined {
    const normalizedQuery = query.toLowerCase();

    const exactMatch = allTimezones.find((tz) => {
        const [, city] = tz.name.toLowerCase().split('/');
        return tz.name.toLowerCase() === normalizedQuery || city === normalizedQuery;
    });
    if (exactMatch) {
        return exactMatch.canonical;
    }
    let closestMatch: { name: string, canonical: string } | undefined;
    let smallestDistance = Infinity;


    allTimezones.forEach((tz) => {
        const [, city] = tz.name.toLowerCase().split('/');
        const distance = levenshtein.get(city, normalizedQuery);
        if (distance < smallestDistance) {
            smallestDistance = distance;
            closestMatch = tz;
        }
    });

    return timezoneAbbreviations[normalizedQuery] ?? closestMatch?.canonical
}

export function convertTime(fromZoneRaw: string, toZonesRaw: string[], fromTimeRaw?: string) {

    const fromZone = findClosestTimezone(fromZoneRaw);
    const fromTime = decodeURIComponent(fromTimeRaw || DateTime.now().setZone(fromZone).toFormat('HH:mm'));


    const fromDateTime = DateTime.fromFormat(`${fromTime}`, 'HH:mm', {
        zone: fromZone,
    });

    if (!fromDateTime.isValid) {
        throw new Error('Invalid time format');
    }

    const {latitude, longitude} = timezoneLocations.find((location) => location.timezone === fromZone) || {
        latitude: 0,
        longitude: 0
    };
    const fromPin: Pin = {
        name: fromZone || '',
        latitude,
        longitude,
        time: fromDateTime.toFormat('yyyy-MM-dd HH:mm z'),
        date: fromDateTime.toISO(),
        isFrom: true
    }

    const toZones = toZonesRaw.map(findClosestTimezone);
    const toPins: Pin[] = toZones.map((toZone) => {
        const {
            latitude,
            longitude
        } = timezoneLocations.find((location) => location.timezone === toZone) || {latitude: 0, longitude: 0};
        const date = fromDateTime.setZone(toZone);
        const toDateTimeString = date.toFormat('yyyy-MM-dd HH:mm z');
        return {
            name: toZone,
            latitude,
            longitude,
            time: toDateTimeString,
            date: date.toISO(),
            isFrom: false
        } as Pin;
    });
    toPins.push(fromPin);

    return toPins;
}