import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json(
        { success: true, message: 'Logged out' },
        { status: 200 }
    );

    response.cookies.delete('auth-token');

    return response;
}
