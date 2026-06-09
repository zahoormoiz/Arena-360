/**
 * Agent System Type Definitions
 * Defines all agent capabilities, tools, and execution models
 */

// ============================================================================
// Agent Configuration Types
// ============================================================================

export type AgentTool = 
  | 'check_availability'
  | 'create_booking'
  | 'list_bookings'
  | 'cancel_booking'
  | 'reschedule_booking'
  | 'get_user_profile'
  | 'update_user_profile'
  | 'get_sports'
  | 'get_pricing'
  | 'process_payment'
  | 'send_notification'
  | 'get_booking_details'
  | 'list_customers'
  | 'get_admin_stats';

export type RequiresApproval = 'always' | 'never' | 'high_value';

export interface AgentToolDefinition {
  name: AgentTool;
  description: string;
  parameters: Record<string, ParameterDefinition>;
  requiresAuth: boolean;
  requiredRole?: 'user' | 'admin';
  requiresApproval: RequiresApproval;
  approvalThreshold?: number; // For financial operations
  rateLimit?: {
    maxPerHour: number;
    maxPerDay: number;
  };
}

export interface ParameterDefinition {
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  description: string;
  required: boolean;
  enum?: string[];
  min?: number;
  max?: number;
  pattern?: string;
}

// ============================================================================
// Intent Recognition Types
// ============================================================================

export interface UserIntent {
  action: AgentTool;
  confidence: number; // 0-1
  parameters: Record<string, any>;
  requiresApproval: boolean;
  explanation: string; // Why this action was chosen
}

export interface IntentRecognitionResult {
  intents: UserIntent[];
  ambiguous: boolean;
  clarificationNeeded?: string; // Question to ask user
}

// ============================================================================
// Agent Execution Types
// ============================================================================

export interface AgentAction {
  id: string;
  tool: AgentTool;
  parameters: Record<string, any>;
  userId?: string;
  adminId?: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'failed';
  requiresApproval: boolean;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface AgentActionResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  executedAt: Date;
  duration: number; // milliseconds
}

export interface AgentResponse {
  actionId: string;
  action: AgentTool;
  result: AgentActionResult;
  humanReadable: string; // What to show to user
  nextSteps?: string[]; // Suggested follow-up actions
}

// ============================================================================
// Approval & Safety Types
// ============================================================================

export interface ApprovalRequest {
  actionId: string;
  action: AgentTool;
  parameters: Record<string, any>;
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedValue?: number;
  expiresAt: Date;
}

export interface ApprovalResponse {
  actionId: string;
  approved: boolean;
  approvedBy: string;
  reason?: string;
  expiresAt?: Date;
}

// ============================================================================
// Context & Session Types
// ============================================================================

export interface AgentContext {
  userId?: string;
  adminId?: string;
  sessionId: string;
  userRole: 'guest' | 'user' | 'admin';
  conversationHistory: AgentMessage[];
  startedAt: Date;
  lastActivityAt: Date;
  metadata?: Record<string, any>;
}

export interface AgentMessage {
  role: 'user' | 'agent' | 'system';
  content: string;
  actions?: AgentAction[];
  timestamp: Date;
}

// ============================================================================
// Tool Response Types
// ============================================================================

export interface AvailabilityCheckResult {
  sport: string;
  date: string;
  availableSlots: {
    startTime: string;
    endTime: string;
    price: number;
  }[];
  totalSlots: number;
  bookedSlots: number;
}

export interface CreateBookingResult {
  bookingId: string;
  sport: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  amount: number;
  status: string;
  confirmationCode: string;
}

export interface UserProfileData {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  totalBookings: number;
  totalSpent: number;
  role: 'user' | 'admin';
}

export interface PricingInfo {
  sport: string;
  basePrice: number;
  rules: {
    type: 'weekday' | 'weekend' | 'special';
    multiplier: number;
    timeRange?: { start: string; end: string };
  }[];
  currentPrice: number; // Based on date/time
}

// ============================================================================
// Analytics & Audit Types
// ============================================================================

export interface AgentAuditLog {
  id: string;
  actionId: string;
  action: AgentTool;
  userId?: string;
  adminId?: string;
  parameters: Record<string, any>;
  result: AgentActionResult;
  approvalRequest?: ApprovalRequest;
  approvalResponse?: ApprovalResponse;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface AgentStats {
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  actionsRequiringApproval: number;
  approvalRate: number;
  averageExecutionTime: number;
  toolUsage: Record<AgentTool, number>;
  commonErrors: { code: string; count: number }[];
}
