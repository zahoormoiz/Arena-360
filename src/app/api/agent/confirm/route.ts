/**
 * POST /api/agent/confirm
 * Handle user confirmation/rejection of approval requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOrchestrator } from '@/lib/agent/orchestrator';
import type { AgentContext } from '@/lib/agent/types';

const orchestrator = createOrchestrator(process.env.NEXT_PUBLIC_API_URL || '');

export async function POST(request: NextRequest) {
  try {
    const { actionId, approved, userId, sessionId, userRole } = await request.json();

    if (!actionId || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'ActionId and approved status are required' },
        { status: 400 }
      );
    }

    // Create agent context
    const context: AgentContext = {
      userId,
      sessionId,
      userRole: userRole || 'guest',
      conversationHistory: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
    };

    // Handle approval response
    const result = await orchestrator.handleApprovalResponse(actionId, approved, context);

    if (!result) {
      return NextResponse.json(
        { error: 'Action or approval request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      result: {
        actionId: result.actionId,
        action: result.action,
        humanReadable: result.humanReadable,
        status: result.result.success ? 'completed' : 'failed',
        data: result.result.data,
        error: result.result.error,
      },
    });
  } catch (error) {
    console.error('Agent confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to process confirmation' },
      { status: 500 }
    );
  }
}
