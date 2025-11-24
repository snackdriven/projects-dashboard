# Memory Manager UI Debug Instructions

## What Was Added

Comprehensive console logging has been added to debug why the Memory Manager UI shows empty tables despite the backend working correctly.

## Files Modified

1. **`/mnt/c/Users/bette/Desktop/projects-dashboard/src/hooks/useMemoryData.ts`**
   - Added 15+ console.log statements tracking data flow
   - Logs API calls, responses, parsing, and state updates

2. **`/mnt/c/Users/bette/Desktop/projects-dashboard/src/hooks/useMemoryMutations.ts`**
   - Added console logging to mutation operations
   - Helps debug create/update/delete operations

3. **`/mnt/c/Users/bette/Desktop/projects-dashboard/src/pages/MemoryManagerPage.tsx`**
   - Added component-level logging
   - Added "Test API" button in header for direct testing

## How to Use

### Step 1: Access the Page

1. Ensure both servers are running:
   - Frontend: http://localhost:5181 (already running)
   - Backend: http://localhost:3001 (already running)

2. Navigate to: **http://localhost:5181/memory**

### Step 2: Open Browser DevTools

1. Press **F12** (or right-click → Inspect)
2. Click on the **Console** tab
3. Clear the console (trash icon) for a fresh start

### Step 3: Watch the Logs

As the page loads, you should see logs in this order:

```
[useMemoryData] refreshTimeline called, timelineDays: 7
[useMemoryData] Date range: {startDate: "2024-11-17", endDate: "2024-11-24"}
[callMCPTool] Calling: get_timeline_range with args: {...}
[callMCPTool] Response status: 200
[callMCPTool] Response headers: {...}
[callMCPTool] Response data (full): {...}
[callMCPTool] Checking data structure: {...}
[callMCPTool] MCP Response: {...}
[callMCPTool] Returning nested data: {...}
[useMemoryData] Raw result from callMCPTool: {...}
[useMemoryData] Setting timeline events: [...]
[MemoryManagerPage] Hook data: {...}
[MemoryManagerPage] Rendering with activeTab: timeline
[MemoryManagerPage] Data passed to tables: {...}
```

### Step 4: Click "Test API" Button

1. Look for the blue **"Test API"** button in the top-right of the page header
2. Click it
3. Watch the console for:
   - `[testAPI] Starting API test...`
   - `[testAPI] Response status: 200`
   - `[testAPI] Response data: {...}`
4. An alert will appear showing success or failure

### Step 5: Check Network Tab

1. Click the **Network** tab in DevTools
2. Filter by **Fetch/XHR**
3. Look for POST requests to `http://localhost:3001/api/mcp/memory-shack`
4. Click on the request to see:
   - **Headers**: Request/response headers (check for CORS)
   - **Payload**: Request body sent to server
   - **Response**: Raw response data
   - **Preview**: Formatted response data

### Step 6: Identify the Issue

Use the **Debug Quick Reference** to identify where the data flow breaks:

- See: `/mnt/c/Users/bette/Desktop/projects-dashboard/docs/MEMORY_DEBUG_QUICK_REFERENCE.md`

Common issues and how to spot them:

| Issue | How to Identify |
|-------|----------------|
| **CORS Error** | Console shows "blocked by CORS policy" |
| **Backend Down** | Console shows "Failed to fetch" or "ERR_CONNECTION_REFUSED" |
| **Empty Response** | Logs show `events: []` in response |
| **Wrong Structure** | Logs show data but wrong format |
| **Parse Error** | Console shows JSON parsing error |
| **State Update Issue** | Data logged correctly but UI still empty |

## Expected Behavior

### Healthy Logs

If everything works correctly, you should see:

1. **API Call Initiated:**
   ```
   [callMCPTool] Calling: get_timeline_range
   ```

2. **Successful Response:**
   ```
   [callMCPTool] Response status: 200
   ```

3. **Data Received:**
   ```
   [callMCPTool] Response data (full): {success: true, data: {...}}
   ```

