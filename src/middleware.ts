import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Check if maintenance mode is enabled
const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

export function middleware(request: NextRequest) {
    // Only apply to API routes
    if (request.nextUrl.pathname.startsWith('/api/') && isMaintenanceMode) {
        return NextResponse.json(
            {
                success: false,
                message: "Service temporarily unavailable due to maintenance",
                data: { maintenance: true }
            },
            { status: 503 }
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};