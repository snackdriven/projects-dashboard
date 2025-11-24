# MCP Proxy API Documentation

## Overview

The MCP Proxy endpoint provides HTTP access to the memory-shack MCP server, enabling the frontend to perform timeline and memory operations without direct MCP protocol implementation.

**Base URL:** `http://localhost:3001/api/mcp/memory-shack`

## Architecture

```
Frontend (React) → HTTP Request → Express Proxy → MCP Server (stdio) → SQLite DB
                                    ↓
                              JSON-RPC 2.0
```

### How It Works

1. **Frontend** sends HTTP POST with tool name and arguments
2. **Proxy** validates request and spawns MCP server process
3. **MCP Server** executes tool against SQLite database
4. **Proxy** parses MCP response and returns to frontend
5. **Process cleanup** happens automatically after each request

### Design Decisions

- **Spawn-per-request**: Simpler than persistent process, good for solo dev
- **No caching**: CRUD operations shouldn't be cached
- **No rate limiting**: Solo dev environment, localhost only
- **No authentication**: Localhost only, single user

## Endpoints

### 1. Call MCP Tool

**POST** `/api/mcp/memory-shack`

Execute a memory-shack MCP tool.

#### Request Body

```json
{
  "tool": "store_timeline_event",
  "arguments": {
    "timestamp": 1706025600000,
    "type": "jira_ticket",
    "title": "Fix login bug",
    "metadata": {
      "project": "dashboard",
      "priority": "high"
    }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tool` | string | Yes | MCP tool name (see Available Tools) |
