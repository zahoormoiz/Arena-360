import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
        }
        const secret = new TextEncoder().encode(jwtSecret);
        const { payload } = await jwtVerify(token, secret);

        if (payload.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Not an admin' }, { status: 403 });
        }

        await dbConnect();
        const user = await User.findById(payload.userId).select('name email role');

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
        });
    } catch {
        return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
}
