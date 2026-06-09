/**
 * GET /api/agent/pending-approvals
 * Get list of pending approval requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOrchestrator } from '@/lib/agent/orchestrator';

const orchestrator = createOrchestrator(process.env.NEXT_PUBLIC_API_URL || '');

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role') || 'guest';

    // Only admins can view approval requests
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can view approval requests' },
        { status: 403 }
      );
    }

    const pending = orchestrator.getPendingApprovals();

    return NextResponse.json({
      success: true,
      totalPending: pending.length,
      approvals: pending.map((req) => ({
        actionId: req.actionId,
        action: req.action,
        summary: req.summary,
        riskLevel: req.riskLevel,
        estimatedValue: req.estimatedValue,
        expiresAt: req.expiresAt,
      })),
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve pending approvals' },
      { status: 500 }
    );
  }
}
