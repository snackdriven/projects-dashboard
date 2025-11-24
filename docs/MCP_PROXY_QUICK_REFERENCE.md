# MCP Proxy Quick Reference

One-page reference for the memory-shack MCP proxy API.

## Endpoints

```
POST   /api/mcp/memory-shack        Execute MCP tool
GET    /api/mcp/memory-shack/tools  List available tools
```

## Request Format

```typescript
{
  tool: string,              // Required: tool name
  arguments?: object         // Optional: tool-specific args
}
```

## Response Format

```typescript
// Success
{
  success: true,
  data: any,
  meta: { tool: string, category: string, duration: number }
}

// Error
{
  error: string,
  hint?: string,
  meta?: { tool?: string, duration: number }
}
```

## Timeline Tools

| Tool | Purpose | Key Args |
|------|---------|----------|
| `store_timeline_event` | Create event | `timestamp`, `type`, `title` |
| `get_timeline` | List events | `date` (YYYY-MM-DD) |
| `get_event` | Get one event | `event_id` |
| `update_event` | Modify event | `event_id`, `updates` |
| `delete_event` | Remove event | `event_id` |
| `get_timeline_range` | Date range | `start_date`, `end_date` |
| `get_timeline_summary` | Stats only | `date` |
| `get_event_types` | All types | (none) |
| `expand_event` | Store full data | `event_id`, `full_data` |

## Memory (KV) Tools

| Tool | Purpose | Key Args |
|------|---------|----------|
| `store_memory` | Save key-value | `key`, `value` |
| `retrieve_memory` | Get value | `key` |
| `delete_memory` | Remove | `key` |
| `list_memories` | List all | `namespace?` |
| `search_memories` | Search | `search_term` |
| `bulk_store_memories` | Save many | `memories[]` |
| `bulk_delete_memories` | Delete pattern | `pattern` |
| `has_memory` | Check exists | `key` |
| `update_memory_ttl` | Change TTL | `key`, `ttl` |
| `get_memory_stats` | Statistics | (none) |
| `clean_expired_memories` | Cleanup | (none) |

## Common Patterns

### Store Event
```bash
curl -X POST http://localhost:3001/api/mcp/memory-shack \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "store_timeline_event",
    "arguments": {
      "timestamp": 1706025600000,
      "type": "jira_ticket",
      "title": "Fix login bug"
    }
  }'
```

### Get Timeline
```bash
curl -X POST http://localhost:3001/api/mcp/memory-shack \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_timeline",
    "arguments": { "date": "2025-01-23" }
  }'
```

### Store Memory
```bash
curl -X POST http://localhost:3001/api/mcp/memory-shack \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "store_memory",
    "arguments": {
      "key": "user:prefs:theme",
      "value": {"mode": "dark"},
      "namespace": "app"
    }
  }'
```

### List Memories
```bash
curl -X POST http://localhost:3001/api/mcp/memory-shack \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "list_memories",
    "arguments": { "namespace": "app" }
  }'
```

## Frontend Integration

### Basic Client
```typescript
export async function callMCP<T>(tool: string, args?: object): Promise<T> {
  const res = await fetch('http://localhost:3001/api/mcp/memory-shack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, arguments: args }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data;
}
```

### React Query Hooks
```typescript
// Query
const { data } = useQuery({
  queryKey: ['timeline', date],
  queryFn: () => callMCP('get_timeline', { date }),
});

// Mutation
const storeMutation = useMutation({
  mutationFn: (event) => callMCP('store_timeline_event', event),
  onSuccess: () => queryClient.invalidateQueries(['timeline']),
});
```

## Testing

```bash
# Start server
pnpm dev:backend

# Run tests
./test-mcp-proxy.sh

# Manual test
curl http://localhost:3001/api/mcp/memory-shack/tools
```

## Error Handling

```typescript
try {
  const result = await callMCP('store_timeline_event', event);
} catch (error) {
  if (error instanceof MCPProxyError) {
    console.error(error.message, error.hint);
  }
}
```

## Common Errors

| Error | Status | Fix |
|-------|--------|-----|
| Missing tool parameter | 400 | Add `tool` field |
| Unknown tool | 400 | Check tool name |
| Invalid arguments | 400 | Fix args format |
| MCP timeout | 500 | Check DB/server |
| MCP spawn failed | 500 | Build memory-shack |

## Performance

- Latency: 200-500ms per operation
- Timeout: 30 seconds max
- Concurrency: Supports parallel requests

## Files

- **Implementation:** `server/index.js`
- **API Docs:** `docs/MCP_PROXY_API.md`
- **Guide:** `docs/MCP_PROXY_IMPLEMENTATION.md`
- **Tests:** `test-mcp-proxy.sh`

## Quick Start

1. **Start backend:** `pnpm dev:backend`
2. **Test endpoint:** `./test-mcp-proxy.sh`
3. **Integrate frontend:** Use `callMCP()` function
4. **Connect UI:** Hook up React Query hooks

## More Info

- Full API reference: `docs/MCP_PROXY_API.md`
- Implementation details: `docs/MCP_PROXY_IMPLEMENTATION.md`
- Troubleshooting: See implementation guide
