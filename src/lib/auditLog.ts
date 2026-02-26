import dbConnect from '@/lib/db';

/**
 * Fire-and-forget audit log entry. Never blocks or throws on the caller.
 */
export async function logAdminAction(params: {
    adminId: string;
    adminEmail: string;
    action: string;
    targetType: 'booking' | 'sport' | 'settings' | 'auth';
    targetId?: string;
    changes?: {
        before?: Record<string, unknown>;
        after?: Record<string, unknown>;
        summary?: string;
    };
    ip?: string;
}): Promise<void> {
    try {
        await dbConnect();
        // Dynamic import to avoid circular dependency issues at module load
        const AuditLog = (await import('@/models/AuditLog')).default;
        await AuditLog.create({
            adminId: params.adminId,
            adminEmail: params.adminEmail,
            action: params.action,
            targetType: params.targetType,
            targetId: params.targetId,
            changes: params.changes || {},
            ip: params.ip,
        });
    } catch (error) {
        // Never let audit logging break the main flow
        console.error('[AUDIT_LOG_ERROR]', error);
    }
}
