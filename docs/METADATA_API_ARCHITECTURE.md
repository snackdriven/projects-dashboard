# Metadata API Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Project    │  │  Project    │  │  Project    │             │
│  │   Card 1    │  │   Card 2    │  │   Card 3    │  ...        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│                    Poll every 3s                                 │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           │ HTTP GET
                           │ /api/projects/:name/metadata
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                    Express Backend (Node.js)                     │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              GET /api/projects/:name/metadata              │ │
│  └────────────────────────┬───────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                 Cache Check (10s TTL)                      │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  metadataCache.get('projectName:metadata')           │ │ │
│  │  │  - Hit: Return cached data (5-10ms)                  │ │ │
│  │  │  - Miss: Fetch fresh data (50-450ms)                 │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────┬───────────────────────────────────┘ │
│                           │ Cache Miss                           │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │            getProjectMetadata(projectName)                 │ │
│  │                                                            │ │
│  │  ┌──────────────────┐  ┌──────────────────┐              │ │
│  │  │ Basic Metadata   │  │ Process Tracking │              │ │
│  │  ├──────────────────┤  ├──────────────────┤              │ │
│  │  │ - name           │  │ - startTime      │              │ │
│  │  │ - path           │  │ - uptime         │              │ │
│  │  │ - port           │  │ - lastStarted    │              │ │
│  │  │ - url            │  │ - pid (reserved) │              │ │
│  │  └──────────────────┘  └──────────────────┘              │ │
│  │                                                            │ │
│  │  ┌──────────────────┐  ┌──────────────────┐              │ │
│  │  │ Status Check     │  │ Resource Info    │              │ │
│  │  ├──────────────────┤  ├──────────────────┤              │ │
│  │  │ isPortInUse()    │  │ getProcessInfo() │              │ │
│  │  │ - state          │  │ - memory (bytes) │              │ │
│  │  │ - since          │  │ - via ps/tasklist│              │ │
│  │  └──────────────────┘  └──────────────────┘              │ │
│  │                                                            │ │
│  │  ┌────────────────────────────────────────────┐          │ │
│  │  │       getGitStatus(projectPath)            │          │ │
│  │  │       (Cached separately - 30s TTL)        │          │ │
│  │  ├────────────────────────────────────────────┤          │ │
│  │  │  Promise.allSettled([                      │          │ │
│  │  │    git branch --show-current,              │          │ │
│  │  │    git status --porcelain,                 │          │ │
│  │  │    git log -1 --format="%H|%s|%at",       │          │ │
│  │  │    git rev-list --left-right --count       │          │ │
│  │  │  ])                                         │          │ │
│  │  │                                             │          │ │
│  │  │  Returns:                                   │          │ │
│  │  │  - branch                                   │          │ │
│  │  │  - uncommittedChanges                       │          │ │
│  │  │  - ahead/behind                             │          │ │
│  │  │  - lastCommit {hash, message, timestamp}    │          │ │
│  │  └────────────────────────────────────────────┘          │ │
│  │                                                            │ │
│  │  ┌────────────────────────────────────────────┐          │ │
│  │  │  Assemble Response & Cache                 │          │ │
│  │  │  setCachedMetadata(projectName, metadata)  │          │ │
│  │  └────────────────────────────────────────────┘          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Other Endpoints (Backwards Compatible):                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  GET  /api/projects               - List all projects      │ │
│  │  GET  /api/projects/:name/status  - Quick status check     │ │
│  │  POST /api/projects/:name/launch  - Launch + invalidate    │ │
│  │  POST /api/projects/:name/close   - Close + invalidate     │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Initial Request (Cache Miss)

```
Frontend                  Backend                    System
   │                         │                          │
   ├─────GET metadata────────▶                          │
   │                         │                          │
   │                         ├─Check cache─────────────▶│
   │                         │◀─Cache miss──────────────┤
   │                         │                          │
   │                         ├─Check port (lsof)───────▶│
   │                         │◀─Port status─────────────┤
   │                         │                          │
   │                         ├─Git commands (parallel)─▶│
   │                         │  - git branch            │
   │                         │  - git status            │
   │                         │  - git log               │
   │                         │  - git rev-list          │
   │                         │◀─Git info (5s timeout)───┤
   │                         │                          │
   │                         ├─Get process info (ps)───▶│
   │                         │◀─Memory usage────────────┤
   │                         │                          │
   │                         ├─Assemble response        │
   │                         ├─Cache result (10s)       │
   │                         │                          │
   │◀────Full metadata───────┤                          │
   │     (50-450ms)          │                          │
```

### 2. Subsequent Request (Cache Hit)

```
Frontend                  Backend                    System
   │                         │                          │
   ├─────GET metadata────────▶                          │
   │                         │                          │
   │                         ├─Check cache─────────────▶│
   │                         │◀─Cache hit───────────────┤
   │                         │                          │
   │◀────Cached metadata─────┤                          │
   │     (5-10ms)            │                          │
```

### 3. Launch Project (Cache Invalidation)

