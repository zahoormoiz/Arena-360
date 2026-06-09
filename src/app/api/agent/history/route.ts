/**
 * GET /api/agent/history
 * Get agent action history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOrchestrator } from '@/lib/agent/orchestrator';

const orchestrator = createOrchestrator(process.env.NEXT_PUBLIC_API_URL || '');

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role') || 'guest';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

    // Only admins can view full history
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can view agent history' },
        { status: 403 }
      );
    }

    const history = orchestrator.getActionHistory(Math.min(limit, 500));

    return NextResponse.json({
      success: true,
      totalActions: history.length,
      actions: history.map((action) => ({
        id: action.id,
        tool: action.tool,
        userId: action.userId,
        adminId: action.adminId,
        timestamp: action.timestamp,
        status: action.status,
        requiresApproval: action.requiresApproval,
        approvedAt: action.approvedAt,
        parameters: action.parameters,
      })),
    });
  } catch (error) {
    console.error('Get agent history error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve agent history' },
      { status: 500 }
    );
  }
}
