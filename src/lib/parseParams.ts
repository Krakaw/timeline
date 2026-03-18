/**
 * Try to parse a string as a time value. Accepts:
 *   17:00, 5:30, 1700, 530, 5pm, 5:30pm, 5:30am, 17h30, 5h, etc.
 * Returns "HH:MM" (24h, zero-padded) or undefined if not a time.
 */
function parseTime(input: string): string | undefined {
    const s = input.trim().toLowerCase();

    // 12-hour with am/pm: "5pm", "5:30pm", "5:30am", "530pm"
    const ampmMatch = s.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)$/);
    if (ampmMatch) {
        let hours = parseInt(ampmMatch[1], 10);
        const minutes = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
        if (hours < 1 || hours > 12 || minutes > 59) return undefined;
        if (ampmMatch[3] === 'pm' && hours !== 12) hours += 12;
        if (ampmMatch[3] === 'am' && hours === 12) hours = 0;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    // With colon: "17:00", "5:30"
    const colonMatch = s.match(/^(\d{1,2}):(\d{2})$/);
    if (colonMatch) {
        const hours = parseInt(colonMatch[1], 10);
        const minutes = parseInt(colonMatch[2], 10);
        if (hours > 23 || minutes > 59) return undefined;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    // With h separator: "17h30", "5h", "5h00"
    const hMatch = s.match(/^(\d{1,2})h(\d{2})?$/);
    if (hMatch) {
        const hours = parseInt(hMatch[1], 10);
        const minutes = hMatch[2] ? parseInt(hMatch[2], 10) : 0;
        if (hours > 23 || minutes > 59) return undefined;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    // Bare digits: "1700", "530", "900", "0530"
    // 3-4 digits where first 1-2 are hours, last 2 are minutes
    const bareMatch = s.match(/^(\d{3,4})$/);
    if (bareMatch) {
        const num = bareMatch[1];
        const minutes = parseInt(num.slice(-2), 10);
        const hours = parseInt(num.slice(0, -2), 10);
        if (hours > 23 || minutes > 59) return undefined;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    return undefined;
}

export function parseInputParamsArray(arr: string[]) {
    let from_time;
    let from_date;
    let from_zone;
    const to_zones: string[] = [];

    for (const itemRaw of arr) {
        const item = decodeURIComponent(itemRaw).toLowerCase();

        // Match a combination of date and time in the format of "YYYY-MM-DDT1700" etc.
        const dateTimeMatch = item.match(/^(\d{4}-\d{2}-\d{2})[t\s]?(.+)$/i);
        if (dateTimeMatch) {
            const timePart = parseTime(dateTimeMatch[2]);
            if (timePart) {
                from_date = dateTimeMatch[1];
                from_time = timePart;
                continue;
            }
        }

        // Match an individual date in the format of "YYYY-MM-DD"
        if (item.match(/^\d{4}-\d{2}-\d{2}$/)) {
            if (!from_date) {
                from_date = item;
            }
            continue;
        }

        // Try to parse as a standalone time
        const parsedTime = parseTime(item);
        if (parsedTime) {
            if (!from_time) {
                from_time = parsedTime;
            }
            continue;
        }

        if (!from_zone) {
            from_zone = item;
        } else {
            to_zones.push(item);
        }
    }

    return {from_time, from_date, from_zone, to_zones};
}