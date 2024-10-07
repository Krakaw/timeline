import {NextRequest} from 'next/server';
import {ImageResponse} from '@vercel/og';

export const runtime = "edge";

export async function GET(req: NextRequest) {
    const {searchParams} = new URL(req.url);
    const fromTime = decodeURIComponent(searchParams.get('fromTime') || '');
    const toTimes = (searchParams.getAll('toTime') || []).map((time) => decodeURIComponent(time));

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
                            color: '#d4af37',
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
                                justifyContent: 'center',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 40,
                                    fontWeight: 300,
                                    margin: 0,
                                    color: '#d4af37',
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