| `arguments` | object | No | Tool-specific parameters |

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "event_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "meta": {
    "tool": "store_timeline_event",
    "category": "timeline",
    "duration": 245
  }
}
```

#### Error Responses

**400 Bad Request** - Invalid tool or arguments
```json
{
  "error": "Unknown tool: invalid_tool",
  "hint": "Valid tools: store_timeline_event, get_timeline, ...",
  "availableTools": [
    {
      "name": "store_timeline_event",
      "category": "timeline",
      "description": "Store a new timeline event"
    }
  ]
}
```

**500 Internal Server Error** - MCP execution failed
```json
{
  "error": "MCP operation timed out after 30 seconds",
  "meta": {
    "tool": "get_timeline",
    "duration": 30000
  }
}
```

### 2. List Available Tools

**GET** `/api/mcp/memory-shack/tools`

Get all available MCP tools with descriptions.

#### Success Response (200 OK)

```json
{
  "tools": [
    {
      "name": "store_timeline_event",
      "category": "timeline",
      "description": "Store a new timeline event"
    },
    {
      "name": "store_memory",
      "category": "memory",
      "description": "Store a key-value memory"
    }
  ],
  "byCategory": {
    "timeline": [...],
    "memory": [...]
  },
  "totalCount": 20
}
```

## Available Tools

### Timeline Tools (9 tools)

#### `store_timeline_event`
Store a new timeline event.

**Arguments:**
```typescript
{
  timestamp: number | string,  // Unix ms or ISO string
  type: string,                // Event type (e.g., "jira_ticket")
  title?: string,              // Human-readable summary
  metadata?: object,           // Lightweight JSON data
  namespace?: string           // Grouping (e.g., "dev:context")
}
```

**Returns:**
```json
{ "event_id": "uuid" }
```

#### `get_timeline`
Get all events for a specific date.

**Arguments:**
```typescript
{
  date: string,        // YYYY-MM-DD
  type?: string,       // Filter by type
  limit?: number       // Max events to return
}
```

**Returns:**
```json
{
  "events": [...],
  "stats": {
    "total": 5,
    "by_type": { "jira_ticket": 2, "git_commit": 3 }
  }
}
```

#### `get_event`
Get a single event by ID.

**Arguments:**
```typescript
{ event_id: string }
```

**Returns:**
```json
{
  "id": "uuid",
  "timestamp": 1706025600000,
  "date": "2025-01-23",
  "type": "jira_ticket",
  "title": "Fix login bug",
  "metadata": { ... },
  "created_at": 1706025600000,
  "updated_at": 1706025600000
}
```

#### `update_event`
Update an existing event.

**Arguments:**
```typescript
{
  event_id: string,
  updates: {
    title?: string,
    metadata?: object,
    namespace?: string,
    timestamp?: number
  }
}
```

**Returns:** Updated event object

#### `delete_event`
Delete a timeline event.

**Arguments:**
```typescript
{ event_id: string }
```

**Returns:**
```json
{ "deleted": true }
```

#### `get_timeline_range`
Get events across a date range.

**Arguments:**
```typescript
{
  start_date: string,  // YYYY-MM-DD
  end_date: string,    // YYYY-MM-DD
  type?: string,
  limit?: number
}
```

**Returns:** Same as `get_timeline`

#### `expand_event`
Store full event data (large payloads).

**Arguments:**
```typescript
{
  event_id: string,
  full_data: any      // Large JSON payload
}
```

#### `get_timeline_summary`
Get event statistics without loading data.

**Arguments:**
```typescript
{ date: string }  // YYYY-MM-DD
```

**Returns:**
```json
{
  "total": 10,
  "by_type": { "jira_ticket": 5, "git_commit": 5 }
}
```

#### `get_event_types`
Get all event types with counts.

**Arguments:** None

**Returns:**
```json
{
  "types": [
    { "type": "jira_ticket", "count": 25 },
    { "type": "git_commit", "count": 50 }
  ]
}
```

### Memory (KV) Tools (11 tools)

#### `store_memory`
Store a key-value memory.

**Arguments:**
```typescript
{
  key: string,
  value: any,          // Any JSON-serializable value
  namespace?: string,
  ttl?: number         // Seconds until expiration
}
```

**Returns:**
```json
{ "stored": true }
```

#### `retrieve_memory`
Retrieve a memory by key.

**Arguments:**
```typescript
{ key: string }
```

**Returns:**
```json
{
  "key": "user:preferences:theme",
  "value": { "mode": "dark" },
  "metadata": {
    "namespace": "app",
    "created_at": 1706025600000,
    "updated_at": 1706025600000,
    "expires_at": null
  }
}
```

#### `delete_memory`
Delete a memory by key.

**Arguments:**
```typescript
{ key: string }
```

**Returns:**
```json
{ "deleted": true }
```

#### `list_memories`
List all memories with optional filtering.

**Arguments:**
```typescript
{
  namespace?: string,  // Filter by namespace
  pattern?: string     // Wildcard pattern (e.g., "user:*")
}
```

**Returns:**
```json
{
  "memories": [...],
  "count": 10
}
```

#### `search_memories`
Search memories by value content.

**Arguments:**
```typescript
{
  search_term: string,
  namespace?: string
}
```

**Returns:**
```json
{
  "memories": [...],
  "count": 3
}
```

#### `bulk_store_memories`
Store multiple memories in one transaction.

**Arguments:**
```typescript
{
  memories: Array<{
    key: string,
    value: any,
    namespace?: string,
    ttl?: number
  }>
}
```

**Returns:**
```json
{ "stored": 5 }
```

#### `bulk_delete_memories`
Delete memories matching a pattern.

**Arguments:**
```typescript
{ pattern: string }  // e.g., "temp:*"
```

**Returns:**
```json
{ "deleted": 10 }
```

#### `has_memory`
Check if a memory exists (without loading value).

**Arguments:**
```typescript
{ key: string }
```

**Returns:**
```json
{ "exists": true }
```

#### `update_memory_ttl`
Update or remove TTL for a memory.

**Arguments:**
```typescript
{
  key: string,
  ttl: number | null  // null = never expires
}
```

**Returns:**
```json
{ "updated": true }
```

#### `get_memory_stats`
Get memory statistics.

**Arguments:** None

**Returns:**
```json
{
  "total": 50,
  "by_namespace": {
    "app": 10,
    "cache": 25,
    "temp": 15
  },
  "expired": 5
}
```

#### `clean_expired_memories`
Remove all expired memories.

**Arguments:** None

**Returns:**
```json
{ "deleted": 5 }
```

## Error Handling

### Common Errors

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| Missing tool parameter | 400 | No `tool` in request body | Add `tool` field |
| Unknown tool | 400 | Invalid tool name | Check available tools |
| Invalid arguments | 400 | Arguments not an object | Fix request format |
| MCP timeout | 500 | Operation took >30s | Check database/server |
| MCP spawn failed | 500 | Can't start MCP server | Check memory-shack build |
| Parse error | 500 | Invalid MCP response | Check server logs |

### Debugging

Server logs show:
```
[MCP] Calling tool: store_timeline_event {"timestamp":170602...
[MCP] Tool store_timeline_event completed in 245ms
```

For errors:
```
[MCP] Error after 1523ms: Event not found
MCP process exited with code 1
stderr: Error: Event not found
```

## Performance Characteristics

- **Latency**: 200-500ms per operation (includes process spawn)
- **Timeout**: 30 seconds max
- **Concurrency**: Handles concurrent requests (separate processes)
- **Memory**: ~30MB per spawned process (cleaned up automatically)

### Optimization Opportunities

For production or high-traffic scenarios:

1. **Persistent MCP process** - Reuse single process instead of spawning
2. **Connection pooling** - Maintain multiple MCP server instances
3. **Read-through cache** - Cache frequently accessed memories
4. **Batch operations** - Use bulk tools for multiple operations

## Frontend Integration

### Using with fetch

```typescript
async function callMCP(tool: string, args?: object) {
  const response = await fetch('http://localhost:3001/api/mcp/memory-shack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, arguments: args }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error);
  }

  return json.data;
}

// Example usage
const result = await callMCP('store_timeline_event', {
  timestamp: Date.now(),
  type: 'task_completed',
  title: 'Implemented MCP proxy',
});

console.log('Event ID:', result.event_id);
```

### Using with React Query

```typescript
import { useMutation, useQuery } from '@tanstack/react-query';

const useTimelineEvents = (date: string) => {
  return useQuery({
    queryKey: ['timeline', date],
    queryFn: () => callMCP('get_timeline', { date }),
  });
};

const useStoreEvent = () => {
  return useMutation({
    mutationFn: (event) => callMCP('store_timeline_event', event),
    onSuccess: () => {
      queryClient.invalidateQueries(['timeline']);
    },
  });
};
```

## Security Considerations

### Current (Solo Dev)
- Localhost only (CORS restricted)
- No authentication
- No rate limiting
- Direct database access

### Production Recommendations
- Add API key authentication
- Implement rate limiting
- Add request validation middleware
- Use read-only database connections for queries
- Add audit logging for mutations
- Consider moving database behind a proper service layer

## Testing

### Manual Testing with curl

```bash
# List available tools
curl http://localhost:3001/api/mcp/memory-shack/tools

# Store a timeline event
curl -X POST http://localhost:3001/api/mcp/memory-shack \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "store_timeline_event",
    "arguments": {
      "timestamp": 1706025600000,
      "type": "test_event",
      "title": "Testing MCP proxy"
    }
  }'