4. **Data Extracted:**
   ```
   [useMemoryData] Setting timeline events: [Array(5)]
   ```

5. **Component Updated:**
   ```
   [MemoryManagerPage] Hook data: {timelineEvents: Array(5), ...}
   ```

6. **UI Renders:**
   - Table shows 5 rows
   - Each row has event data

### Unhealthy Logs

If something is wrong, you might see:

1. **CORS Issue:**
   ```
   Access to fetch at 'http://localhost:3001/...' has been blocked
   ```

2. **Connection Issue:**
   ```
   Failed to fetch
   TypeError: Failed to fetch
   ```

3. **Empty Data:**
   ```
   [useMemoryData] Setting timeline events: []
   ```

4. **Parse Error:**
   ```
   [useMemoryData] Error in refreshTimeline: SyntaxError
   ```

## What to Report

After checking the console and network tabs, report:

### 1. Console Logs
Copy and paste the complete console output, especially:
- First occurrence of `[useMemoryData]`
- All `[callMCPTool]` logs
- Any **red error messages**
- The `[MemoryManagerPage]` logs

### 2. Network Request
From the Network tab, report:
- **Status code** (200, 404, 500, etc.)
- **Response headers** (especially CORS headers)
- **Request payload** (what was sent)
- **Response data** (what was received)

### 3. Test API Result
- Did the "Test API" button show success or failure?
- What did the console logs show?

### 4. Visual State
- Are the tables empty?
- Is there a loading spinner?
- Are there any error messages in the UI?

## Common Fixes

Based on findings, here are likely fixes:

### Fix 1: CORS Error

**Edit:** `/mnt/c/Users/bette/Desktop/projects-dashboard/server/index.js`

Add/update CORS configuration:
```javascript
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5181',
  credentials: true
}));
```

### Fix 2: Backend Not Running

**Terminal:**
```bash
cd /mnt/c/Users/bette/Desktop/projects-dashboard
node server/index.js
```

### Fix 3: Wrong Response Structure

**Edit:** `/mnt/c/Users/bette/Desktop/projects-dashboard/src/hooks/useMemoryData.ts`

Adjust the unwrapping logic in `callMCPTool()` based on actual response structure.

### Fix 4: Empty Database

**Check:** MCP server has data

**Terminal:**
```bash
# Check if memory-shack database has events
sqlite3 /path/to/memory-shack.db "SELECT COUNT(*) FROM timeline_events;"
```

## Logging Locations

### Console Logs

All logs use prefixed format:
- `[useMemoryData]` - Data fetching hook
- `[callMCPTool]` - API communication layer
- `[MemoryManagerPage]` - React component
- `[testAPI]` - Direct API test function

### Network Logs

Found in DevTools → Network tab:
- POST requests to `/api/mcp/memory-shack`
- Contains request/response details
- Shows timing, size, CORS headers

## Documentation

Additional debugging resources:

1. **Full Debug Summary:**
   `/mnt/c/Users/bette/Desktop/projects-dashboard/MEMORY_UI_DEBUG_SUMMARY.md`

2. **Quick Reference Guide:**
   `/mnt/c/Users/bette/Desktop/projects-dashboard/docs/MEMORY_DEBUG_QUICK_REFERENCE.md`

3. **This File:**
   `/mnt/c/Users/bette/Desktop/projects-dashboard/MEMORY_DEBUG_INSTRUCTIONS.md`

## Next Steps

1. Follow steps 1-6 above
2. Gather console and network logs
3. Identify the failure point using Quick Reference
4. Apply the appropriate fix
5. Refresh the page to verify

If the issue is unclear after reviewing logs, provide:
- Complete console output
- Network request/response details
- Screenshots if helpful

## Clean Up

After debugging is complete and the issue is resolved, we can:

1. **Remove logging** (if desired) from production code
2. **Keep logging** (recommended) for future debugging
3. **Remove Test API button** (if not needed in production)

The logging is lightweight and won't impact performance, so it's often beneficial to keep it.
