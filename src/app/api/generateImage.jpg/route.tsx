import {NextRequest} from 'next/server';
import {ImageResponse} from '@vercel/og';

export const runtime = "edge";

function getColorBasedOnTime(timeString: string) {
    const timeRegex = /(\d{1,2}):(\d{2})/;
    if (!timeRegex.test(timeString)) {
        return '#ff0000'; // Red
    }
    const matches = timeString.match(timeRegex) || [];
    const hours = parseInt(matches[1], 10);
    const minutes = parseInt(matches[2], 10);
    const totalMinutes = hours * 60 + minutes;
    const startOfDay = 8 * 60; // 8 AM in minutes
    const endOfDay = 17 * 60; // 5 PM in minutes

    if (totalMinutes < startOfDay || totalMinutes > endOfDay) {
        return '#0a90d8'; // Dark blue
    } else {
        return '#ffd700'; // Yellow
    }
}

export async function GET(req: NextRequest) {
    const {searchParams} = new URL(req.url);
    const fromTime = decodeURIComponent(searchParams.get('fromTime') || '');
    const toTimes = (searchParams.getAll('toTime') || []).map((time) => decodeURIComponent(time));

    const fromTimeColor = getColorBasedOnTime(fromTime);

    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch', // Ensure children stretch to fill the cross-axis
                    height: '100%',
                    width: '100%',
                    backgroundColor: '#2e2e2e',
                    color: '#e6e6e6',
                    fontFamily: '"Times New Roman", Times, serif',
                    padding: '40px',
                }}
            >
                {/* From Time */}
                <div
                    style={{
                        flex: 1, // Each child will have equal height
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <p
                        style={{
                            fontSize: 50,
                            fontWeight: 600,
                            margin: 0,
                            color: fromTimeColor,
                        }}
                    >
                        {fromTime}
                    </p>
                </div>

                {/* "to" Text */}
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <p
                        style={{
                            fontSize: 50,
                            fontWeight: 200,
                            margin: '20px 0',
                            color: '#b0b0b0',
                        }}
                    >
                        to
                    </p>
                </div>

                {/* To Times */}
                {toTimes.map((toTime) => (
                    <div
                        key={toTime}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: '#3f3f3f',
                                borderRadius: 10,
                                padding: '20px',
                                margin: '10px 0',
                                display: 'flex',
                                alignItems: 'center',
                                width: '1200px', // Set a fixed width for uniformity
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 40,
                                    fontWeight: 300,
                                    margin: 0,
                                    color: getColorBasedOnTime(toTime),
                                    textAlign: 'left', // Align text to the left
                                    width: '100%', // Ensure text takes the full width of the container
                                }}
                            >
                                {toTime}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        ),
        {
            // 16:9 aspect ratio
            width: 1200,
            height: 630,
        }
    );
}
