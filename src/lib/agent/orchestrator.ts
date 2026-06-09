/**
 * Agent Orchestrator
 * Main service that coordinates intent recognition, execution, and approval workflows
 */

import type {
  AgentContext,
  UserIntent,
  AgentAction,
  AgentResponse,
  ApprovalRequest,
  ApprovalResponse,
  AgentMessage,
  AgentAuditLog,
} from './types';
import { recognizeIntent, getTopIntent, isHighConfidence } from './intentRecognition';
import { executeTool, validateToolParameters } from './toolExecutor';
import { getToolDefinition } from './toolDefinitions';
import type { ExecutorContext } from './toolExecutor';

export interface OrchestratorConfig {
  apiUrl: string;
  approvalQueue: Map<string, ApprovalRequest>;
  actionHistory: Map<string, AgentAction>;
}

export class AgentOrchestrator {
  private config: OrchestratorConfig;

  constructor(config: OrchestratorConfig) {
    this.config = config;
  }

  /**
   * Process user message through the agent system
   */
  async processMessage(
    message: string,
    context: AgentContext
  ): Promise<{
    response: string;
    intents: UserIntent[];
    actions?: AgentAction[];
    requiresApproval?: boolean;
    clarification?: string;
  }> {
    // Recognize user intent
    const intentResult = recognizeIntent(message);

    // Add message to conversation history
    const msg: AgentMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    context.conversationHistory.push(msg);

    // Handle ambiguous intent
    if (intentResult.ambiguous) {
      return {
        response: intentResult.clarificationNeeded || 'I need more information. Could you clarify what you need?',
        intents: intentResult.intents,
        clarification: intentResult.clarificationNeeded,
      };
    }

    // Get top intent
    const topIntent = getTopIntent(intentResult);
    if (!topIntent) {
      return {
        response: 'I did not understand your request. Please try again.',
        intents: [],
      };
    }

    // Check confidence
    if (!isHighConfidence(topIntent)) {
      return {
        response: `I'm not confident in my understanding. Did you mean: ${topIntent.action.replace(/_/g, ' ')}?`,
        intents: intentResult.intents,
      };
    }

    // Validate parameters
    const validation = validateToolParameters(topIntent.action, topIntent.parameters);
    if (!validation.valid) {
      return {
        response: `To complete this action, I need: ${validation.errors.join(', ')}`,
        intents: [topIntent],
      };
    }

    // Create action
    const action: AgentAction = {
      id: this.generateActionId(),
      tool: topIntent.action,
      parameters: topIntent.parameters,
      userId: context.userId,
      adminId: context.adminId,
      timestamp: new Date(),
      status: 'pending',
      requiresApproval: topIntent.requiresApproval,
    };

    // Check if approval is needed
    if (topIntent.requiresApproval) {
      const toolDef = getToolDefinition(topIntent.action);
      const approvalRequest: ApprovalRequest = {
        actionId: action.id,
        action: topIntent.action,
        parameters: topIntent.parameters,
        summary: this.generateActionSummary(topIntent),
        riskLevel: this.assessRiskLevel(topIntent),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      };

      if (toolDef?.approvalThreshold && topIntent.parameters.amount > toolDef.approvalThreshold) {
        approvalRequest.estimatedValue = topIntent.parameters.amount;
      }

      this.config.approvalQueue.set(action.id, approvalRequest);
      action.status = 'pending';

      return {
        response: `I need your confirmation to proceed: ${approvalRequest.summary}\n\nPlease confirm or decline this action.`,
        intents: [topIntent],
        actions: [action],
        requiresApproval: true,
      };
    }

    // Execute action
    return this.executeAction(action, context);
  }

  /**
   * Execute an action immediately or after approval
   */
  async executeAction(action: AgentAction, context: AgentContext): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      // Update action status
      action.status = 'executing';
      this.config.actionHistory.set(action.id, action);

      // Execute tool
      const executorContext: ExecutorContext = {
        userId: action.userId,
        adminId: action.adminId,
        userRole: context.userRole,
        apiUrl: this.config.apiUrl,
      };

      const result = await executeTool(action.tool, action.parameters, executorContext);

      // Update action status
      action.status = result.success ? 'completed' : 'failed';
      this.config.actionHistory.set(action.id, action);

      // Generate human-readable response
      const humanReadable = this.generateHumanReadableResponse(action.tool, result, action.parameters);

