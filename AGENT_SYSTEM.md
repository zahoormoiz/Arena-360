# Arena360 Agent System Documentation

## Overview

The Arena360 Agent System is a complete action-capable agent that integrates with the Arena360 booking platform. Unlike a traditional chatbot, this agent can actually perform actions on your behalf - create bookings, check availability, update profiles, process payments, and more.

## Architecture

### Components

#### 1. **Type System** (`lib/agent/types.ts`)
Complete type definitions for the agent system:
- **Agent Tools**: 14 different capabilities the agent can perform
- **Intent Recognition**: How user messages are parsed
- **Execution Model**: How actions are executed and results returned
- **Approval System**: Safety workflow for sensitive operations
- **Audit Trail**: Full logging of all agent actions

#### 2. **Tool Definitions** (`lib/agent/toolDefinitions.ts`)
Metadata for all agent capabilities:
- `check_availability` - Find available time slots
- `create_booking` - Book a sports facility
- `list_bookings` - View user's bookings
- `get_booking_details` - Detailed booking information
- `cancel_booking` - Cancel an existing booking
- `reschedule_booking` - Move booking to new date/time
- `get_user_profile` - View user information
- `update_user_profile` - Modify profile details
- `get_sports` - List available sports
- `get_pricing` - Get pricing information
- `process_payment` - Handle payments (admin only)
- `send_notification` - Send messages to users (admin only)
- `list_customers` - View all customers (admin only)
- `get_admin_stats` - View statistics (admin only)

Each tool has:
- Parameter definitions with type validation
- Auth requirements
- Approval thresholds
- Rate limiting

#### 3. **Intent Recognition** (`lib/agent/intentRecognition.ts`)
Natural language processing engine:
- Analyzes user messages for intent
- Extracts parameters from text
- Handles ambiguous requests
- Provides clarification when needed

**Example:**
```
User: "I want to book cricket tomorrow at 3pm"
↓
Intent: create_booking
Confidence: 92%
Parameters: {
  sport: "cricket",
  date: "tomorrow",
  startTime: "15:00"
}
```

#### 4. **Tool Executor** (`lib/agent/toolExecutor.ts`)
Implements all agent tools:
- Makes API calls to execute actions
- Validates parameters before execution
- Handles errors gracefully
- Tracks execution time

#### 5. **Orchestrator** (`lib/agent/orchestrator.ts`)
Central coordinator:
- Processes messages through intent recognition
- Manages execution flow
- Handles approval workflows
- Maintains action history
- Provides audit trail

## API Endpoints

### 1. POST `/api/agent/chat`
Send a message to the agent

**Request:**
```json
{
  "message": "Book me a cricket slot tomorrow at 3pm",
  "sessionId": "session_123",
  "userId": "user_456",
  "userRole": "user"
}
```

**Response:**
```json
{
  "success": true,
  "response": "I need your confirmation to proceed: Create a booking for cricket on 2024-01-15 at 15:00",
  "intents": [{
    "action": "create_booking",
    "confidence": 0.92,
    "requiresApproval": true
  }],
  "requiresApproval": true
}
```

### 2. POST `/api/agent/confirm`
Approve or reject an action

**Request:**
```json
{
  "actionId": "ACT_1234567890_abc123",
  "approved": true,
  "userId": "user_456",
  "sessionId": "session_123",
  "userRole": "user"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "actionId": "ACT_1234567890_abc123",
    "action": "create_booking",
    "humanReadable": "✅ Booking confirmed! Confirmation code: ABC12345",
    "status": "completed",
    "data": {
      "bookingId": "booking_123",
      "confirmationCode": "ABC12345"
    }
  }
}
```

### 3. GET `/api/agent/capabilities`
List available agent capabilities for the current user role

**Response:**
```json
{
  "success": true,
  "userRole": "user",
  "totalCapabilities": 9,
  "capabilities": [
    {
      "name": "check_availability",
      "description": "Check available time slots for a sport",
      "requiresAuth": false,
      "requiresApproval": "never"
    },
    {
      "name": "create_booking",
      "description": "Create a new booking",
      "requiresAuth": false,
      "requiresApproval": "high_value"
    }
  ]
}
```

### 4. GET `/api/agent/pending-approvals` (Admin only)
Get list of pending approval requests

**Response:**
```json
{
  "success": true,
  "totalPending": 2,
  "approvals": [
    {
      "actionId": "ACT_123",
      "action": "process_payment",
      "summary": "Process payment of PKR 5000 for booking ABC",
      "riskLevel": "high",
      "estimatedValue": 5000,
      "expiresAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 5. GET `/api/agent/history` (Admin only)
Get agent action history

**Response:**
```json
{
  "success": true,
  "totalActions": 25,
  "actions": [
    {
      "id": "ACT_123",
      "tool": "create_booking",
      "userId": "user_456",
      "timestamp": "2024-01-15T10:00:00Z",
      "status": "completed",
      "requiresApproval": false
    }
  ]
}
```

## Usage Examples

### Example 1: Simple Booking
```
User: "I want to book badminton for 1 hour tomorrow evening"

Agent Flow:
1. Recognize intent: create_booking
2. Extract parameters: sport=badminton, duration=60, date=tomorrow, timeRange=evening
3. Check availability
4. Ask for confirmation (high value)
5. Execute booking
6. Return confirmation code
```

### Example 2: Admin Payment Processing
```
User (Admin): "Process payment of 3000 for booking ABC123"

Agent Flow:
1. Recognize intent: process_payment
2. Extract parameters: amount=3000, bookingId=ABC123
3. Require approval (admin action)
4. Execute payment
5. Update booking status
6. Log audit entry
```

### Example 3: Rescheduling with Clarification
```
User: "Move my booking"

