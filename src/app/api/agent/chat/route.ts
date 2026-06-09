/**
 * POST /api/agent/chat
 * Handle user messages to the agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOrchestrator } from '@/lib/agent/orchestrator';
import type { AgentContext } from '@/lib/agent/types';

const orchestrator = createOrchestrator(process.env.NEXT_PUBLIC_API_URL || '');

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, userId, userRole = 'guest' } = await request.json();

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Message and sessionId are required' },
        { status: 400 }
      );
    }

    // Create agent context
    const context: AgentContext = {
      userId,
      sessionId,
      userRole,
      conversationHistory: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
    };

    // Process message through agent
    const result = await orchestrator.processMessage(message, context);

    return NextResponse.json({
      success: true,
      response: result.response,
      intents: result.intents,
      actions: result.actions,
      requiresApproval: result.requiresApproval,
      clarification: result.clarification,
    });
  } catch (error) {
    console.error('Agent chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
