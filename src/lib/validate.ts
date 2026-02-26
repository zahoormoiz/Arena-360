/**
 * Zod Validation Helper
 * Parses request bodies against Zod schemas and returns structured errors
 */

import { z } from 'zod';

export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    errors?: Record<string, string>;
    message?: string;
}

/**
 * Validate a request body against a Zod schema
 * Returns typed data on success, or per-field error messages on failure
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): ValidationResult<T> {
    const result = schema.safeParse(body);

    if (result.success) {
        return { success: true, data: result.data };
    }

    // Build per-field error map
    const errors: Record<string, string> = {};
    const issues = result.error.issues;

    for (const issue of issues) {
        const field = issue.path.join('.') || '_root';
        // Only keep the first error per field
        if (!errors[field]) {
            errors[field] = issue.message;
        }
    }

    return {
        success: false,
        errors,
        message: issues[0]?.message || 'Validation failed'
    };
}