      return {
        actionId: action.id,
        action: action.tool,
        result,
        humanReadable,
        nextSteps: this.generateNextSteps(action.tool, result),
      };
    } catch (error) {
      action.status = 'failed';
      this.config.actionHistory.set(action.id, action);

      return {
        actionId: action.id,
        action: action.tool,
        result: {
          success: false,
          error: {
            code: 'EXECUTION_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
          },
          executedAt: new Date(),
          duration: Date.now() - startTime,
        },
        humanReadable: 'An error occurred while processing your request. Please try again.',
      };
    }
  }

  /**
   * Handle approval response
   */
  async handleApprovalResponse(actionId: string, approved: boolean, context: AgentContext): Promise<AgentResponse | null> {
    const approvalRequest = this.config.approvalQueue.get(actionId);
    if (!approvalRequest) {
      return null;
    }

    const action = this.config.actionHistory.get(actionId);
    if (!action) {
      return null;
    }

    if (!approved) {
      action.status = 'completed'; // Mark as completed but not executed
      return {
        actionId,
        action: action.tool,
        result: {
          success: false,
          error: {
            code: 'APPROVAL_DENIED',
            message: 'Action was not approved',
          },
          executedAt: new Date(),
          duration: 0,
        },
        humanReadable: 'Your request has been declined.',
      };
    }

    // Mark as approved
    action.status = 'approved';
    action.approvedAt = new Date();
    action.approvedBy = context.userId || context.adminId;

    this.config.approvalQueue.delete(actionId);
    this.config.actionHistory.set(actionId, action);

    // Execute the action
    return this.executeAction(action, context);
  }

  /**
   * Get pending approval requests
   */
  getPendingApprovals(): ApprovalRequest[] {
    return Array.from(this.config.approvalQueue.values()).filter((req) => req.expiresAt > new Date());
  }

  /**
   * Get action history
   */
  getActionHistory(limit = 50): AgentAction[] {
    return Array.from(this.config.actionHistory.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Generate a unique action ID
   */
  private generateActionId(): string {
    return `ACT_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate human-readable action summary
   */
  private generateActionSummary(intent: UserIntent): string {
    const action = intent.action.replace(/_/g, ' ');
    const params = intent.parameters;

    switch (intent.action) {
      case 'create_booking':
        return `Create a booking for ${params.sport} on ${params.date} at ${params.startTime} for ${params.duration} minutes`;
      case 'cancel_booking':
        return `Cancel booking ${params.bookingId}`;
      case 'reschedule_booking':
        return `Reschedule booking ${params.bookingId} to ${params.newDate} at ${params.newStartTime}`;
      case 'process_payment':
        return `Process payment of PKR ${params.amount} for booking ${params.bookingId} via ${params.method}`;
      default:
        return `Execute action: ${action}`;
    }
  }

  /**
   * Assess risk level of an action
   */
  private assessRiskLevel(intent: UserIntent): 'low' | 'medium' | 'high' {
    switch (intent.action) {
      case 'process_payment':
      case 'cancel_booking':
      case 'reschedule_booking':
        return 'high';
      case 'create_booking':
        const amount = intent.parameters.amount || 0;
        return amount > 10000 ? 'high' : 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Generate human-readable response
   */
  private generateHumanReadableResponse(
    action: string,
    result: any,
    params: Record<string, any>
  ): string {
    if (!result.success) {
      return `Failed to ${action.replace(/_/g, ' ')}: ${result.error?.message || 'Unknown error'}`;
    }

    switch (action) {
      case 'check_availability':
        const slots = result.data?.availableSlots || [];
        return slots.length > 0
          ? `Found ${slots.length} available slots for ${params.sport} on ${params.date}`
          : `No available slots found for ${params.sport} on ${params.date}`;

      case 'create_booking':
        return `✅ Booking confirmed! Your confirmation code is: ${result.data?.confirmationCode}. Total amount: PKR ${result.data?.amount}`;

      case 'list_bookings':
        const bookings = result.data || [];
        return bookings.length > 0
          ? `Found ${bookings.length} booking(s)`
          : `You have no bookings yet`;

      case 'cancel_booking':
        return `✅ Booking ${params.bookingId} has been cancelled`;

      case 'reschedule_booking':
        return `✅ Booking rescheduled to ${params.newDate} at ${params.newStartTime}`;

      case 'get_sports':
        const sports = result.data || [];
        return sports.length > 0
          ? `Available sports: ${sports.map((s: any) => s.name).join(', ')}`
          : `No sports available`;

      case 'get_pricing':
        const pricing = result.data;
        return `Price for ${params.sport}: PKR ${pricing?.currentPrice || pricing?.basePrice}`;

      case 'get_user_profile':
        const user = result.data;
        return `Profile: ${user?.name} (${user?.email}) - ${user?.totalBookings || 0} bookings`;

      case 'process_payment':
        return `✅ Payment of PKR ${params.amount} has been processed via ${params.method}`;

      case 'send_notification':
        return `✅ Notification sent via ${params.type}`;

      case 'list_customers':
        const customers = result.data || [];
        return `Found ${customers.length} customer(s)`;

      case 'get_admin_stats':
        const stats = result.data;
        return `Stats: ${stats?.totalBookings || 0} bookings, PKR ${stats?.totalRevenue || 0} revenue`;

      default:
        return `✅ Action completed successfully`;
    }
  }

  /**
   * Generate suggested next steps
   */
  private generateNextSteps(action: string, result: any): string[] {
    if (!result.success) {
      return [];
    }

    switch (action) {
      case 'check_availability':
        return ['Would you like to create a booking?', 'Check pricing for this sport?'];

      case 'create_booking':
        return ['Proceed to payment?', 'Modify booking details?', 'View confirmation?'];

      case 'get_sports':
        return ['Check availability for a sport?', 'View pricing?'];

      case 'get_user_profile':
        return ['View your bookings?', 'Update profile information?'];

      default:
        return [];
    }
  }
}

/**
 * Create a new orchestrator instance
 */
export function createOrchestrator(apiUrl: string): AgentOrchestrator {
  return new AgentOrchestrator({
    apiUrl,
    approvalQueue: new Map(),
    actionHistory: new Map(),
  });
}
