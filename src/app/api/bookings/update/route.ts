import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Booking } from '@/models';
import { bookingUpdateSchema } from '@/lib/validations';
import { validateBody } from '@/lib/validate';
import { verifyToken } from '@/lib/auth';
import { sendWhatsAppNotification, type WhatsAppEvent } from '@/lib/whatsapp';
import { logAdminAction } from '@/lib/auditLog';

/**
 * Admin-only: Update booking status and payment metadata
 */
export async function PATCH(request: NextRequest) {
    await dbConnect();

    try {
        // Auth check — admin only
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token) as { userId?: string; role?: string } | null;
        if (!payload || payload.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();

        // Zod validation
        const validation = validateBody(bookingUpdateSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.message, errors: validation.errors },
                { status: 400 }
            );
        }

        const {
            id,
            status,
            paymentStatus,
            paymentMethod,
            paidAmount,
            paymentReference,
            paymentVerified
        } = validation.data!;

        const existing = await Booking.findById(id).select('amount status paymentStatus paymentMethod paidAmount paymentVerified');
        if (!existing) {
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
        }

        // Capture before state for audit log
        const beforeState: Record<string, unknown> = {};
        if (status !== undefined) beforeState.status = existing.status;
        if (paymentStatus !== undefined) beforeState.paymentStatus = existing.paymentStatus;
        if (paymentMethod !== undefined) beforeState.paymentMethod = existing.paymentMethod;
        if (paidAmount !== undefined) beforeState.paidAmount = existing.paidAmount;
        if (paymentVerified !== undefined) beforeState.paymentVerified = existing.paymentVerified;

        const updateFields: Record<string, unknown> = {};

        if (status !== undefined) updateFields.status = status;
        if (paymentStatus !== undefined) updateFields.paymentStatus = paymentStatus;
        if (paymentMethod !== undefined) updateFields.paymentMethod = paymentMethod;
        if (paidAmount !== undefined) updateFields.paidAmount = paidAmount;
        if (paymentReference !== undefined) updateFields.paymentReference = paymentReference;
        if (paymentVerified !== undefined) {
            updateFields.paymentVerified = paymentVerified;
            updateFields.paymentVerifiedAt = paymentVerified ? new Date() : null;
        }

        if (paymentStatus === 'paid') {
            if (paidAmount === undefined) updateFields.paidAmount = existing.amount;
            if (paymentVerified === undefined) {
                updateFields.paymentVerified = true;
                updateFields.paymentVerifiedAt = new Date();
            }
        }

        const updatedBooking = await Booking.findByIdAndUpdate(id, updateFields, { new: true });
        if (!updatedBooking) {
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
        }

        const actionSummary = [
            status !== undefined ? `status=${status}` : null,
            paymentStatus !== undefined ? `paymentStatus=${paymentStatus}` : null,
            paymentMethod !== undefined ? `paymentMethod=${paymentMethod}` : null,
            paidAmount !== undefined ? `paidAmount=${paidAmount}` : null,
            paymentVerified !== undefined ? `paymentVerified=${paymentVerified}` : null
        ].filter(Boolean).join(', ');

        console.log(`[ADMIN_ACTION] Booking ${id} updated (${actionSummary}) by admin ${payload.userId}`);

        // Audit log — fire and forget
        const auditAction = status !== undefined ? 'booking_status_change' : 'payment_update';
        logAdminAction({
            adminId: payload.userId!,
            adminEmail: (payload as any).email as string || 'admin',
            action: auditAction,
            targetType: 'booking',
            targetId: id,
            changes: {
                before: beforeState,
                after: updateFields,
                summary: actionSummary,
            },
        });

        let notificationEvent: WhatsAppEvent | null = null;
        if (status === 'confirmed') notificationEvent = 'confirmed';
        if (status === 'cancelled') notificationEvent = 'cancelled';
        if (status === 'rescheduled') notificationEvent = 'rescheduled';
        if (paymentStatus === 'paid') notificationEvent = 'payment_received';

        if (notificationEvent) {
            const notificationResult = await sendWhatsAppNotification(
                {
                    customerName: updatedBooking.customerName,
                    customerPhone: updatedBooking.customerPhone,
                    date: updatedBooking.date,
                    startTime: updatedBooking.startTime,
                    endTime: updatedBooking.endTime,
                    amount: updatedBooking.amount,
                    status: updatedBooking.status
                },
                notificationEvent
            );

            if (!notificationResult.sent) {
                console.warn('[WHATSAPP_NOTIFICATION_FAILED]', notificationResult.reason);
            }
        }

        return NextResponse.json({ success: true, data: updatedBooking }, { status: 200 });

    } catch (error) {
        console.error('Error updating booking:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
