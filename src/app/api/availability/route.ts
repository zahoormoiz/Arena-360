import { NextRequest } from 'next/server';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/apiResponse';
import { getSlotAvailability } from '@/lib/services';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const date = searchParams.get('date');
        const sportId = searchParams.get('sportId');

        // Basic validation
        if (!date || !sportId) {
            return errorResponse('Missing date or sportId', 400);
        }

        // Call service layer
        const result = await getSlotAvailability(sportId, date);

        if (!result.success) {
            const status = result.error === 'Sport not found' ? 404 : 500;
            return errorResponse(result.error || 'Failed to fetch availability', status);
        }

        return successResponse(result.slots, 'Availability fetched successfully');

    } catch (error) {
        return serverErrorResponse('Database Connection Error');
    }
}
