/**
 * GET /api/agent/capabilities
 * List all available agent capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToolNames, getToolDefinition, getPublicTools, getUserTools, getAdminTools } from '@/lib/agent/toolDefinitions';

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role') || 'guest';

    let tools: string[];

    if (userRole === 'admin') {
      tools = getToolNames(); // Admins see all tools
    } else if (userRole === 'user') {
      tools = [...getPublicTools(), ...getUserTools()];
    } else {
      tools = getPublicTools(); // Guests only see public tools
    }

    const capabilities = tools.map((toolName) => {
      const def = getToolDefinition(toolName);
      return {
        name: toolName,
        description: def?.description,
        parameters: def?.parameters,
        requiresAuth: def?.requiresAuth,
        requiredRole: def?.requiredRole,
        requiresApproval: def?.requiresApproval,
      };
    });

    return NextResponse.json({
      success: true,
      userRole,
      totalCapabilities: capabilities.length,
      capabilities,
    });
  } catch (error) {
    console.error('Get capabilities error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve capabilities' },
      { status: 500 }
    );
  }
}
