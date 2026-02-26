import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/services/authService';
import { loginSchema } from '@/lib/validations';
import { validateBody } from '@/lib/validate';
import { checkRateLimit, getClientIP, resetRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const clientIP = getClientIP(request.headers);
        const rateCheck = checkRateLimit(clientIP, 'login');
        if (rateCheck.limited) {
            return NextResponse.json(
                { success: false, error: 'Too many login attempts. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await request.json();

        // Zod validation
        const validation = validateBody(loginSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.message, errors: validation.errors },
                { status: 400 }
            );
        }

        const { email, password } = validation.data!;
        const result = await loginUser(email, password);

        const response = NextResponse.json(
            { success: true, user: result.user },
            { status: 200 }
        );

        response.cookies.set('auth-token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        // Reset rate limit on successful login
        resetRateLimit(clientIP, 'login');

        return response;

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Login failed' },
            { status: 401 }
        );
    }
}

