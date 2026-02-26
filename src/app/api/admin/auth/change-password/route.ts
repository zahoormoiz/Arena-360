import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models';
import { verifyToken, comparePassword, hashPassword } from '@/lib/auth';
import { logAdminAction } from '@/lib/auditLog';

/**
 * POST /api/admin/auth/change-password
 * Allow admin to change their own password.
 */
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        // Auth check
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 },
            );
        }

        const payload = (await verifyToken(token)) as {
            userId?: string;
            email?: string;
            role?: string;
        } | null;

        if (!payload || payload.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 },
            );
        }

        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { success: false, error: 'Current and new password are required' },
                { status: 400 },
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { success: false, error: 'New password must be at least 8 characters' },
                { status: 400 },
            );
        }

        // Find admin with password field
        const admin = await User.findById(payload.userId).select('+password');
        if (!admin || !admin.password) {
            return NextResponse.json(
                { success: false, error: 'Admin not found' },
                { status: 404 },
            );
        }

        // Verify current password
        const isMatch = await comparePassword(currentPassword, admin.password);
        if (!isMatch) {
            return NextResponse.json(
                { success: false, error: 'Current password is incorrect' },
                { status: 400 },
            );
        }

        // Hash and update
        const hashed = await hashPassword(newPassword);
        await User.findByIdAndUpdate(payload.userId, { password: hashed });

        // Audit log
        logAdminAction({
            adminId: payload.userId!,
            adminEmail: payload.email || admin.email,
            action: 'password_change',
            targetType: 'auth',
            targetId: payload.userId,
            changes: { summary: 'Admin password changed' },
        });

        return NextResponse.json(
            { success: true, message: 'Password changed successfully' },
            { status: 200 },
        );
    } catch (error) {
        console.error('Password change error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to change password' },
            { status: 500 },
        );
    }
}