```
Frontend                  Backend                    System
   │                         │                          │
   ├────POST launch──────────▶                          │
   │                         │                          │
   │                         ├─Invalidate cache         │
   │                         ├─Track start time         │
   │                         │                          │
   │                         ├─Execute launch command──▶│
   │                         │◀─Process started─────────┤
   │                         │                          │
   │◀────Success─────────────┤                          │
   │                         │                          │
   │─────GET metadata────────▶                          │
   │                         │                          │
   │                         ├─Fetch fresh data         │
   │                         │  (cache was invalidated) │
   │                         │                          │
   │◀────Updated metadata────┤                          │
```

## Cache Architecture

### Cache Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Cache System                         │
│                                                          │
│  Key Format: "projectName:cacheType"                    │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Metadata Cache (10s TTL)                          │ │
│  │  ─────────────────────────────                     │ │
│  │  "google-calendar-clone:metadata" → {              │ │
│  │    data: { name, path, port, status, ... },        │ │
│  │    timestamp: 1737623400000                         │ │
│  │  }                                                  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Git Cache (30s TTL)                               │ │
│  │  ───────────────────                               │ │
│  │  "google-calendar-clone:git" → {                   │ │
│  │    data: { branch, uncommittedChanges, ... },      │ │
│  │    timestamp: 1737623400000                         │ │
│  │  }                                                  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Invalidation Triggers:                                 │
│  - POST /api/projects/:name/launch                      │
│  - POST /api/projects/:name/close                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Cache Decision Tree

```
                      ┌──────────────────┐
                      │  Cache Request   │
                      └────────┬─────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Cache entry exists? │
                    └──────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
            ┌───▼────┐                    ┌───▼────┐
            │  Yes   │                    │   No   │
            └───┬────┘                    └───┬────┘
                │                             │
    ┌───────────▼───────────┐                │
    │  Age < TTL?           │                │
    └───────────┬───────────┘                │
                │                             │
        ┌───────┴───────┐                    │
        │               │                    │
    ┌───▼────┐      ┌───▼────┐          ┌───▼────┐
    │  Yes   │      │   No   │          │ Fetch  │
    │ Return │      │ Fetch  │          │ Fresh  │
    │ Cached │      │ Fresh  │          │  Data  │
    └────────┘      └────────┘          └───┬────┘
                         │                   │
                         └───────┬───────────┘
                                 │
                         ┌───────▼───────┐
                         │  Cache Result │
                         └───────┬───────┘
                                 │
                         ┌───────▼───────┐
                         │ Return to UI  │
                         └───────────────┘
```

## Performance Characteristics

### Request Timeline

**Uncached Request (Total: ~450ms)**

```
0ms     ──▶ Request received
5ms     ──▶ Cache check (miss)
10ms    ──▶ Validate project path
15ms    ──▶ Check port status (lsof/netstat)
65ms    ──▶ Start git commands (parallel)
                ├─ git branch (50ms)
                ├─ git status (100ms)
                ├─ git log (80ms)
                └─ git rev-list (120ms)
185ms   ──▶ All git commands complete
200ms   ──▶ Get process info (memory)
250ms   ──▶ Assemble response
260ms   ──▶ Cache result
265ms   ──▶ Return to client
```

**Cached Request (Total: ~8ms)**

```
0ms     ──▶ Request received
3ms     ──▶ Cache check (hit)
5ms     ──▶ Return cached data
8ms     ──▶ Response sent to client
```

### Cache Hit Rates

With 3-second polling:

```
Time    Request   Cache    Notes
0s      #1        miss     Initial request
3s      #2        hit      Within 10s TTL
6s      #3        hit      Within 10s TTL
9s      #4        hit      Within 10s TTL
12s     #5        miss     Exceeded 10s TTL
15s     #6        hit      New cache entry
...

Hit Rate: ~75% (3 hits per 4 requests)
Average Response Time: ~125ms (uncached) → ~30ms (mixed) → ~8ms (best case)
```

## Scalability Considerations

### Current Limits

```
┌─────────────────────────────────────────────────────┐
│  Metric              │  Current   │  Recommended    │
├─────────────────────────────────────────────────────┤
│  Concurrent projects │  ~10       │  Up to 50      │
│  Poll interval       │  3s        │  2-5s          │
│  Cache size          │  Unlimited │  Add limits    │
│  Git timeout         │  5s        │  3-5s          │
│  Memory per project  │  ~2MB      │  Monitor       │
└─────────────────────────────────────────────────────┘
```

### Scaling Strategies

**Horizontal Scaling:**
```
Multiple Backend Instances
         ↓
   Load Balancer
         ↓
    ┌────┼────┐
    │    │    │
  Node1 Node2 Node3
    │    │    │
    └────┼────┘
         ↓
  Shared Cache (Redis)
```

**Vertical Optimization:**
- Increase git cache TTL for stable repos
- Batch git operations for multiple projects
- Use WebSocket for real-time updates (avoid polling)

## Error Handling

