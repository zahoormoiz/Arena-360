import { NextRequest } from 'next/server';
import { successResponse, createdResponse, errorResponse, serverErrorResponse } from '@/lib/apiResponse';
import { getAllSports, createSport } from '@/lib/services';
import { sportCreateSchema } from '@/lib/validations';
import { validateBody } from '@/lib/validate';
import { logAdminAction } from '@/lib/auditLog';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        // Call service layer
        const result = await getAllSports();

        if (!result.success) {
            return serverErrorResponse(result.error || 'Failed to fetch sports');
        }

        return successResponse(result.sports, 'Sports fetched successfully');
    } catch (error) {
        return serverErrorResponse('Failed to fetch sports');
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('admin-token')?.value || request.headers.get('Authorization')?.split(' ')[1];
        if (!token) return errorResponse('Unauthorized', 401);
        const payload = await verifyToken(token);
        if (!payload || payload.role !== 'admin') {
            return errorResponse('Forbidden', 403);
        }

        const body = await request.json();

        // Zod validation
        const validation = validateBody(sportCreateSchema, body);
        if (!validation.success) {
            return errorResponse(validation.message || 'Validation failed', 400);
        }

        // Call service layer
        const result = await createSport({
            name: body.name,
            description: body.description,
            basePrice: body.basePrice,
            image: body.image,
            durationOptions: body.durationOptions,
            weekendPrice: body.weekendPrice,
            sortOrder: body.sortOrder
        });

        if (!result.success) {
            return errorResponse(result.error || 'Failed to create sport', 400);
        }

        logAdminAction({
            adminId: payload.userId as string,
            adminEmail: payload.email as string,
            action: 'sport_create',
            targetType: 'sport',
            targetId: result.sport._id.toString(),
            changes: {
                after: body,
                summary: `Created new sport: ${body.name}`,
            }
        });

        return createdResponse(result.sport, 'Sport created successfully');

    } catch (error) {
        return serverErrorResponse('Failed to create sport');
    }
}
