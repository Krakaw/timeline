export function parseInputParamsArray(arr: string[]) {
    let from_time;
    let from_date;
    let from_zone;
    const to_zones: string[] = [];

    for (const itemRaw of arr) {
        const item = decodeURIComponent(itemRaw).toLowerCase();

        // Match a combination of date and time in the format of "YYYY-MM-DD HH:MM"
        const match = item.match(/(\d{4}-\d{2}-\d{2})[t\s]?(\d{1,2}:\d{1,2})/i);
        if (match) {
            from_date = match[1];
            const time = match[2];
            // Add a leading zero to the hours and minutes if they are single digits
            const [hours, minutes] = time.split(':');
            from_time = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }
        // Match an individual date in the format of "YYYY-MM-DD"
        else if (item.match(/\d{4}-\d{2}-\d{2}/)) {
            if (!from_date) {
                from_date = item;
            }
        } else if (item.match(/\d{1,2}:\d{1,2}/)) {
            if (!from_time) {
                // Populate from_time if item contains a colon (assuming it's a time value)
                // Make sure the time always has a leading zero
                const [hours, minutes] = item.split(':');
                from_time = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
            }
        } else if (!from_zone) {
            // If from_zone is not yet populated, use the first non-time value
            from_zone = item;
        } else {
            // All subsequent non-time values go to to_zones
            to_zones.push(item);
        }
    }

    return {from_time, from_date, from_zone, to_zones};
}