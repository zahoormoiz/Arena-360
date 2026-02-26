import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { comparePassword, signToken } from '@/lib/auth';
import { checkRateLimit, getClientIP, resetRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
    try {
        const clientIP = getClientIP(request.headers);
        const rateCheck = checkRateLimit(clientIP, 'login');
        if (rateCheck.limited) {
            return NextResponse.json(
                { success: false, error: 'Too many admin login attempts. Please try again later.' },
                { status: 429 }
            );
        }

        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Verify admin role
        if (user.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Access denied. Admin privileges required.' },
                { status: 403 }
            );
        }

        const isMatch = await comparePassword(password, user.password!);
        if (!isMatch) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const token = await signToken({ userId: user._id.toString(), role: user.role });

        const response = NextResponse.json(
            { success: true, user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role } },
            { status: 200 }
        );

        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7
        });

        resetRateLimit(clientIP, 'login');

        return response;

    } catch (error: unknown) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Login failed' },
            { status: 500 }
        );
    }
}
