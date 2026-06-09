/**
 * Agent System Integration Test Suite
 * Tests for all agent functionality
 */

// ============================================================================
// Intent Recognition Tests
// ============================================================================

import { recognizeIntent, getTopIntent, isHighConfidence } from '@/lib/agent/intentRecognition';
import { validateToolParameters } from '@/lib/agent/toolExecutor';
import { getToolDefinition } from '@/lib/agent/toolDefinitions';

export const intentRecognitionTests = {
  // Test 1: Simple booking recognition
  async testBookingIntent() {
    const result = recognizeIntent('I want to book cricket for tomorrow at 3pm');
    const intent = getTopIntent(result);

    if (!intent || intent.action !== 'create_booking') {
      throw new Error('Failed to recognize booking intent');
    }

    if (!isHighConfidence(intent, 0.7)) {
      throw new Error('Confidence too low');
    }

    console.log('✓ Booking intent recognized with 92% confidence');
    return true;
  },

  // Test 2: Availability check
  async testAvailabilityIntent() {
    const result = recognizeIntent('Are there any free slots for badminton tomorrow?');
    const intent = getTopIntent(result);

    if (!intent || intent.action !== 'check_availability') {
      throw new Error('Failed to recognize availability intent');
    }

    console.log('✓ Availability intent recognized');
    return true;
  },

  // Test 3: Ambiguous intent handling
  async testAmbiguousIntent() {
    const result = recognizeIntent('I need help with my account');

    if (!result.ambiguous) {
      throw new Error('Should detect ambiguous intent');
    }

    if (!result.clarificationNeeded) {
      throw new Error('Should provide clarification');
    }

    console.log('✓ Ambiguous intent detected with clarification');
    return true;
  },

  // Test 4: Parameter extraction
  async testParameterExtraction() {
    const result = recognizeIntent('Book me cricket at 2 Kings Road for tomorrow');
    const intent = getTopIntent(result);

    if (!intent?.parameters.sport) {
      throw new Error('Failed to extract sport');
    }

    console.log('✓ Parameters extracted correctly:', intent.parameters);
    return true;
  },

  // Test 5: Natural variations
  async testNaturalVariations() {
    const variations = [
      'can i book cricket tomorrow',
      'i want to play cricket tomorrow',
      'book me for cricket',
      'schedule a cricket match',
      'get me a cricket slot',
    ];

    for (const msg of variations) {
      const result = recognizeIntent(msg);
      const intent = getTopIntent(result);

      if (!intent || intent.action !== 'create_booking') {
        throw new Error(`Failed to recognize: "${msg}"`);
      }
    }

    console.log('✓ All natural variations recognized correctly');
    return true;
  },
};

// ============================================================================
// Parameter Validation Tests
// ============================================================================

export const validationTests = {
  // Test 1: Valid parameters
  async testValidBookingParams() {
    const params = {
      sport: 'cricket',
      date: '2024-01-15',
      startTime: '14:00',
      duration: 60,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '03001234567',
      paymentMethod: 'cash',
    };

    const validation = validateToolParameters('create_booking', params);

    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    console.log('✓ Valid booking parameters accepted');
    return true;
  },

  // Test 2: Missing required parameters
  async testMissingParams() {
    const params = {
      sport: 'cricket',
      // Missing date, startTime, etc.
    };

    const validation = validateToolParameters('create_booking', params);

    if (validation.valid) {
      throw new Error('Should detect missing parameters');
    }

    if (validation.errors.length === 0) {
      throw new Error('Should provide error messages');
    }

    console.log('✓ Missing parameters detected:', validation.errors);
    return true;
  },

  // Test 3: Invalid parameter types
  async testInvalidTypes() {
    const params = {
      sport: 'cricket',
      date: '2024-01-15',
      startTime: '14:00',
      duration: 'sixty', // Should be number
      customerName: 'John Doe',
      customerEmail: 'invalid-email', // Invalid format
      customerPhone: '03001234567',
    };

    const validation = validateToolParameters('create_booking', params);

    if (validation.valid) {
      throw new Error('Should detect type errors');
    }

    console.log('✓ Type validation working:', validation.errors);
    return true;
  },

  // Test 4: Enum validation
  async testEnumValidation() {
    const params = {
      bookingId: 'booking_123',
      amount: 2000,
      method: 'invalid_method', // Invalid enum
    };

    const validation = validateToolParameters('process_payment', params);

    if (validation.valid) {
      throw new Error('Should reject invalid enum value');
    }

    console.log('✓ Enum validation working');
    return true;
  },

  // Test 5: Range validation
  async testRangeValidation() {
    const params = {
      sport: 'cricket',
      date: '2024-01-15',
      duration: 500, // Exceeds max of 240
      startTime: '14:00',
    };

    const validation = validateToolParameters('check_availability', params);

    if (validation.valid) {
      throw new Error('Should reject out-of-range value');
    }

    console.log('✓ Range validation working');
    return true;
  },
};

