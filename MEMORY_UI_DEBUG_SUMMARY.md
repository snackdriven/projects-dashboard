# Memory Manager UI Debug Summary

## Issue
Memory Manager UI at http://localhost:5181/memory shows empty tables despite backend working.

## Debug Setup Complete

### Files Modified with Logging

1. **`/mnt/c/Users/bette/Desktop/projects-dashboard/src/hooks/useMemoryData.ts`**
   - Added comprehensive logging to `callMCPTool()` function
   - Added logging to `refreshTimeline()` function
   - Added logging to `refreshKV()` function
   - Logs track the entire data flow from API call to state updates

2. **`/mnt/c/Users/bette/Desktop/projects-dashboard/src/hooks/useMemoryMutations.ts`**
   - Added comprehensive logging to `callMCPTool()` function
   - Logs mutation operations (create, update, delete)

3. **`/mnt/c/Users/bette/Desktop/projects-dashboard/src/pages/MemoryManagerPage.tsx`**
   - Added logging after hook data retrieval
   - Added logging before render showing data passed to tables
   - Added `testAPI()` function for direct API testing
   - Added "Test API" button in the header

## What to Check

### Step 1: Open Browser Console
1. Navigate to http://localhost:5181/memory
2. Open DevTools (F12)
3. Go to Console tab
4. Look for log messages with these prefixes:
   - `[useMemoryData]` - Data fetching logs
   - `[callMCPTool]` - API call logs
   - `[MemoryManagerPage]` - Component rendering logs
   - `[testAPI]` - Direct API test logs

### Step 2: Check Initial Load Sequence

Look for this sequence on page load:

```
[useMemoryData] refreshTimeline called
[useMemoryData] Date range: {startDate: ..., endDate: ...}
[callMCPTool] Calling: get_timeline_range with args: {...}
[callMCPTool] Response status: 200
[callMCPTool] Response headers: {...}
[callMCPTool] Response data (full): {...}
[callMCPTool] Checking data structure: {...}
[useMemoryData] Raw result from callMCPTool: {...}
[useMemoryData] Setting timeline events: [...]
[MemoryManagerPage] Hook data: {...}
```

### Step 3: Click "Test API" Button

1. Click the blue "Test API" button in the header
2. Watch console for:
   - `[testAPI] Starting API test...`
   - `[testAPI] Response status: 200`
   - `[testAPI] Response data: {...}`
3. Check if alert shows "success" or "failed"

### Step 4: Check Network Tab

1. Go to Network tab in DevTools
2. Filter by "XHR" or "Fetch"
3. Look for POST requests to `http://localhost:3001/api/mcp/memory-shack`
4. Click on the request and check:
   - **Headers tab**: Request headers, Response headers (look for CORS headers)
   - **Payload tab**: Request body sent
   - **Response tab**: Response data received
   - **Preview tab**: Formatted response

### Step 5: Look for Errors

Check for any of these error patterns:

1. **CORS Error**:
   ```
   Access to fetch at 'http://localhost:3001/api/mcp/memory-shack' from origin 'http://localhost:5181'
   has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
   ```

2. **Network Error**:
   ```
   Failed to fetch
   net::ERR_CONNECTION_REFUSED
   ```

3. **HTTP Error**:
   ```
   [callMCPTool] HTTP error: {...}
   ```

4. **Parse Error**:
   ```
   [useMemoryData] Error in refreshTimeline: ...
   ```

5. **Empty Response**:
   ```
   [useMemoryData] Raw result from callMCPTool: {events: [], stats: {...}}
   ```

## Expected Response Structure

Based on the backend, the response should look like:

```javascript
{
  success: true,
  data: {
    success: true,
    data: {
      events: [
        {
          id: "...",
          type: "code_change",
          timestamp: "2024-11-23T...",
          title: "...",
          metadata: {...}
        },
        // ... more events
      ],
      stats: {
        total: 5,
        by_type: {
          code_change: 3,
          git_commit: 2
        }
      }
    }
  },
  meta: {...}
}
```

The unwrapping logic should:
1. Check `data.success && data.data` (outer wrapper)
2. Check `mcpResponse.success && mcpResponse.data` (MCP wrapper)
3. Return `mcpResponse.data` which contains `{events: [...], stats: {...}}`

## Likely Issues

Based on typical frontend debugging patterns:

### 1. CORS Issue
**Symptoms**: Network request fails, console shows CORS error
**Fix**: Check server CORS configuration in `/mnt/c/Users/bette/Desktop/projects-dashboard/server/index.js`

### 2. Wrong Response Structure
**Symptoms**: Logs show data arriving but wrong structure
**Fix**: Adjust unwrapping logic in `callMCPTool()`

### 3. Empty Response
**Symptoms**: Response status 200, but `events: []`
**Fix**: Backend not returning test data, check MCP server

### 4. Silent Error
**Symptoms**: Error thrown but caught, no re-render
**Fix**: Check error handling in `refreshTimeline()`

### 5. State Update Issue
**Symptoms**: Data logged correctly but UI doesn't update
**Fix**: Check React state updates, ensure arrays are new references

## Next Steps

After gathering console logs:

1. **Copy all console logs** from initial page load
2. **Copy network request/response** from Network tab
3. **Copy any error messages** in red
4. **Note which step in the sequence fails** (API call, parsing, state update, render)

Then we can:
- Fix CORS if that's the issue
- Adjust response parsing if structure is wrong
- Fix backend if it's not returning data
- Fix state management if updates aren't triggering re-renders

## Testing Checklist

- [ ] Page loads without errors
- [ ] Console shows `[useMemoryData] refreshTimeline called`
- [ ] Console shows `[callMCPTool] Response status: 200`
- [ ] Console shows `[callMCPTool] Response data (full): {...}`
- [ ] Console shows events array in response
- [ ] Console shows `[useMemoryData] Setting timeline events: [...]`
- [ ] Console shows `[MemoryManagerPage] Hook data:` with events
- [ ] Network tab shows successful POST request
- [ ] Network tab shows CORS headers present
- [ ] "Test API" button shows success alert
- [ ] No red error messages in console
- [ ] No CORS errors in console

## Files Changed

1. `/mnt/c/Users/bette/Desktop/projects-dashboard/src/hooks/useMemoryData.ts`
2. `/mnt/c/Users/bette/Desktop/projects-dashboard/src/hooks/useMemoryMutations.ts`
3. `/mnt/c/Users/bette/Desktop/projects-dashboard/src/pages/MemoryManagerPage.tsx`
4. `/mnt/c/Users/bette/Desktop/projects-dashboard/MEMORY_UI_DEBUG_SUMMARY.md` (this file)

## Usage

1. Ensure backend is running: `cd /mnt/c/Users/bette/Desktop/projects-dashboard && node server/index.js`
2. Ensure frontend is running: `cd /mnt/c/Users/bette/Desktop/projects-dashboard && pnpm dev`
3. Open http://localhost:5181/memory
4. Open browser DevTools (F12)
5. Check Console tab for logs
6. Click "Test API" button
7. Check Network tab for requests
8. Report findings based on checklist above