### Error Flow

```
                    ┌──────────────────┐
                    │   API Request    │
                    └────────┬─────────┘
                             │
                  ┌──────────▼──────────┐
                  │  Validate Input     │
                  └──────────┬──────────┘
                             │
                    Invalid  │  Valid
                  ┌──────────┼──────────┐
                  │                     │
            ┌─────▼─────┐         ┌────▼────┐
            │ 400 Error │         │ Process │
            └───────────┘         └────┬────┘
                                       │
                            ┌──────────▼──────────┐
                            │  Check Project Path │
                            └──────────┬──────────┘
                                       │
                            Not Found  │  Found
                            ┌──────────┼──────────┐
                            │                     │
                      ┌─────▼─────┐         ┌────▼────┐
                      │ 404 Error │         │ Get Data│
                      └───────────┘         └────┬────┘
                                                 │
                                    ┌────────────▼────────────┐
                                    │  Git Commands Timeout?  │
                                    └────────────┬────────────┘
                                                 │
                                        Yes      │      No
                                    ┌────────────┼────────────┐
                                    │                         │
                           ┌────────▼────────┐      ┌────────▼────────┐
                           │ Partial Data    │      │  Complete Data  │
                           │ (no git field)  │      │  (all fields)   │
                           └────────┬────────┘      └────────┬────────┘
                                    │                         │
                                    └────────┬────────────────┘
                                             │
                                     ┌───────▼───────┐
                                     │  200 Success  │
                                     └───────────────┘
```

## Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: Input Validation                          │
│  ─────────────────────────                          │
│  - Sanitize project name (alphanumeric, -, _ only) │
│  - Reject path traversal attempts (../, ..\)       │
│  - Length limits (max 100 chars)                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Layer 2: Path Validation                           │
│  ────────────────────────                           │
│  - Normalize and resolve paths                      │
│  - Ensure within PROJECTS_DIR                       │
│  - Reject if outside allowed directory              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Layer 3: Command Execution                         │
│  ──────────────────────                             │
│  - Parameterized execution (no string interpolation)│
│  - Timeout all commands (5s max)                    │
│  - Run with minimal privileges                      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Layer 4: CORS & Access Control                     │
│  ──────────────────────────                         │
│  - Restrict to localhost only                       │
│  - No external access allowed                       │
│  - Rate limiting (optional)                         │
└─────────────────────────────────────────────────────┘
```

## Technology Stack

```
┌─────────────────────────────────────────────────────┐
│  Frontend                                           │
│  ─────────                                          │
│  - React 19                                         │
│  - TypeScript (optional)                            │
│  - Fetch API                                        │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Backend                                            │
│  ───────                                            │
│  - Node.js 22.20.0                                  │
│  - Express 4.x                                      │
│  - child_process (execAsync)                        │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  System Tools                                       │
│  ────────────                                       │
│  - Git (branch, status, log, rev-list)             │
│  - lsof / netstat (port checking)                  │
│  - ps / tasklist (memory usage)                     │
└─────────────────────────────────────────────────────┘
```

## Deployment Considerations

### Environment Requirements

```yaml
# Minimum requirements
Node.js: 18.0.0+
Git: 2.0.0+
OS: Linux (WSL), macOS, or Windows

# Recommended
Node.js: 22.20.0+
Git: 2.30.0+
OS: Linux (WSL2) for best performance
```

### Configuration

```javascript
// server/index.js - Configuration constants

const PORT = 3001;                      // API port
const PROJECTS_DIR = './projects';      // Projects directory
const METADATA_CACHE_TTL = 10000;       // 10 seconds
const GIT_CACHE_TTL = 30000;            // 30 seconds
const GIT_TIMEOUT = 5000;               // 5 seconds

// Project port assignments
const PROJECT_PORTS = {
  'google-calendar-clone': 5173,
  'jira-wrapper': 5174,
  // ... more projects
};
```

## Monitoring & Debugging

### Logging Points

```javascript
// Key logging points in the system

console.log('Cache hit for', projectName);
console.log('Cache miss for', projectName);
console.log('Git status failed for', projectName);
console.log('Process info unavailable for', projectName);
console.log('Invalidating cache for', projectName);
```

### Debug Endpoints (Future)

```
GET /api/debug/cache              - View cache contents
GET /api/debug/cache/:projectName - View project cache
DELETE /api/debug/cache           - Clear all cache
GET /api/debug/performance        - Performance metrics
```

### Health Check (Future)

```
GET /api/health
Response:
{
  "status": "healthy",
  "uptime": 3600,
  "cache": {
    "size": 10,
    "hitRate": 0.75
  },
  "projects": {
    "total": 8,
    "running": 2
  }
}
```

---

This architecture is designed for:
- **Performance**: Multi-layer caching, parallel operations
- **Reliability**: Graceful degradation, error handling
- **Security**: Input validation, path validation
- **Scalability**: Horizontal and vertical scaling paths
- **Maintainability**: Clear separation of concerns, comprehensive logging
