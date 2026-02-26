import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/services/authService';
import User from '@/models/User';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
        return NextResponse.json(
            { success: false, error: 'Not authenticated' },
            { status: 401 }
        );
    }

    const auth = await getUserFromToken(token);

    if (!auth) {
        return NextResponse.json(
            { success: false, error: 'Invalid token' },
            { status: 401 }
        );
    }

    try {
        const user = await User.findById(auth.userId);
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone || '' } },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}
