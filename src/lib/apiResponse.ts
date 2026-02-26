import { NextResponse } from 'next/server';

/**
 * Standardized API Response Helpers
 * All API responses should follow this format:
 * { success: boolean, message?: string, data?: any, error?: string }
 */

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

/**
 * Create a successful API response
 */
export function successResponse<T>(
    data: T,
    message: string = 'Success',
    status: number = 200
): NextResponse<ApiResponse<T>> {
    return NextResponse.json(
        {
            success: true,
            message,
            data,
        },
        { status }
    );
}

/**
 * Create a created (201) API response
 */
export function createdResponse<T>(
    data: T,
    message: string = 'Created successfully'
): NextResponse<ApiResponse<T>> {
    return successResponse(data, message, 201);
}

/**
 * Create an error API response
 */
export function errorResponse(
    error: string,
    status: number = 400
): NextResponse<ApiResponse> {
    return NextResponse.json(
        {
            success: false,
            error,
        },
        { status }
    );
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
    errors: string | string[]
): NextResponse<ApiResponse> {
    const errorMessage = Array.isArray(errors) ? errors.join(', ') : errors;
    return NextResponse.json(
        {
            success: false,
            error: `Validation failed: ${errorMessage}`,
        },
        { status: 400 }
    );
}

/**
 * Create an unauthorized error response
 */
export function unauthorizedResponse(
    message: string = 'Authentication required'
): NextResponse<ApiResponse> {
    return errorResponse(message, 401);
}

/**
 * Create a forbidden error response
 */
export function forbiddenResponse(
    message: string = 'Access denied'
): NextResponse<ApiResponse> {
    return errorResponse(message, 403);
}

/**
 * Create a not found error response
 */
export function notFoundResponse(
    message: string = 'Resource not found'
): NextResponse<ApiResponse> {
    return errorResponse(message, 404);
}

/**
 * Create a conflict error response (e.g., duplicate booking)
 */
export function conflictResponse(
    message: string = 'Resource conflict'
): NextResponse<ApiResponse> {
    return errorResponse(message, 409);
}

/**
 * Create an internal server error response
 */
export function serverErrorResponse(
    message: string = 'Internal server error'
): NextResponse<ApiResponse> {
    return errorResponse(message, 500);
}
