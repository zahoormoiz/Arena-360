/**
 * Agent Tool Executor
 * Implements all agent tools and executes them
 */

import type {
  AgentTool,
  AgentActionResult,
  AvailabilityCheckResult,
  CreateBookingResult,
  UserProfileData,
  PricingInfo,
} from './types';
import { getToolDefinition } from './toolDefinitions';

export interface ExecutorContext {
  userId?: string;
  adminId?: string;
  userRole: 'guest' | 'user' | 'admin';
  apiUrl: string; // Base API URL for making requests
}

interface ToolExecutor {
  (params: Record<string, any>, context: ExecutorContext): Promise<AgentActionResult>;
}

const TOOL_EXECUTORS: Record<AgentTool, ToolExecutor> = {
  // ============================================================================
  // Availability & Booking Tools
  // ============================================================================

  check_availability: async (params, context) => {
    try {
      const { sport, date, duration } = params;

      if (!sport || !date) {
        return {
          success: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'Sport and date are required',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const queryParams = new URLSearchParams({
        sport,
        date,
        ...(duration && { duration: duration.toString() }),
      });

      const response = await fetch(`${context.apiUrl}/api/availability?${queryParams}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: `Failed to check availability: ${response.statusText}`,
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        executedAt: new Date(),
        duration: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        executedAt: new Date(),
        duration: 0,
      };
    }
  },

  create_booking: async (params, context) => {
    try {
      const { sport, date, startTime, duration, customerName, customerEmail, customerPhone, paymentMethod } = params;

      // Validate required parameters
      const required = ['sport', 'date', 'startTime', 'duration', 'customerName', 'customerEmail', 'customerPhone'];
      for (const param of required) {
        if (!params[param]) {
          return {
            success: false,
            error: {
              code: 'MISSING_PARAMS',
              message: `Missing required parameter: ${param}`,
            },
            executedAt: new Date(),
            duration: 0,
          };
        }
      }

      const bookingData = {
        sport,
        date,
        startTime,
        duration,
        customerName,
        customerEmail,
        customerPhone,
        paymentMethod: paymentMethod || 'cash',
        source: 'agent',
      };

      const response = await fetch(`${context.apiUrl}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: {
            code: 'BOOKING_FAILED',
            message: error.message || 'Failed to create booking',
            details: error,
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const booking = await response.json();
      return {
        success: true,
        data: {
          bookingId: booking._id,
          sport: booking.sport,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          duration: booking.duration,
          amount: booking.amount,
          status: booking.status,
          confirmationCode: booking._id.substring(0, 8).toUpperCase(),
        },
        executedAt: new Date(),
        duration: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        executedAt: new Date(),
        duration: 0,
      };
    }
  },

  list_bookings: async (params, context) => {
    try {
      if (!context.userId && context.userRole === 'user') {
        return {
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'User authentication required',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const endpoint = context.userRole === 'admin' ? '/api/bookings' : '/api/bookings/my';
      const queryParams = new URLSearchParams();

      if (params.status) queryParams.append('status', params.status);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const response = await fetch(`${context.apiUrl}${endpoint}?${queryParams}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: `Failed to list bookings: ${response.statusText}`,
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        executedAt: new Date(),
        duration: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        executedAt: new Date(),
        duration: 0,
      };
    }
  },

  get_booking_details: async (params, context) => {
    try {
      const { bookingId } = params;

      if (!bookingId) {
        return {
          success: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'Booking ID is required',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const response = await fetch(`${context.apiUrl}/api/bookings/${bookingId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Booking not found',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        executedAt: new Date(),
        duration: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        executedAt: new Date(),
        duration: 0,
      };
    }
  },

  cancel_booking: async (params, context) => {
    try {
      const { bookingId, reason } = params;

      if (!bookingId) {
        return {
          success: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'Booking ID is required',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const response = await fetch(`${context.apiUrl}/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          reason: reason || 'User requested cancellation',
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'CANCELLATION_FAILED',
            message: 'Failed to cancel booking',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        executedAt: new Date(),
        duration: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        executedAt: new Date(),
        duration: 0,
      };
    }
  },

  reschedule_booking: async (params, context) => {
    try {
      const { bookingId, newDate, newStartTime, reason } = params;

      if (!bookingId || !newDate || !newStartTime) {
        return {
          success: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'Booking ID, new date, and start time are required',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const response = await fetch(`${context.apiUrl}/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rescheduled',
          newDate,
          newStartTime,
          reason: reason || 'User requested reschedule',
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'RESCHEDULE_FAILED',
            message: 'Failed to reschedule booking',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        executedAt: new Date(),
        duration: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        executedAt: new Date(),
        duration: 0,
      };
    }
  },

  // ============================================================================
  // User Profile Tools
  // ============================================================================

  get_user_profile: async (params, context) => {
    try {
      if (!context.userId) {
        return {
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'User authentication required',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const response = await fetch(`${context.apiUrl}/api/auth/me`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: 'Failed to retrieve profile',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        executedAt: new Date(),
        duration: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        executedAt: new Date(),
        duration: 0,
      };
    }
  },

  update_user_profile: async (params, context) => {
    try {
      if (!context.userId) {
        return {
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'User authentication required',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const updates: Record<string, any> = {};
      if (params.name) updates.name = params.name;
      if (params.phone) updates.phone = params.phone;
      if (params.email) updates.email = params.email;

      if (Object.keys(updates).length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_UPDATES',
            message: 'No fields to update',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const response = await fetch(`${context.apiUrl}/api/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update profile',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        executedAt: new Date(),
        duration: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        executedAt: new Date(),
        duration: 0,
      };
    }
  },

  // ============================================================================
  // Sport & Pricing Tools
  // ============================================================================

  get_sports: async (params, context) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.active) queryParams.append('active', 'true');
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const response = await fetch(`${context.apiUrl}/api/sports?${queryParams}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: 'Failed to fetch sports',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        executedAt: new Date(),
        duration: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        executedAt: new Date(),
        duration: 0,
      };
    }
  },

  get_pricing: async (params, context) => {
    try {
      const { sport, date, startTime } = params;

      if (!sport) {
        return {
          success: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'Sport is required',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const queryParams = new URLSearchParams({ sport });
      if (date) queryParams.append('date', date);
      if (startTime) queryParams.append('startTime', startTime);

      const response = await fetch(`${context.apiUrl}/api/bookings/pricing?${queryParams}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: 'Failed to fetch pricing',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        executedAt: new Date(),
        duration: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        executedAt: new Date(),
        duration: 0,
      };
    }
  },

  // ============================================================================
  // Payment & Notification Tools (Admin)
  // ============================================================================

  process_payment: async (params, context) => {
    try {
      if (context.userRole !== 'admin') {
        return {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Only admins can process payments',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const { bookingId, amount, method } = params;

      if (!bookingId || !amount || !method) {
        return {
          success: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'Booking ID, amount, and method are required',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const response = await fetch(`${context.apiUrl}/api/bookings/${bookingId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'PAYMENT_FAILED',
            message: 'Failed to process payment',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        executedAt: new Date(),
        duration: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        executedAt: new Date(),
        duration: 0,
      };
    }
  },

  send_notification: async (params, context) => {
    try {
      if (context.userRole !== 'admin') {
        return {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Only admins can send notifications',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const { userId, type, subject, message } = params;

      if (!userId || !type || !message) {
        return {
          success: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'User ID, type, and message are required',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const response = await fetch(`${context.apiUrl}/api/admin/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type, subject, message }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'SEND_FAILED',
            message: 'Failed to send notification',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        executedAt: new Date(),
        duration: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        executedAt: new Date(),
        duration: 0,
      };
    }
  },

  // ============================================================================
  // Admin Tools
  // ============================================================================

  list_customers: async (params, context) => {
    try {
      if (context.userRole !== 'admin') {
        return {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Only admins can list customers',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const response = await fetch(`${context.apiUrl}/api/admin/customers?${queryParams}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: 'Failed to list customers',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        executedAt: new Date(),
        duration: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        executedAt: new Date(),
        duration: 0,
      };
    }
  },

  get_admin_stats: async (params, context) => {
    try {
      if (context.userRole !== 'admin') {
        return {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Only admins can view statistics',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const queryParams = new URLSearchParams();
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.breakdown) queryParams.append('breakdown', params.breakdown);

      const response = await fetch(`${context.apiUrl}/api/admin/stats?${queryParams}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: 'Failed to fetch statistics',
          },
          executedAt: new Date(),
          duration: 0,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        executedAt: new Date(),
        duration: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        executedAt: new Date(),
        duration: 0,
      };
    }
  },
};

/**
 * Execute an agent tool
 */
export async function executeTool(
  tool: AgentTool,
  params: Record<string, any>,
  context: ExecutorContext
): Promise<AgentActionResult> {
  const executor = TOOL_EXECUTORS[tool];

  if (!executor) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_TOOL',
        message: `Tool not found: ${tool}`,
      },
      executedAt: new Date(),
      duration: 0,
    };
  }

  const startTime = performance.now();
  const result = await executor(params, context);
  result.duration = performance.now() - startTime;

  return result;
}

/**
 * Validate parameters against tool definition
 */
export function validateToolParameters(tool: AgentTool, params: Record<string, any>): { valid: boolean; errors: string[] } {
  const toolDef = getToolDefinition(tool);
  const errors: string[] = [];

  if (!toolDef) {
    return { valid: false, errors: ['Tool definition not found'] };
  }

  // Check required parameters
  for (const [paramName, paramDef] of Object.entries(toolDef.parameters)) {
    const value = params[paramName];

    if (paramDef.required && !value) {
      errors.push(`Missing required parameter: ${paramName}`);
      continue;
    }

    if (value !== undefined && value !== null) {
      // Validate type
      if (paramDef.type === 'number' && typeof value !== 'number') {
        errors.push(`${paramName} must be a number`);
      }
      if (paramDef.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${paramName} must be a boolean`);
      }
      if (paramDef.type === 'string' && typeof value !== 'string') {
        errors.push(`${paramName} must be a string`);
      }

      // Validate enum
      if (paramDef.enum && !paramDef.enum.includes(value)) {
        errors.push(`${paramName} must be one of: ${paramDef.enum.join(', ')}`);
      }

      // Validate min/max
      if (paramDef.type === 'number') {
        if (paramDef.min !== undefined && value < paramDef.min) {
          errors.push(`${paramName} must be >= ${paramDef.min}`);
        }
        if (paramDef.max !== undefined && value > paramDef.max) {
          errors.push(`${paramName} must be <= ${paramDef.max}`);
        }
      }

      // Validate pattern
      if (paramDef.pattern && typeof value === 'string' && !new RegExp(paramDef.pattern).test(value)) {
        errors.push(`${paramName} format is invalid`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