Agent: "I found 3 of your bookings. Which one would you like to reschedule?
- Cricket on Jan 15 at 3pm
- Badminton on Jan 16 at 5pm
- Football on Jan 17 at 7pm"

User: "The cricket one, to next week at 2pm"

Agent Flow:
1. Recognize intent: reschedule_booking
2. Extract: bookingId=cricket_jan15, newDate=next_week, newStartTime=14:00
3. Require approval
4. Execute reschedule
5. Return confirmation
```

## Safety & Approval System

### Approval Rules

**Always Require Approval:**
- `cancel_booking` - Prevents accidental cancellations
- `reschedule_booking` - User should confirm date changes
- `process_payment` - Financial operation
- `send_notification` - Admin communication

**High-Value Approval:**
- `create_booking` - Requires approval if booking > 5000 PKR

**Never Require Approval:**
- `check_availability` - Read-only
- `get_sports` - Read-only
- `get_pricing` - Read-only
- `list_bookings` - Read-only
- `get_user_profile` - Read-only

### Risk Levels

- **LOW**: Read-only operations
- **MEDIUM**: Create operations (bookings, profiles)
- **HIGH**: Modify/delete operations, payments, admin actions

### Approval Timeout

- Approvals expire after **15 minutes**
- User must re-request if timeout occurs

## Rate Limiting

Each tool has rate limits to prevent abuse:

```
check_availability:     60/hour, 500/day
create_booking:         20/hour, 100/day
list_bookings:          60/hour, 500/day
cancel_booking:         10/hour, 20/day
reschedule_booking:     10/hour, 20/day
get_user_profile:       60/hour, 500/day
update_user_profile:    10/hour, 50/day
get_sports:             100/hour, 1000/day
get_pricing:            60/hour, 500/day
process_payment:        20/hour, 100/day
send_notification:      100/hour, 500/day
list_customers:         30/hour, 200/day (admin)
get_admin_stats:        20/hour, 100/day (admin)
```

## Intent Recognition Examples

### Booking Creation
```
"I want to book cricket for tomorrow"
"Can I get a badminton slot next week?"
"Book me for padel at 3pm on Friday"
"Schedule a football match this weekend"
```

### Availability Check
```
"Are there any cricket slots on Sunday?"
"When is badminton available?"
"Show me free times for padel"
"What's open tomorrow evening?"
```

### Rescheduling
```
"Can I move my booking to next week?"
"Reschedule my cricket match to Monday"
"Change my badminton time to 5pm"
"Shift my booking to tomorrow"
```

### Cancellation
```
"Cancel my booking"
"I need to cancel my cricket reservation"
"Remove my booking for tomorrow"
"Can you delete my slot?"
```

## Integration with UI

The `EnhancedChatWidget` component integrates the agent system into the chat interface:

```tsx
<EnhancedChatWidget />
```

Features:
- Real-time message processing
- Action approval dialogs
- Suggestion pills
- Loading states
- Error handling
- Toast notifications

## Audit Trail

Every agent action is logged with:
- Action ID
- Tool name
- User/Admin ID
- Parameters
- Result
- Execution time
- Approval details (if applicable)
- Timestamp
- IP address
- User agent

Admin can view full history via `/api/agent/history`

## Error Handling

The agent provides helpful error messages:

```
"Missing required parameter: phone"
"Booking slot is already taken"
"You don't have permission to do this"
"Booking not found"
"Invalid date format. Please use YYYY-MM-DD"
```

## Extensibility

To add a new tool:

1. **Add to types** (`lib/agent/types.ts`)
2. **Define metadata** (`lib/agent/toolDefinitions.ts`)
3. **Implement executor** (`lib/agent/toolExecutor.ts`)
4. **Add intent patterns** (`lib/agent/intentRecognition.ts`)
5. **Generate responses** (`lib/agent/orchestrator.ts`)

Example:
```typescript
// In toolDefinitions.ts
new_tool: {
  name: 'new_tool',
  description: 'What this tool does',
  parameters: { /* ... */ },
  requiresAuth: true,
  requiresApproval: 'always',
}

// In intentRecognition.ts
new_tool: {
  keywords: ['keyword1', 'keyword2'],
  patterns: [/regex pattern/i],
  extractParams: (msg) => ({ /* extract from message */ })
}

// In toolExecutor.ts
TOOL_EXECUTORS['new_tool'] = async (params, context) => {
  // Implement tool logic
}
```

## Performance

- Intent recognition: < 10ms
- Tool execution: 100-500ms depending on API calls
- Approval handling: < 5ms
- Rate limiting: O(1) lookup

## Security

- All admin tools require authentication and authorization
- Sensitive parameters (passwords, tokens) are never logged
- Approval requests expire after 15 minutes
- Rate limiting prevents abuse
- Full audit trail for compliance

## Testing

```bash
# Test intent recognition
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Book cricket for tomorrow",
    "sessionId": "test_123",
    "userId": "user_123",
    "userRole": "user"
  }'

# Get capabilities
curl http://localhost:3000/api/agent/capabilities

# Get pending approvals (admin)
curl http://localhost:3000/api/agent/pending-approvals \
  -H "x-user-role: admin"
```

## Future Enhancements

- [ ] Multi-turn conversation context
- [ ] User preferences learning
- [ ] Scheduled actions
- [ ] Batch operations
- [ ] Webhook notifications
- [ ] Advanced analytics
- [ ] ML-based intent confidence
- [ ] Voice integration
- [ ] Multi-language support
- [ ] Custom tool creation
