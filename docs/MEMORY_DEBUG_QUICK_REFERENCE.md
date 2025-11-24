# Memory Manager Debug Quick Reference

## Console Log Prefixes

| Prefix | Source | Purpose |
|--------|--------|---------|
| `[useMemoryData]` | `src/hooks/useMemoryData.ts` | Data fetching operations |
| `[callMCPTool]` | `src/hooks/useMemoryData.ts` | API communication |
| `[callMCPTool:mutations]` | `src/hooks/useMemoryMutations.ts` | Mutation operations |
| `[MemoryManagerPage]` | `src/pages/MemoryManagerPage.tsx` | Component rendering |
| `[testAPI]` | `src/pages/MemoryManagerPage.tsx` | Direct API test |

## Healthy Load Sequence

```
1. [useMemoryData] refreshTimeline called, timelineDays: 7
2. [useMemoryData] Date range: {startDate: "2024-11-17", endDate: "2024-11-24"}
3. [callMCPTool] Calling: get_timeline_range with args: {...}
4. [callMCPTool] Response status: 200
5. [callMCPTool] Response headers: {content-type: "application/json", ...}
6. [callMCPTool] Response data (full): {success: true, data: {...}}
7. [callMCPTool] Checking data structure: {data.success: true, ...}
8. [callMCPTool] MCP Response: {success: true, data: {...}}
9. [callMCPTool] MCP Response structure: {mcpResponse.success: true, ...}
10. [callMCPTool] Returning nested data: {events: [...], stats: {...}}
11. [useMemoryData] Raw result from callMCPTool: {events: [...], stats: {...}}
12. [useMemoryData] Result structure: {result.events exists: true, ...}
13. [useMemoryData] Setting timeline events: [...]
14. [useMemoryData] Setting timeline stats: {...}
15. [useMemoryData] refreshTimeline completed
16. [MemoryManagerPage] Hook data: {timelineEvents: [...], ...}
17. [MemoryManagerPage] Rendering with activeTab: timeline
18. [MemoryManagerPage] Data passed to tables: {...}
```

## Error Pattern Recognition

### CORS Error

**Symptoms:**
```
Access to fetch at 'http://localhost:3001/...' from origin 'http://localhost:5181'
has been blocked by CORS policy
```

**What it means:** Server not allowing cross-origin requests

**Where to look:** `/mnt/c/Users/bette/Desktop/projects-dashboard/server/index.js` CORS configuration

**Fix:**
```javascript
app.use(cors({
  origin: 'http://localhost:5181',
  credentials: true
}));
```

### Connection Refused

**Symptoms:**
```
[callMCPTool] Response status: (no log appears)
Failed to fetch
net::ERR_CONNECTION_REFUSED
```

**What it means:** Backend server not running

**Fix:** Start backend with `node server/index.js`

### HTTP Error (500/400)

**Symptoms:**
```
[callMCPTool] Response status: 500
[callMCPTool] HTTP error: {error: "..."}
```

**What it means:** Backend received request but errored

**Where to look:** Backend server logs in terminal

### Empty Response

**Symptoms:**
```
[callMCPTool] Response status: 200
[useMemoryData] Raw result from callMCPTool: {events: [], stats: {...}}
[useMemoryData] Setting timeline events: []
```

**What it means:** Backend working but no data

**Possible causes:**
1. MCP server has no data in database
2. Date range doesn't match any events
3. Backend not forwarding request correctly

### Wrong Response Structure

**Symptoms:**
```
[callMCPTool] Response data (full): {...}
[callMCPTool] Checking data structure: {data.success: false, ...}
[callMCPTool] Using fallback parsing
```

**What it means:** Response doesn't match expected structure

**Fix:** Adjust unwrapping logic in `callMCPTool()`

### State Update Not Triggering Render

**Symptoms:**
```
[useMemoryData] Setting timeline events: [5 events]
[MemoryManagerPage] Hook data: {timelineEvents: [], ...}
```

**What it means:** State updated but component got old state

**Possible causes:**
1. React rendering before state update completes
2. State reference not changing (mutating array instead of creating new)

### Parse Error

**Symptoms:**
```
[useMemoryData] Error in refreshTimeline: SyntaxError: Unexpected token...
```

**What it means:** Response is not valid JSON

**Where to look:** Network tab → Response (raw)

## Network Tab Inspection

### Headers

**Look for:**
- `access-control-allow-origin: http://localhost:5181` (CORS)
- `content-type: application/json`
- `status: 200 OK`

**Missing CORS headers:**
```
access-control-allow-origin: (missing)
```
→ CORS error imminent

### Payload

**Expected:**
```json
{
  "tool": "get_timeline_range",
  "arguments": {
    "start_date": "2024-11-17",
    "end_date": "2024-11-24",
    "limit": 1000
  }
}
```

**If different:** Check `useMemoryData.ts` function arguments

### Response

