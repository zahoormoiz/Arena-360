import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { SiteConfig } from '@/models';
import { verifyToken } from '@/lib/auth';
import { logAdminAction } from '@/lib/auditLog';

const DEFAULTS: Record<string, any> = {
    adminName: 'Super Admin',
    notificationEmail: 'admin@arena360.com',
    maintenanceMode: false,
    allowWeekendPricing: true,
    smsNotifications: true,
};

export async function GET() {
    try {
        await dbConnect();
        const configs = await SiteConfig.find({});

        // Merge DB values over defaults
        const result = { ...DEFAULTS };
        configs.forEach(c => {
            result[c.key] = c.value;
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        await dbConnect();

        const token = request.cookies.get('admin-token')?.value || request.headers.get('Authorization')?.split(' ')[1];
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload || payload.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();

        const { validateBody } = await import('@/lib/validate');
        const { settingsUpdateSchema } = await import('@/lib/validations');
        const validation = validateBody(settingsUpdateSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.message, errors: validation.errors },
                { status: 400 }
            );
        }

        // Upsert each setting
        const updates = Object.entries(validation.data!).filter(([, v]) => v !== undefined);
        for (const [key, value] of updates) {
            await SiteConfig.findOneAndUpdate(
                { key },
                { key, value, updatedAt: new Date() },
                { upsert: true }
            );
        }

        logAdminAction({
            adminId: payload.userId as string || 'system',
            adminEmail: payload.email as string || 'admin',
            action: 'settings_update',
            targetType: 'settings',
            targetId: 'global',
            changes: {
                after: Object.fromEntries(updates),
                summary: 'Updated platform settings',
            }
        });

        return NextResponse.json({ success: true, message: 'Settings saved' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
    }
}