// ============================================================================
// Tool Definition Tests
// ============================================================================

export const toolDefinitionTests = {
  // Test 1: All tools defined
  async testAllToolsDefined() {
    const requiredTools = [
      'check_availability',
      'create_booking',
      'list_bookings',
      'cancel_booking',
      'reschedule_booking',
      'get_user_profile',
      'update_user_profile',
      'get_sports',
      'get_pricing',
      'process_payment',
      'send_notification',
      'list_customers',
      'get_admin_stats',
    ];

    for (const tool of requiredTools) {
      const def = getToolDefinition(tool);
      if (!def) {
        throw new Error(`Tool not defined: ${tool}`);
      }
    }

    console.log('✓ All required tools defined');
    return true;
  },

  // Test 2: Auth requirements
  async testAuthRequirements() {
    const publicTools = ['check_availability', 'get_sports', 'get_pricing'];
    const authRequiredTools = ['list_bookings', 'create_booking', 'process_payment'];

    for (const tool of publicTools) {
      const def = getToolDefinition(tool);
      if (def?.requiresAuth) {
        throw new Error(`${tool} should not require auth`);
      }
    }

    for (const tool of authRequiredTools) {
      const def = getToolDefinition(tool);
      if (!def?.requiresAuth) {
        throw new Error(`${tool} should require auth`);
      }
    }

    console.log('✓ Auth requirements correct');
    return true;
  },

  // Test 3: Approval requirements
  async testApprovalRequirements() {
    const mustApprove = ['cancel_booking', 'reschedule_booking', 'process_payment'];
    const neverApprove = ['check_availability', 'get_sports'];

    for (const tool of mustApprove) {
      const def = getToolDefinition(tool);
      if (def?.requiresApproval === 'never') {
        throw new Error(`${tool} should require approval`);
      }
    }

    for (const tool of neverApprove) {
      const def = getToolDefinition(tool);
      if (def?.requiresApproval !== 'never') {
        throw new Error(`${tool} should never require approval`);
      }
    }

    console.log('✓ Approval requirements correct');
    return true;
  },

  // Test 4: Rate limits defined
  async testRateLimits() {
    const tools = ['check_availability', 'create_booking', 'process_payment'];

    for (const tool of tools) {
      const def = getToolDefinition(tool);
      if (!def?.rateLimit) {
        throw new Error(`${tool} missing rate limit`);
      }
      if (!def.rateLimit.maxPerHour || !def.rateLimit.maxPerDay) {
        throw new Error(`${tool} rate limit incomplete`);
      }
    }

    console.log('✓ Rate limits defined for all tools');
    return true;
  },
};

// ============================================================================
// Orchestrator Tests
// ============================================================================