**Expected structure:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "data": {
      "events": [...],
      "stats": {...}
    }
  },
  "meta": {...}
}
```

**Triple-nested:** Backend → MCP → Actual Data

### Preview

Visual representation of response. Should show:
- `▼ success: true`
- `▼ data`
  - `▼ success: true`
  - `▼ data`
    - `▼ events: Array(5)`
    - `▼ stats: Object`

## Test API Button

### Success Output

**Console:**
```
[testAPI] Starting API test...
[testAPI] Response status: 200
[testAPI] Response data: {success: true, data: {...}}
```

**Alert:** "API test successful! Check console for details."

### Failure Output

**Console:**
```
[testAPI] Starting API test...
[testAPI] Error: TypeError: Failed to fetch
```

**Alert:** "API test failed! Check console for error details."

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ MemoryManagerPage Component                            │
│                                                         │
│ useMemoryData({ timelineDays: 7 })                     │
│         │                                               │
│         ▼                                               │
│ ┌───────────────────────────────────────────────────┐  │
│ │ useMemoryData Hook                                │  │
│ │                                                   │  │
│ │ refreshTimeline()                                 │  │
│ │         │                                         │  │
│ │         ▼                                         │  │
│ │ ┌─────────────────────────────────────────────┐  │  │
│ │ │ callMCPTool()                               │  │  │
│ │ │                                             │  │  │
│ │ │ fetch('http://localhost:3001/api/...')      │  │  │
│ │ │         │                                   │  │  │
│ │ │         ▼                                   │  │  │
│ │ │ ┌───────────────────────────────────────┐  │  │  │
│ │ │ │ Backend Server (Express)              │  │  │  │
│ │ │ │                                       │  │  │  │
│ │ │ │ /api/mcp/memory-shack                 │  │  │  │
│ │ │ │         │                             │  │  │  │
│ │ │ │         ▼                             │  │  │  │
│ │ │ │ ┌─────────────────────────────────┐  │  │  │  │
│ │ │ │ │ MCP Server (memory-shack)       │  │  │  │  │
│ │ │ │ │                                 │  │  │  │  │
│ │ │ │ │ SQLite Database                 │  │  │  │  │
│ │ │ │ │ get_timeline_range tool         │  │  │  │  │
│ │ │ │ │         │                       │  │  │  │  │
│ │ │ │ │         ▼                       │  │  │  │  │
│ │ │ │ │ Returns: {events: [...]}        │  │  │  │  │
│ │ │ │ └─────────────────────────────────┘  │  │  │  │
│ │ │ │         │                             │  │  │  │
│ │ │ │         ▼                             │  │  │  │
│ │ │ │ Wraps: {success: true, data: {...}}   │  │  │  │
│ │ │ └───────────────────────────────────────┘  │  │  │
│ │ │         │                                   │  │  │
│ │ │         ▼                                   │  │  │
│ │ │ Unwraps & returns: {events: [...]}         │  │  │
│ │ └─────────────────────────────────────────────┘  │  │
│ │         │                                         │  │
│ │         ▼                                         │  │
│ │ setTimelineEvents(result.events)                 │  │
│ └───────────────────────────────────────────────────┘  │
│         │                                               │
│         ▼                                               │
│ Returns: { timelineEvents, kvMemories, isLoading }     │
│         │                                               │
│         ▼                                               │
│ MemoryTable renders with timelineEvents                │
└─────────────────────────────────────────────────────────┘
```

## Common Fixes

### Issue: Empty tables but backend works

**Check sequence:**
1. Console logs show API call?
2. Response status 200?
3. Response has data?
4. Data unwrapped correctly?
5. State set with data?
6. Component re-rendered?

**Find the break point** in the sequence above.

### Issue: CORS error

**Fix in server/index.js:**
```javascript
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5181',
  credentials: true
}));
```

### Issue: Backend not running

**Start backend:**
```bash
cd /mnt/c/Users/bette/Desktop/projects-dashboard
node server/index.js
```

**Check it's running:**
```bash
curl http://localhost:3001/health
```

### Issue: Response structure mismatch

**Current unwrapping logic expects:**
```javascript
{
  success: true,
  data: {
    success: true,
    data: {
      events: [...]
    }
  }
}
```

**If backend returns different structure,** adjust `callMCPTool()` in `useMemoryData.ts`

## Debugging Workflow

1. **Open page** → http://localhost:5181/memory
2. **Open DevTools** → F12
3. **Check Console** → Look for log sequence
4. **Check Network** → Look for API requests
5. **Click "Test API"** → Verify direct connectivity
6. **Identify failure point** → Use this guide
7. **Apply fix** → Based on error pattern
8. **Refresh page** → Verify fix works

## Contact Information

**Files modified for debugging:**
- `/mnt/c/Users/bette/Desktop/projects-dashboard/src/hooks/useMemoryData.ts`
- `/mnt/c/Users/bette/Desktop/projects-dashboard/src/hooks/useMemoryMutations.ts`
- `/mnt/c/Users/bette/Desktop/projects-dashboard/src/pages/MemoryManagerPage.tsx`

**Related documentation:**
- `/mnt/c/Users/bette/Desktop/projects-dashboard/MEMORY_UI_DEBUG_SUMMARY.md`
- `/mnt/c/Users/bette/Desktop/projects-dashboard/docs/MEMORY_DEBUG_QUICK_REFERENCE.md`
