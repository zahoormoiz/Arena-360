/**
 * Agent Tool Definitions
 * Complete metadata for all agent capabilities
 */

import type { AgentToolDefinition } from './types';

export const AGENT_TOOLS: Record<string, AgentToolDefinition> = {
  check_availability: {
    name: 'check_availability',
    description: 'Check available time slots for a sport on a specific date',
    parameters: {
      sport: {
        type: 'string',
        description: 'Name or ID of the sport',
        required: true,
      },
      date: {
        type: 'date',
        description: 'Date to check availability (YYYY-MM-DD)',
        required: true,
      },
      duration: {
        type: 'number',
        description: 'Duration in minutes (optional, defaults to all)',
        required: false,
        min: 30,
        max: 240,
      },
    },
    requiresAuth: false,
    requiresApproval: 'never',
    rateLimit: {
      maxPerHour: 60,
      maxPerDay: 500,
    },
  },

  create_booking: {
    name: 'create_booking',
    description: 'Create a new booking for a sport',
    parameters: {
      sport: {
        type: 'string',
        description: 'Name or ID of the sport',
        required: true,
      },
      date: {
        type: 'date',
        description: 'Date of booking (YYYY-MM-DD)',
        required: true,
      },
      startTime: {
        type: 'string',
        description: 'Start time (HH:MM format)',
        required: true,
        pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$',
      },
      duration: {
        type: 'number',
        description: 'Duration in minutes',
        required: true,
        min: 30,
        max: 240,
      },
      customerName: {
        type: 'string',
        description: 'Name of person booking',
        required: true,
      },
      customerEmail: {
        type: 'string',
        description: 'Email address',
        required: true,
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      },
      customerPhone: {
        type: 'string',
        description: 'Phone number',
        required: true,
      },
      paymentMethod: {
        type: 'enum',
        description: 'Payment method',
        required: true,
        enum: ['cash', 'card', 'easypaisa', 'jazzcash'],
      },
    },
    requiresAuth: false,
    requiresApproval: 'high_value',
    approvalThreshold: 5000, // Approvals for bookings over 5000
    rateLimit: {
      maxPerHour: 20,
      maxPerDay: 100,
    },
  },

  list_bookings: {
    name: 'list_bookings',
    description: 'List bookings for a user or show all (admin)',
    parameters: {
      userId: {
        type: 'string',
        description: 'User ID (optional, defaults to current user)',
        required: false,
      },
      status: {
        type: 'enum',
        description: 'Filter by status',
        required: false,
        enum: ['pending', 'confirmed', 'cancelled', 'rescheduled'],
      },
      dateFrom: {
        type: 'date',
        description: 'Start date (YYYY-MM-DD)',
        required: false,
      },
      dateTo: {
        type: 'date',
        description: 'End date (YYYY-MM-DD)',
        required: false,
      },
      limit: {
        type: 'number',
        description: 'Maximum results',
        required: false,
        min: 1,
        max: 100,
      },
    },
    requiresAuth: true,
    requiredRole: 'user',
    requiresApproval: 'never',
    rateLimit: {
      maxPerHour: 60,
      maxPerDay: 500,
    },
  },

  get_booking_details: {
    name: 'get_booking_details',
    description: 'Get detailed information about a specific booking',
    parameters: {
      bookingId: {
        type: 'string',
        description: 'ID of the booking',
        required: true,
      },
    },
    requiresAuth: true,
    requiredRole: 'user',
    requiresApproval: 'never',
    rateLimit: {
      maxPerHour: 60,
      maxPerDay: 500,
    },
  },

  cancel_booking: {
    name: 'cancel_booking',
    description: 'Cancel an existing booking',
    parameters: {
      bookingId: {
        type: 'string',
        description: 'ID of booking to cancel',
        required: true,
      },
      reason: {
        type: 'string',
        description: 'Reason for cancellation',
        required: false,
      },
    },
    requiresAuth: true,
    requiredRole: 'user',
    requiresApproval: 'always',
    rateLimit: {
      maxPerHour: 10,
      maxPerDay: 20,
    },
  },

  reschedule_booking: {
    name: 'reschedule_booking',
    description: 'Reschedule an existing booking to a new date/time',
    parameters: {
      bookingId: {
        type: 'string',
        description: 'ID of booking to reschedule',
        required: true,
      },
      newDate: {
        type: 'date',
        description: 'New date (YYYY-MM-DD)',
        required: true,
      },
      newStartTime: {
        type: 'string',
        description: 'New start time (HH:MM)',
        required: true,
        pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$',
      },
      reason: {
        type: 'string',
        description: 'Reason for rescheduling',
        required: false,
      },
    },
    requiresAuth: true,
    requiredRole: 'user',
    requiresApproval: 'always',
    rateLimit: {
      maxPerHour: 10,
      maxPerDay: 20,
    },
  },

  get_user_profile: {
    name: 'get_user_profile',
    description: 'Get user profile information',
    parameters: {
      userId: {
        type: 'string',
        description: 'User ID (optional, defaults to current user)',
        required: false,
      },
    },
    requiresAuth: true,
    requiredRole: 'user',
    requiresApproval: 'never',
    rateLimit: {
      maxPerHour: 60,
      maxPerDay: 500,
    },
  },

  update_user_profile: {
    name: 'update_user_profile',
    description: 'Update user profile information',
    parameters: {
      name: {
        type: 'string',
        description: 'Full name',
        required: false,
      },
      phone: {
        type: 'string',
        description: 'Phone number',
        required: false,
      },
      email: {
        type: 'string',
        description: 'Email address',
        required: false,
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      },
    },
    requiresAuth: true,
    requiredRole: 'user',
    requiresApproval: 'never',
    rateLimit: {
      maxPerHour: 10,
      maxPerDay: 50,
    },
  },

  get_sports: {
    name: 'get_sports',
    description: 'Get list of available sports',
    parameters: {
      active: {
        type: 'boolean',
        description: 'Only active sports',
        required: false,
      },
      limit: {
        type: 'number',
        description: 'Maximum results',
        required: false,
        min: 1,
        max: 50,
      },
    },
    requiresAuth: false,
    requiresApproval: 'never',
    rateLimit: {
      maxPerHour: 100,
      maxPerDay: 1000,
    },
  },

  get_pricing: {
    name: 'get_pricing',
    description: 'Get pricing information for a sport',
    parameters: {
      sport: {
        type: 'string',
        description: 'Sport name or ID',
        required: true,
      },
      date: {
        type: 'date',
        description: 'Date to get pricing for (YYYY-MM-DD)',
        required: false,
      },
      startTime: {
        type: 'string',
        description: 'Start time (HH:MM)',
        required: false,
        pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$',
      },
    },
    requiresAuth: false,
    requiresApproval: 'never',
    rateLimit: {
      maxPerHour: 60,
      maxPerDay: 500,
    },
  },

  process_payment: {
    name: 'process_payment',
    description: 'Process payment for a booking',
    parameters: {
      bookingId: {
        type: 'string',
        description: 'ID of booking',
        required: true,
      },
      amount: {
        type: 'number',
        description: 'Amount to charge',
        required: true,
        min: 0,
      },
      method: {
        type: 'enum',
        description: 'Payment method',
        required: true,
        enum: ['cash', 'card', 'easypaisa', 'jazzcash'],
      },
    },
    requiresAuth: true,
    requiredRole: 'admin',
    requiresApproval: 'always',
    rateLimit: {
      maxPerHour: 20,
      maxPerDay: 100,
    },
  },

  send_notification: {
    name: 'send_notification',
    description: 'Send notification to user (email or SMS)',
    parameters: {
      userId: {
        type: 'string',
        description: 'User ID or email/phone',
        required: true,
      },
      type: {
        type: 'enum',
        description: 'Notification type',
        required: true,
        enum: ['email', 'sms', 'whatsapp'],
      },
      subject: {
        type: 'string',
        description: 'Email subject (for email)',
        required: false,
      },
      message: {
        type: 'string',
        description: 'Message content',
        required: true,
      },
    },
    requiresAuth: true,
    requiredRole: 'admin',
    requiresApproval: 'never',
    rateLimit: {
      maxPerHour: 100,
      maxPerDay: 500,
    },
  },

  list_customers: {
    name: 'list_customers',
    description: 'List all customers (admin only)',
    parameters: {
      search: {
        type: 'string',
        description: 'Search by name or email',
        required: false,
      },
      sortBy: {
        type: 'enum',
        description: 'Sort field',
        required: false,
        enum: ['name', 'email', 'totalSpent', 'lastBooking'],
      },
      limit: {
        type: 'number',
        description: 'Maximum results',
        required: false,
        min: 1,
        max: 100,
      },
    },
    requiresAuth: true,
    requiredRole: 'admin',
    requiresApproval: 'never',
    rateLimit: {
      maxPerHour: 30,
      maxPerDay: 200,
    },
  },

  get_admin_stats: {
    name: 'get_admin_stats',
    description: 'Get administrative statistics (admin only)',
    parameters: {
      dateFrom: {
        type: 'date',
        description: 'Start date (YYYY-MM-DD)',
        required: false,
      },
      dateTo: {
        type: 'date',
        description: 'End date (YYYY-MM-DD)',
        required: false,
      },
      breakdown: {
        type: 'enum',
        description: 'Breakdown by',
        required: false,
        enum: ['sport', 'payment_method', 'day', 'hour'],
      },
    },
    requiresAuth: true,
    requiredRole: 'admin',
    requiresApproval: 'never',
    rateLimit: {
      maxPerHour: 20,
      maxPerDay: 100,
    },
  },
};

export function getToolDefinition(toolName: string): AgentToolDefinition | undefined {
  return AGENT_TOOLS[toolName];
}

export function getToolNames(): string[] {
  return Object.keys(AGENT_TOOLS);
}

export function getPublicTools(): string[] {
  return getToolNames().filter((name) => !getToolDefinition(name)?.requiresAuth);
}

export function getAdminTools(): string[] {
  return getToolNames().filter((name) => getToolDefinition(name)?.requiredRole === 'admin');
}

export function getUserTools(): string[] {
  const tools = getToolNames();
  return tools.filter((name) => {
    const def = getToolDefinition(name);
    return def?.requiresAuth && (!def?.requiredRole || def?.requiredRole === 'user');
  });
}
