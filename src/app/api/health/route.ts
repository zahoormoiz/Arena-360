import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';

const startTime = Date.now();

export async function GET() {
    try {
        await dbConnect();

        // Ping the database
        const pingStart = Date.now();
        await mongoose.connection.db!.admin().command({ ping: 1 });
        const latencyMs = Date.now() - pingStart;

        return NextResponse.json({
            status: 'ok',
            db: 'connected',
            latencyMs,
            uptime: Math.floor((Date.now() - startTime) / 1000),
            timestamp: new Date().toISOString(),
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({
            status: 'error',
            db: 'disconnected',
            error: 'Database unreachable',
            timestamp: new Date().toISOString(),
        }, { status: 503 });
    }
}
