import { NextRequest } from 'next/server';
import { ImageResponse } from '@vercel/og';

export const runtime = "edge";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const fromTime = decodeURIComponent(searchParams.get('fromTime') || '');
    const toTime = decodeURIComponent(searchParams.get('toTime') || '');

    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    width: '100%',
                    backgroundColor: '#2e2e2e', // A dark grey background for an elegant look
                    color: '#e6e6e6', // Soft off-white for a sophisticated contrast
                    fontFamily: '"Times New Roman", Times, serif', // Classic serif font for a refined look
                    padding: '40px',
                }}
            >
                <p
                    style={{
                        fontSize: 60,
                        fontWeight: 600,
                        margin: 0,
                        color: '#d4af37', // Subtle gold color for elegance
                    }}
                >
                    {fromTime}
                </p>
                <p
                    style={{
                        fontSize: 36,
                        fontWeight: 400,
                        margin: '20px 0',
                        color: '#b0b0b0', // Muted light grey for "to" text
                    }}
                >
                    to
                </p>
                <p
                    style={{
                        fontSize: 60,
                        fontWeight: 600,
                        margin: 0,
                        color: '#d4af37', // Match gold for consistency
                    }}
                >
                    {toTime}
                </p>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
