import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Sport, PricingRule } from '@/models';
import mongoose from 'mongoose';
import { join } from 'path';
import { unlink } from 'fs/promises';

import { sportUpdateSchema } from '@/lib/validations';
import { validateBody } from '@/lib/validate';
import { logAdminAction } from '@/lib/auditLog';
import { verifyToken } from '@/lib/auth';

/** Delete an old uploaded image from public/uploads/ if it exists */
async function deleteOldImage(imagePath: string | undefined) {
    if (!imagePath || !imagePath.startsWith('/uploads/')) return;
    try {
        const filePath = join(process.cwd(), 'public', imagePath);
        await unlink(filePath);
    } catch {
        // File may not exist — ignore silently
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = request.cookies.get('admin-token')?.value || request.headers.get('Authorization')?.split(' ')[1];
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload || payload.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        await dbConnect();
        const { id } = await params;
        const body = await request.json();

        // Zod validation
        const validation = validateBody(sportUpdateSchema, body);
        if (!validation.success) {
            return NextResponse.json({ success: false, error: validation.message || 'Validation failed' }, { status: 400 });
        }

        // Fetch the current sport BEFORE updating (to get the old image path)
        const currentSport = await Sport.findById(id).lean();

        // Build update object with only provided fields
        const updateFields: Record<string, any> = {};
        if (body.name !== undefined) updateFields.name = body.name;
        if (body.description !== undefined) updateFields.description = body.description;
        if (body.basePrice !== undefined) updateFields.basePrice = body.basePrice;
        if (body.image !== undefined) updateFields.image = body.image;
        if (body.isActive !== undefined) updateFields.isActive = body.isActive;
        if (body.sortOrder !== undefined) updateFields.sortOrder = body.sortOrder;
        if (body.durationOptions !== undefined) updateFields.durationOptions = body.durationOptions;

        // Update Sport
        const updatedSport = await Sport.findByIdAndUpdate(id, updateFields, { new: true });

        if (!updatedSport) {
            return NextResponse.json({ success: false, error: 'Sport not found' }, { status: 404 });
        }

        // Clean up old uploaded image if it was replaced
        if (body.image !== undefined && currentSport) {
            const oldImage = (currentSport as any).image;
            if (oldImage && oldImage !== body.image) {
                await deleteOldImage(oldImage);
            }
        }

        // Update/Upsert Weekend Rule
        if (body.weekendPrice !== undefined) {
            await PricingRule.findOneAndUpdate(
                { sportId: new mongoose.Types.ObjectId(id), type: 'weekend' } as any,
                {
                    sportId: new mongoose.Types.ObjectId(id),
                    name: 'Weekend Peak',
                    type: 'weekend',
                    startTime: '00:00',
                    endTime: '24:00',
                    priceMultiplier: 1,
                    overridePrice: body.weekendPrice,
                    isActive: true
                },
                { upsert: true, new: true }
            );
        }

        logAdminAction({
            adminId: payload.userId as string,
            adminEmail: payload.email as string,
            action: 'sport_update',
            targetType: 'sport',
            targetId: id,
            changes: {
                before: (currentSport || {}) as Record<string, unknown>,
                after: updateFields,
                summary: `Updated sport: ${currentSport?.name || id}`,
            }
        });

        return NextResponse.json({ success: true, data: updatedSport });
    } catch {
        return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = request.cookies.get('admin-token')?.value || request.headers.get('Authorization')?.split(' ')[1];
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload || payload.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        await dbConnect();
        const { id } = await params;

        // Note: We use soft deletes instead of hard deletes to prevent breaking existing bookings
        const sport = await Sport.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();

        logAdminAction({
            adminId: payload.userId as string,
            adminEmail: payload.email as string,
            action: 'sport_delete',
            targetType: 'sport',
            targetId: id,
            changes: {
                before: (sport || {}) as Record<string, unknown>,
                summary: `Soft-deleted sport: ${sport?.name || id}`,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
    }
}
