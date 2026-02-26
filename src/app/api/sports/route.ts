import { NextRequest } from 'next/server';
import { successResponse, serverErrorResponse } from '@/lib/apiResponse';
import { getAllSports } from '@/lib/services';

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
