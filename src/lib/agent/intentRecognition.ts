/**
 * Intent Recognition Engine
 * Converts user messages into structured agent intents
 */

import type { UserIntent, IntentRecognitionResult, AgentTool } from './types';
import { getToolDefinition } from './toolDefinitions';

// Keywords and patterns for intent matching
const INTENT_PATTERNS: Record<
  AgentTool,
  {
    keywords: string[];
    patterns: RegExp[];
    extractParams: (message: string) => Record<string, any>;
  }
> = {
  check_availability: {
    keywords: ['available', 'slots', 'time', 'when', 'free', 'open', 'booking times'],
    patterns: [
      /(?:when|what time)?.*(?:available|free|open|slots?)/i,
      /(?:check|show|list).*(?:available|free|open|slots|times)/i,
      /is.*(?:available|free|open)/i,
    ],
    extractParams: (msg: string) => {
      const sportMatch = msg.match(/(?:for|cricket|football|padel|futsal|badminton|squash)/i);
      const dateMatch = msg.match(
        /(?:on|for)?\s*(?:today|tomorrow|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{4})?)/i
      );

      return {
        sport: sportMatch ? sportMatch[0] : undefined,
        date: dateMatch ? dateMatch[0] : undefined,
      };
    },
  },

  create_booking: {
    keywords: ['book', 'reserve', 'booking', 'schedule', 'want to play', 'book me', 'sign up'],
    patterns: [
      /(?:i want to|want to|can i|can you).*(?:book|reserve|schedule|play)/i,
      /(?:book|reserve|schedule).*(?:for|on|at)/i,
      /(?:book me|sign me up|get me|reserve me).*/i,
    ],
    extractParams: (msg: string) => {
      const sportMatch = msg.match(/(?:cricket|football|padel|futsal|badminton|squash|tennis)/i);
      const dateMatch = msg.match(
        /(?:on|for)?\s*(?:today|tomorrow|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{4})?)/i
      );
      const timeMatch = msg.match(/(?:at|from)?\s*(\d{1,2}):?(\d{2})?\s*(?:am|pm)?/i);
      const nameMatch = msg.match(/(?:name[:\s]+)([a-z\s]+)(?:\s*(?:phone|email))?/i);
      const phoneMatch = msg.match(/(?:phone[:\s]+)?(\d{10,})/);
      const emailMatch = msg.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

      return {
        sport: sportMatch ? sportMatch[0] : undefined,
        date: dateMatch ? dateMatch[0] : undefined,
        startTime: timeMatch ? `${timeMatch[1]}:${timeMatch[2] || '00'}` : undefined,
        customerName: nameMatch ? nameMatch[1]?.trim() : undefined,
        customerPhone: phoneMatch ? phoneMatch[1] : undefined,
        customerEmail: emailMatch ? emailMatch[0] : undefined,
      };
    },
  },

  list_bookings: {
    keywords: ['my bookings', 'show me', 'list', 'history', 'previous', 'past', 'upcoming'],
    patterns: [/(?:show|list|get).*(?:my|all).*(?:bookings|reservations|history)/i, /(?:my|all).*(?:bookings|reservations)/i],
    extractParams: (msg: string) => {
      const statusMatch = msg.match(/(?:upcoming|pending|confirmed|cancelled|past)/i);
      const limitMatch = msg.match(/(?:show|last)\s*(\d+)/i);

      return {
        status: statusMatch ? statusMatch[0].toLowerCase() : undefined,
        limit: limitMatch ? parseInt(limitMatch[1]) : undefined,
      };
    },
  },

  get_booking_details: {
    keywords: ['booking details', 'confirm', 'information', 'details', 'booking number'],
    patterns: [/(?:booking|reservation).*(?:details|information|confirmation)/i, /(?:what|tell me).*(?:about|regarding).*(?:booking|reservation)/i],
    extractParams: (msg: string) => {
      const idMatch = msg.match(/(?:booking|reservation|id|#)?[\s#]*([a-z0-9]{8,})/i);
      return {
        bookingId: idMatch ? idMatch[1] : undefined,
      };
    },
  },

  cancel_booking: {
    keywords: ['cancel', 'delete', 'remove', 'refund', 'undo'],
    patterns: [
      /(?:cancel|delete|remove|undo).*(?:booking|reservation|reservation)/i,
      /(?:i want to|can i|please).*(?:cancel|delete|remove).*(?:booking|reservation)/i,
    ],
    extractParams: (msg: string) => {
      const idMatch = msg.match(/(?:booking|reservation|id|#)?[\s#]*([a-z0-9]{8,})/i);
      const reasonMatch = msg.match(/(?:because|reason|due to)[:\s]+(.+?)(?:\.|$|,)/i);

      return {
        bookingId: idMatch ? idMatch[1] : undefined,
        reason: reasonMatch ? reasonMatch[1]?.trim() : undefined,
      };
    },
  },

  reschedule_booking: {
    keywords: ['reschedule', 'change date', 'move', 'postpone', 'delay', 'shift'],
    patterns: [
      /(?:reschedule|change|move|postpone|delay).*(?:booking|reservation)/i,
      /(?:i want to|can i).*(?:reschedule|change|move|postpone).*(?:booking|reservation|time)/i,
    ],
    extractParams: (msg: string) => {
      const idMatch = msg.match(/(?:booking|reservation|id|#)?[\s#]*([a-z0-9]{8,})/i);
      const dateMatch = msg.match(
        /(?:to|for)?\s*(?:today|tomorrow|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{4})?)/i
      );
      const timeMatch = msg.match(/(?:at|from)?\s*(\d{1,2}):?(\d{2})?\s*(?:am|pm)?/i);

      return {
        bookingId: idMatch ? idMatch[1] : undefined,
        newDate: dateMatch ? dateMatch[0] : undefined,
        newStartTime: timeMatch ? `${timeMatch[1]}:${timeMatch[2] || '00'}` : undefined,
      };
    },
  },

  get_user_profile: {
    keywords: ['profile', 'account', 'my info', 'details', 'information'],
    patterns: [/(?:show|get|display).*(?:my|user).*(?:profile|account|info|details)/i, /(?:my|user).*(?:profile|account)/i],
    extractParams: () => ({}),
  },

  update_user_profile: {
    keywords: ['update profile', 'change', 'modify', 'edit', 'update'],
    patterns: [/(?:update|change|modify|edit).*(?:my|profile|account|phone|email|name)/i],
    extractParams: (msg: string) => {
      const nameMatch = msg.match(/name[:\s]+([a-z\s]+)(?:\s*(?:phone|email))?/i);
      const phoneMatch = msg.match(/phone[:\s]+(\d{10,})/i);
      const emailMatch = msg.match(/email[:\s]+([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);

      return {
        name: nameMatch ? nameMatch[1]?.trim() : undefined,
        phone: phoneMatch ? phoneMatch[1] : undefined,
        email: emailMatch ? emailMatch[0] : undefined,
      };
    },
  },

  get_sports: {
    keywords: ['sports', 'what sports', 'available sports', 'facilities', 'list'],
    patterns: [
      /(?:what|list|show).*(?:sports|facilities|available|options)/i,
      /(?:which|what).*(?:sports|activities).*(?:available|offer|have)/i,
    ],
    extractParams: () => ({
      active: true,
    }),
  },

  get_pricing: {
    keywords: ['price', 'cost', 'rate', 'how much', 'charges', 'fees'],
    patterns: [
      /(?:what|how).*(?:price|cost|rate|charges|fees).*(?:for|cricket|football|padel)/i,
      /(?:pricing|rates|prices|costs).*(?:for|cricket|football|padel)/i,
    ],
    extractParams: (msg: string) => {
      const sportMatch = msg.match(/(?:for|cricket|football|padel|futsal|badminton|squash)/i);
      const dateMatch = msg.match(
        /(?:on|for)?\s*(?:today|tomorrow|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{4})?)/i
      );

      return {
        sport: sportMatch ? sportMatch[0] : undefined,
        date: dateMatch ? dateMatch[0] : undefined,
      };
    },
  },

  process_payment: {
    keywords: ['payment', 'pay', 'charge', 'invoice', 'settle'],
    patterns: [/(?:process|pay|charge|settle).*(?:payment|invoice|amount)/i],
    extractParams: (msg: string) => {
      const amountMatch = msg.match(/(?:amount|charge)?\s*(?:rs|pkr)?\s*(\d+)/i);
      const methodMatch = msg.match(/(?:cash|card|easypaisa|jazzcash|online)/i);

      return {
        amount: amountMatch ? parseInt(amountMatch[1]) : undefined,
        method: methodMatch ? methodMatch[0].toLowerCase() : undefined,
      };
    },
  },

  send_notification: {
    keywords: ['notify', 'message', 'send', 'contact', 'reach out'],
    patterns: [/(?:send|notify|message|contact).*(?:user|customer|client)/i],
    extractParams: (msg: string) => {
      const typeMatch = msg.match(/(?:via|by|through|as)?\s*(?:email|sms|whatsapp|message)/i);
      return {
        type: typeMatch ? typeMatch[0].toLowerCase() : undefined,
      };
    },
  },

  list_customers: {
    keywords: ['customers', 'users', 'list', 'all', 'members'],
    patterns: [/(?:list|show|get|all).*(?:customers|users|members|clients)/i],
    extractParams: (msg: string) => {
      const searchMatch = msg.match(/(?:search|find).*(?:for|named)?[\s:]+(.+?)(?:\s*(?:or|and))?/i);
      const sortMatch = msg.match(/(?:sort|order).*(?:by)?[\s:]+(?:name|email|spent|booking)/i);

      return {
        search: searchMatch ? searchMatch[1]?.trim() : undefined,
        sortBy: sortMatch ? sortMatch[0] : undefined,
      };
    },
  },

  get_admin_stats: {
    keywords: ['stats', 'statistics', 'analytics', 'report', 'dashboard', 'summary'],
    patterns: [/(?:show|get|display).*(?:stats|statistics|analytics|report|dashboard)/i],
    extractParams: (msg: string) => {
      const dateFromMatch = msg.match(/(?:from|since)[\s:]+(\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{4})?)/i);
      const dateToMatch = msg.match(/(?:to|until)[\s:]+(\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{4})?)/i);
      const breakdownMatch = msg.match(/(?:by|breakdown)[\s:]+(?:sport|payment|day|hour)/i);

      return {
        dateFrom: dateFromMatch ? dateFromMatch[1] : undefined,
        dateTo: dateToMatch ? dateToMatch[1] : undefined,
        breakdown: breakdownMatch ? breakdownMatch[0] : undefined,
      };
    },
  },
};

/**
 * Recognize user intent from natural language message
 */
export function recognizeIntent(message: string): IntentRecognitionResult {
  const normalizedMsg = message.toLowerCase().trim();

  // Score each tool based on keyword and pattern matches
  const scores: Record<string, number> = {};
  const possibleIntents: UserIntent[] = [];

  for (const [toolName, config] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;

    // Check keywords (low weight)
    for (const keyword of config.keywords) {
      if (normalizedMsg.includes(keyword.toLowerCase())) {
        score += 0.3;
      }
    }

    // Check patterns (high weight)
    for (const pattern of config.patterns) {
      if (pattern.test(normalizedMsg)) {
        score += 0.7;
      }
    }

    // Extract parameters if confident
    if (score > 0) {
      const params = config.extractParams(message);
      const toolDef = getToolDefinition(toolName);

      possibleIntents.push({
        action: toolName as AgentTool,
        confidence: Math.min(score, 1),
        parameters: params,
        requiresApproval: toolDef?.requiresApproval === 'always' || toolDef?.requiresApproval === 'high_value',
        explanation: `Matched ${toolName} with ${(score * 100).toFixed(0)}% confidence`,
      });

      scores[toolName] = score;
    }
  }

  // Sort by confidence
  possibleIntents.sort((a, b) => b.confidence - a.confidence);

  // Determine if clarification is needed
  let ambiguous = false;
  let clarificationNeeded: string | undefined;

  if (possibleIntents.length === 0) {
    clarificationNeeded = 'I did not understand what you want to do. Please describe what you need help with.';
    ambiguous = true;
  } else if (possibleIntents.length > 1) {
    const topScore = possibleIntents[0].confidence;
    const secondScore = possibleIntents[1]?.confidence || 0;

    // If top two scores are too close, ask for clarification
    if (topScore - secondScore < 0.2) {
      ambiguous = true;
      const options = possibleIntents
        .slice(0, 3)
        .map((intent) => intent.action.replace(/_/g, ' '))
        .join(', ');
      clarificationNeeded = `Did you mean: ${options}?`;
    }
  }

  // Validate parameters for top intent
  if (!ambiguous && possibleIntents.length > 0) {
    const topIntent = possibleIntents[0];
    const toolDef = getToolDefinition(topIntent.action);

    if (toolDef) {
      const missingRequired = [];
      for (const [paramName, paramDef] of Object.entries(toolDef.parameters)) {
        if (paramDef.required && !topIntent.parameters[paramName]) {
          missingRequired.push(paramName.replace(/_/g, ' '));
        }
      }

      if (missingRequired.length > 0) {
        clarificationNeeded = `To complete this action, I need: ${missingRequired.join(', ')}`;
        ambiguous = true;
      }
    }
  }

  return {
    intents: possibleIntents,
    ambiguous,
    clarificationNeeded,
  };
}

/**
 * Get the top intent from recognition result
 */
export function getTopIntent(result: IntentRecognitionResult): UserIntent | null {
  if (result.ambiguous || result.intents.length === 0) {
    return null;
  }
  return result.intents[0];
}

/**
 * Check if intent has sufficient confidence
 */
export function isHighConfidence(intent: UserIntent, threshold = 0.7): boolean {
  return intent.confidence >= threshold;
}