# Get timeline for today
curl -X POST http://localhost:3001/api/mcp/memory-shack \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_timeline",
    "arguments": {
      "date": "2025-01-23"
    }
  }'

# Store a memory
curl -X POST http://localhost:3001/api/mcp/memory-shack \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "store_memory",
    "arguments": {
      "key": "test:api",
      "value": "It works!",
      "namespace": "testing"
    }
  }'
```

### Test Script

Create `/mnt/c/Users/bette/Desktop/projects-dashboard/test-mcp-proxy.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3001/api/mcp/memory-shack"

echo "Testing MCP Proxy API..."

# Test 1: List tools
echo -e "\n1. List available tools:"
curl -s "$BASE_URL/tools" | jq '.totalCount'

# Test 2: Store event
echo -e "\n2. Store timeline event:"
EVENT_ID=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "store_timeline_event",
    "arguments": {
      "timestamp": '$(date +%s000)',
      "type": "test",
      "title": "API Test"
    }
  }' | jq -r '.data.event_id')
echo "Created event: $EVENT_ID"

# Test 3: Get timeline
echo -e "\n3. Get today's timeline:"
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_timeline",
    "arguments": {
      "date": "'$(date +%Y-%m-%d)'"
    }
  }' | jq '.data.stats'

# Test 4: Store memory
echo -e "\n4. Store memory:"
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "store_memory",
    "arguments": {
      "key": "test:timestamp",
      "value": "'$(date +%s)'",
      "namespace": "testing"
    }
  }' | jq '.success'

echo -e "\nAll tests completed!"
```

## Troubleshooting

### MCP Server Not Found
```
Error: Failed to spawn MCP process: ENOENT
```
**Solution:** Build memory-shack project:
```bash
cd projects/memory-shack
npm run build
```

### Database Lock Errors
```
Error: SQLITE_BUSY: database is locked
```
**Solution:** Close other connections to `.swarm/memory.db`

### Timeout Errors
```
Error: MCP operation timed out after 30 seconds
```
**Solution:** Check database size, add indexes, optimize queries

### JSON Parse Errors
```
Failed to parse MCP response
```
**Solution:** Check MCP server logs, ensure it's returning valid JSON-RPC

## Related Documentation

- [Memory Shack MCP Server](../projects/memory-shack/README.md)
- [Timeline Events Schema](../projects/memory-shack/docs/TIMELINE.md)
- [Memory KV Schema](../projects/memory-shack/docs/MEMORY.md)
- [Frontend Integration Guide](./FRONTEND_INTEGRATION_GUIDE.md)
