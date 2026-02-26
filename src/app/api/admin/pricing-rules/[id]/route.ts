import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { PricingRule } from '@/models';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();

        const rule = await PricingRule.findByIdAndUpdate(id, {
            name: body.name,
            type: body.type,
            startTime: body.startTime,
            endTime: body.endTime,
            priceMultiplier: body.priceMultiplier,
            overridePrice: body.overridePrice,
            isActive: body.isActive
        }, { new: true });

        if (!rule) {
            return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: rule });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to update rule' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        await PricingRule.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to delete rule' }, { status: 500 });
    }
}