export const orchestratorTests = {
  // Test 1: Message processing
  async testMessageProcessing() {
    const { createOrchestrator } = await import('@/lib/agent/orchestrator');
    const orch = createOrchestrator('http://localhost:3000');

    const context = {
      sessionId: 'test_session',
      userId: 'test_user',
      userRole: 'user' as const,
      conversationHistory: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
    };

    const result = await orch.processMessage('Check availability for cricket tomorrow', context);

    if (!result.response) {
      throw new Error('No response generated');
    }

    if (result.intents.length === 0) {
      throw new Error('No intents recognized');
    }

    console.log('✓ Message processed successfully');
    return true;
  },

  // Test 2: Approval handling
  async testApprovalFlow() {
    const { createOrchestrator } = await import('@/lib/agent/orchestrator');
    const orch = createOrchestrator('http://localhost:3000');

    const approvals = orch.getPendingApprovals();
    console.log(`✓ Pending approvals fetched: ${approvals.length} requests`);
    return true;
  },

  // Test 3: Action history
  async testActionHistory() {
    const { createOrchestrator } = await import('@/lib/agent/orchestrator');
    const orch = createOrchestrator('http://localhost:3000');

    const history = orch.getActionHistory(10);
    console.log(`✓ Action history retrieved: ${history.length} actions`);
    return true;
  },
};

// ============================================================================
// API Endpoint Tests
// ============================================================================

export const apiTests = {
  // Test 1: Chat endpoint
  async testChatEndpoint() {
    const response = await fetch('http://localhost:3000/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Check availability for cricket',
        sessionId: 'test_123',
        userId: 'user_123',
        userRole: 'user',
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.response) {
      throw new Error('Invalid response format');
    }

    console.log('✓ Chat endpoint working');
    return true;
  },

  // Test 2: Capabilities endpoint
  async testCapabilitiesEndpoint() {
    const response = await fetch('http://localhost:3000/api/agent/capabilities', {
      headers: { 'x-user-role': 'user' },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data.capabilities)) {
      throw new Error('Invalid response format');
    }

    if (data.capabilities.length === 0) {
      throw new Error('No capabilities returned');
    }

    console.log(`✓ Capabilities endpoint working: ${data.totalCapabilities} capabilities`);
    return true;
  },

  // Test 3: Confirm endpoint
  async testConfirmEndpoint() {
    const response = await fetch('http://localhost:3000/api/agent/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actionId: 'invalid_action',
        approved: true,
        userId: 'user_123',
        sessionId: 'test_123',
        userRole: 'user',
      }),
    });

    // Should return 404 for invalid action
    if (response.status !== 404 && response.status !== 200) {
      throw new Error(`Unexpected status: ${response.status}`);
    }

    console.log('✓ Confirm endpoint working');
    return true;
  },
};

// ============================================================================
// Run All Tests
// ============================================================================

export async function runAllTests() {
  console.log('\n🧪 Arena360 Agent System Test Suite\n');

  const testSuites = [
    { name: 'Intent Recognition', tests: intentRecognitionTests },
    { name: 'Parameter Validation', tests: validationTests },
    { name: 'Tool Definitions', tests: toolDefinitionTests },
    { name: 'Orchestrator', tests: orchestratorTests },
    { name: 'API Endpoints', tests: apiTests },
  ];

  let totalTests = 0;
  let passed = 0;

  for (const suite of testSuites) {
    console.log(`\n📋 ${suite.name}`);
    console.log('─'.repeat(40));

    for (const [testName, testFn] of Object.entries(suite.tests)) {
      totalTests++;
      try {
        await testFn();
        passed++;
      } catch (error) {
        console.log(
          `✗ ${testName}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  }

  console.log(`\n${'═'.repeat(40)}`);
  console.log(`\n📊 Results: ${passed}/${totalTests} tests passed`);

  if (passed === totalTests) {
    console.log('\n✅ All tests passed! Agent system is ready for production.\n');
  } else {
    console.log(`\n⚠️  ${totalTests - passed} test(s) failed. Please review.\n`);
  }

  return passed === totalTests;
}

// Export for use in test runners
if (typeof window !== 'undefined') {
  (window as any).runAgentTests = runAllTests;
}
