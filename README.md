# Timeline

A Next.js web app that converts times across timezones and displays them on an interactive world map.

## Live Demo

[https://timeline.dyn-ip.me](https://timeline.dyn-ip.me)

## Usage

Navigate to the app with a URL-encoded path:

```
/<from_zone>/<to_zone1>/<to_zone2>/[date]/[time]
```

### Examples

Convert the current time from Vancouver to London and Tokyo:
```
/vancouver/london/tokyo
```

Convert a specific time on a specific date:
```
/new_york/sydney/2024-03-15/14:30
```

### URL Parameters

Parameters are positional path segments. Order matters:

| Segment | Format | Description |
|---------|--------|-------------|
| `from_zone` | Timezone name or abbreviation | Source timezone (first non-time, non-date value) |
| `to_zone` | Timezone name or abbreviation | One or more destination timezones |
| `date` | `YYYY-MM-DD` | Date to convert (optional, defaults to today) |
| `time` | `HH:MM` | Time to convert (optional, defaults to current time) |

### Timezone Formats

Timezones can be specified as:
- **IANA names:** `America/Vancouver`, `Europe/London`, `Asia/Tokyo`
- **City names (fuzzy):** `vancouver`, `london`, `tokyo` (fuzzy matched via Levenshtein distance)
- **Common abbreviations:** `pst`, `est`, `gmt`, `utc`, `jst`, `bst`, etc.

## `<WorldMap />` Component

The interactive map component renders pins for each timezone with popups showing local times.

### Import

```tsx
import dynamic from 'next/dynamic';

// Must be loaded dynamically with SSR disabled (uses Leaflet)
const WorldMap = dynamic(() => import('@/app/components/WorldMap'), {
  ssr: false,
});
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `pins` | `Pin[]` | Array of timezone pins to display on the map |

### `Pin` Type

```ts
import type { Pin } from '@/app/components/WorldMap';

interface Pin {
  name: string;       // Timezone name (e.g. "America/Vancouver")
  latitude: number;   // Geographic latitude
  longitude: number;  // Geographic longitude
  time: string;       // Formatted local time string (e.g. "2024-03-15 14:30 PST")
  date: string;       // ISO 8601 datetime string
  dateTime?: DateTime; // Luxon DateTime (populated at render time)
  isFrom: boolean;    // true = source timezone (highlighted differently)
}
```

### Example

```tsx
import dynamic from 'next/dynamic';
import { convertTime } from '@/lib/timezone';

const WorldMap = dynamic(() => import('@/app/components/WorldMap'), {
  ssr: false,
});

export default function MyPage() {
  const pins = convertTime('America/Vancouver', ['Europe/London', 'Asia/Tokyo']);

  return <WorldMap pins={pins} />;
}
```

## Core Libraries

### `convertTime(fromZone, toZones, fromTime?, fromDate?)`

Converts a time from one timezone to multiple destination timezones and returns `Pin[]` with geographic coordinates.

```ts
import { convertTime } from '@/lib/timezone';

const pins = convertTime(
  'America/Vancouver',          // source timezone
  ['Europe/London', 'Asia/Tokyo'], // destination timezones
  '14:30',                      // optional: time (HH:MM), defaults to now
  '2024-03-15'                  // optional: date (YYYY-MM-DD), defaults to today
);
```

### `findClosestTimezone(query)`

Resolves a fuzzy timezone string to an IANA timezone name.

```ts
import { findClosestTimezone } from '@/lib/timezone';

findClosestTimezone('london');    // => "Europe/London"
findClosestTimezone('pst');       // => "America/Los_Angeles"
findClosestTimezone('vancouver'); // => "America/Vancouver"
```

## Development

```bash
npm install
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

## Docker

```bash
docker-compose up
```
