import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/services/authService';
import { registerSchema } from '@/lib/validations';
import { validateBody } from '@/lib/validate';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const clientIP = getClientIP(request.headers);
        const rateCheck = checkRateLimit(clientIP, 'register');
        if (rateCheck.limited) {
            return NextResponse.json(
                { success: false, error: 'Too many registration attempts. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await request.json();

        // Zod validation
        const validation = validateBody(registerSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.message, errors: validation.errors },
                { status: 400 }
            );
        }

        const result = await registerUser(validation.data!);

        const response = NextResponse.json(
            { success: true, user: result.user },
            { status: 201 }
        );

        response.cookies.set('auth-token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Registration failed' },
            { status: 400 }
        );
    }
}

