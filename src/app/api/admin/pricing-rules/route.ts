import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { PricingRule } from '@/models';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const sportId = request.nextUrl.searchParams.get('sportId');

        const query: any = {};
        if (sportId) query.sportId = sportId;

        const rules = await PricingRule.find(query).sort({ type: 1 });

        return NextResponse.json({ success: true, data: rules });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch pricing rules' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const body = await request.json();

        if (!body.sportId || !body.name || !body.type || !body.startTime || !body.endTime) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const rule = await PricingRule.create({
            sportId: body.sportId,
            name: body.name,
            type: body.type,
            startTime: body.startTime,
            endTime: body.endTime,
            priceMultiplier: body.priceMultiplier || 1,
            overridePrice: body.overridePrice,
            isActive: body.isActive ?? true
        });

        return NextResponse.json({ success: true, data: rule }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to create pricing rule' }, { status: 500 });
    }
}
