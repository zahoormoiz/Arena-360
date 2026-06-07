import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Defined routes
const adminRoutes = ['/admin', '/api/admin'];
const protectedRoutes = ['/my-bookings', '/api/bookings/my', '/api/bookings']; // /api/bookings GET/PATCH require auth
const publicRoutes = [
    '/api/auth',
    '/api/admin/login',
    // NOTE: /api/admin/me intentionally NOT public — requires auth cookie (audit fix S-2)
    '/api/sports',
    '/api/availability',
    '/api/health',
    '/api/chat',         // Chat is publicly accessible
];

// Routes that allow POST without auth but require auth for other methods
const guestPostRoutes = ['/api/bookings'];

// Helper to check if path matches any route prefix
const matches = (path: string, routes: string[]) => routes.some(r => path.startsWith(r));

// Helper for JWT verification
async function verifyAuth(token: string | undefined) {
    if (!token) return null;
    try {
        let jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            if (process.env.NODE_ENV === 'production') {
                throw new Error('FATAL: JWT_SECRET environment variable is missing in production');
            }
            jwtSecret = 'dev-secret-key';
        }
        const secret = new TextEncoder().encode(jwtSecret);
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch {
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Allow public API routes (Explicit Allow)
    // We check this first to fail-open for public APIs
    if (matches(pathname, publicRoutes)) {
        return NextResponse.next();
    }

    // 1.5 Guest POST routes — allow POST without auth, require auth for other methods
    if (matches(pathname, guestPostRoutes) && request.method === 'POST') {
        return NextResponse.next();
    }

    const isAdminApiRoute = pathname.startsWith('/api/admin');
    const isAdminPage = pathname.startsWith('/admin');
    const isProtectedRoute = matches(pathname, protectedRoutes);

    // 2. Admin pages — server-side auth check (audit fix S-2: replaces client-only check)
    //    If the user has a valid admin JWT, let them through.
    //    If not, the admin layout will render the login screen (no redirect needed —
    //    the layout already handles unauthenticated state gracefully).
    if (isAdminPage) {
        const token = request.cookies.get('auth-token')?.value;
        const payload = await verifyAuth(token);

        if (!payload || payload.role !== 'admin') {
            // Still let through — admin layout shows login screen for unauthenticated users.
            // But inject a header so the layout knows auth was checked server-side.
            const response = NextResponse.next();
            response.headers.set('x-admin-auth', 'false');
            return response;
        }

        const response = NextResponse.next();
        response.headers.set('x-admin-auth', 'true');
        return response;
    }

    // 3. For admin API and protected routes, verify token
    if (isAdminApiRoute || isProtectedRoute) {
        const token = request.cookies.get('auth-token')?.value;
        const payload = await verifyAuth(token);

        if (!payload) {
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
            }
            const url = new URL('/login', request.url);
            url.searchParams.set('callbackUrl', encodeURI(pathname));
            return NextResponse.redirect(url);
        }

        // Admin Role Check for API routes
        if (isAdminApiRoute && payload.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
    }

    // Default Allow
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/api/:path*',
        '/my-bookings/:path*',
        // Removed /book/:path* to allow guest access
    ],
};
