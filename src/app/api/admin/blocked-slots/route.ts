import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { BlockedSlot } from '@/models';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const date = request.nextUrl.searchParams.get('date');
        const sportId = request.nextUrl.searchParams.get('sportId');

        const query: any = {};
        if (date) query.date = date;
        if (sportId) query.sport = sportId;

        const slots = await BlockedSlot.find(query).populate('sport', 'name');

        return NextResponse.json({ success: true, data: slots });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch blocked slots' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const body = await request.json();

        const { validateBody } = await import('@/lib/validate');
        const { blockedSlotSchema } = await import('@/lib/validations');
        const validation = validateBody(blockedSlotSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.message, errors: validation.errors },
                { status: 400 }
            );
        }

        const slot = await BlockedSlot.create({
            sport: body.sport,
            date: body.date,
            startTime: body.startTime,
            endTime: body.endTime,
            reason: body.reason || 'Blocked by admin',
        });

        return NextResponse.json({ success: true, data: slot }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to block slot' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();
        const id = request.nextUrl.searchParams.get('id');
        if (!id) {
            return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });
        }

        await BlockedSlot.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to unblock slot' }, { status: 500 });
    }
}
