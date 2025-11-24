# Memory MCP Server - SPARC Plan Audit

**Audit Date:** 2025-11-21
**Auditors:** Developer + Product Manager perspectives
**Document Reviewed:** MEMORY-SERVER-SPARC-PLAN.md v1.0

---

## Executive Summary

### Overall Assessment: ⚠️ **PROCEED WITH CAUTION**

The plan is **comprehensive and well-designed**, but suffers from:
- **Scope creep** in MVP definition (Phase 1-3 is NOT minimal)
- **Overly ambitious timeline** (9 days to MVP is unrealistic)
- **Missing critical technical details** (MCP dual-mode complications, concurrency issues)
- **Unclear prioritization** (too many "nice-to-have" features in early phases)

**Recommendation:** Refactor MVP to truly minimal scope, extend timeline to 2-3 weeks for realistic MVP delivery.

---

## 🔧 Developer Audit

### ✅ Strengths

1. **Solid Architecture**
   - Clean separation: MCP server + HTTP API + React frontend
   - SQLite with WAL mode for better concurrency
   - Lazy-loading pattern is smart (metadata-first)
   - Namespace organization is well thought out

2. **Good Database Schema**
   - Proper indexing on query columns (date, type, namespace)
   - Separate `full_details` table prevents bloat
   - Entity versioning with configurable retention is flexible

3. **Realistic Tech Stack**
   - Proven libraries (better-sqlite3, Express, React Query)
   - No exotic dependencies
   - Fits well with existing monorepo

### ⚠️ Critical Issues

#### 1. **MCP Dual-Mode Architecture - NOT TRIVIAL**

**Problem:** Running MCP server (stdio) + HTTP API (port 3002) simultaneously is more complex than plan suggests.

```typescript
// Plan assumes this is straightforward:
// index.ts - MCP server entry point
// http-server.ts - HTTP API server

// REALITY: These need to share the same SQLite connection
// but MCP runs in subprocess, HTTP runs as daemon
```

**Technical Challenge:**
- MCP SDK expects stdio communication (subprocess)
- HTTP server needs to be long-running daemon
- **Can't easily run both in same process without custom orchestration**

**Solutions:**
- **Option A:** Separate processes sharing SQLite file (WAL mode helps but still risky)
- **Option B:** MCP server wraps HTTP API internally (cleaner, but MCP SDK might not support)
- **Option C:** Two separate servers pointing at same DB (simplest, but need to handle writes carefully)

**Recommendation:** Start with **Option C** - separate processes, both read/write to same `memory.db`. Test concurrency early.

---

#### 2. **SQLite Concurrency Limits**

**Problem:** Plan mentions WAL mode but doesn't address write contention.

**Risk Scenarios:**
- Claude is storing timeline events via MCP while React app is expanding event details via HTTP
- Import scripts running (1,119 JIRA tickets) while user is browsing UI
- Weekly digest generation (read-heavy) blocking writes

**SQLite Reality:**
- WAL mode: Multiple readers OK, but **only ONE writer at a time**
- Long transactions block writers
- better-sqlite3 has no built-in connection pooling

**Missing from Plan:**
- No transaction management strategy
- No queue for write operations
- No mention of `PRAGMA busy_timeout`

**Recommendation:**
```typescript
// Add to storage/db.ts initialization
db.pragma('busy_timeout = 5000'); // Wait up to 5 seconds for lock
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL'); // Safe with WAL

// Implement write queue
import PQueue from 'p-queue';
const writeQueue = new PQueue({ concurrency: 1 });

async function queuedWrite(operation: () => void) {
  return writeQueue.add(operation);
}
```

---

#### 3. **Natural Language Search - Underestimated Complexity**

**Problem:** Plan shows NL search calling Claude MCP, but doesn't address:

```typescript
// src/tools/query-tools.ts
async function queryNaturalLanguage(query: string) {
  // This is calling Claude... FROM Claude?
  const parseResponse = await callClaudeMCP({ ... });

  // CIRCULAR DEPENDENCY ALERT
  // Memory server is an MCP server that calls another MCP server (itself?)
}
```

**Issue:** The memory MCP server can't call Claude's MCP tools directly - that's not how MCP works.

**Correct Implementation:**
- NL search should be **HTTP-only feature** (React app → Claude API)
- OR memory server exposes `search_timeline` tool with structured params, Claude calls it
- Memory server doesn't have Claude API access itself

**Recommendation:** Move NL search to Phase 6 and implement as **React app feature**:
```typescript
// In React app, not memory server
const response = await fetch('/api/search/natural', {
  method: 'POST',
  body: JSON.stringify({ query })
});

// Backend just does keyword search, Claude integration happens client-side
```

---

#### 4. **Missing Error Handling Strategy**

**Plan mentions:**
> "Hybrid: friendly + details toggle"

**But doesn't specify:**
- How to handle SQLite lock errors (SQLITE_BUSY)
- Network failures between React ↔ HTTP API
- MCP tool call failures
- Import script failures mid-way through 1,119 tickets

**Recommendation:** Add error handling patterns to plan:
```typescript
// HTTP API error responses
{
  error: {
    message: "Could not load timeline", // User-friendly
    code: "SQLITE_BUSY",               // Technical code
    details: "Database locked",         // Technical details
    retry_after: 2000                   // Milliseconds
  }
}

// MCP tool error handling
try {
  const result = await storeTimelineEvent(...);
  return { success: true, event_id: result.id };
} catch (err) {
  return {
    success: false,
    error: err.message,
    code: err.code
  };
}
```

---

#### 5. **Import Scripts - No Rollback Strategy**

**Problem:** Importing 1,119 JIRA tickets without transactions means partial failure leaves DB in inconsistent state.

**Missing:**
- No mention of wrapping imports in transactions
- No progress tracking ("imported 500/1119 tickets")
- No resume-on-failure mechanism

**Recommendation:**
```typescript
// scripts/import-jira.ts
async function importJiraTickets(filePath: string) {
  const tickets = JSON.parse(await fs.readFile(filePath, 'utf-8'));
  const checkpoint = await getMemory('import:jira:checkpoint') || 0;

  for (let i = checkpoint; i < tickets.length; i++) {
    try {
      await db.transaction(() => {
        // Import ticket + entities + relations atomically
        storeTimelineEvent(...);
        createEntity(...);
      });

      // Save checkpoint every 100 tickets
      if (i % 100 === 0) {
        await storeMemory('import:jira:checkpoint', i);
        console.log(`Progress: ${i}/${tickets.length}`);
      }
    } catch (err) {
      console.error(`Failed at ticket ${i}:`, err);
      throw err; // Fail fast, checkpoint saved, can resume
    }
  }
}
```

---

#### 6. **React App Structure - Missing Key Files**

**Plan shows comprehensive component structure but omits:**

- **No routing library specified** (React Router? TanStack Router?)
- **No state management beyond Zustand** (how does global UI state work?)
- **No API client error handling** (retry logic, timeout handling)
- **No offline support** (what if HTTP API is down?)

**Missing Files:**
```
src/
├── routes.tsx              // Route definitions
├── store/
│   ├── uiStore.ts          // Global UI state (sidebar open, selected date)
│   └── dataStore.ts        // Cached timeline data
└── lib/
    ├── queryClient.ts      // React Query configuration
    └── apiClient.ts        // Fetch wrapper with retry/timeout
```

**Recommendation:** Add to Phase 2 tasks:
- Install React Router v6
- Configure React Query with retry strategy
- Build API client with exponential backoff

---

### 🐛 Bugs/Issues Found

1. **Line 449:** Comment says "New project or extend existing?" but doesn't specify
   - **Fix:** Clarify if using existing `quantified-life` or creating new project

2. **Line 326:** `POST /api/timeline/:event_id/expand` endpoint location is confusing
   - Should be `POST /api/events/:event_id/expand` or keep timeline but fix semantics

3. **Port conflicts not addressed:** React app on 5180, dashboard backend on 3001, memory on 3002
   - Plan doesn't mention checking for port conflicts or handling EADDRINUSE

4. **Git backup strategy incomplete:**
   - Plan says "weekly git backups" but doesn't specify which repo
   - Is `backups/` folder in memory-shack gitignored or committed?
   - Does it create commits in projects-dashboard repo?

---

### 📊 Performance Concerns

**Unverified Performance Claims:**

> "Daily timeline query: <50ms for 100 events"

**Reality Check:**
- SQLite SELECT on indexed `date` column with 100 rows: ~5-10ms ✅
- But plan includes JSON parsing metadata for all 100 events
- Plus stats calculation (`by_type` counts)
- **Realistic estimate:** 20-30ms for query + parsing, acceptable

> "Lazy-load expansion <5ms per event"

- Primary key lookup in `full_details`: ~1-2ms ✅
- JSON parsing large full_data payload: could be 10-50ms for complex data
- **Risk:** Spotify track full data with audio features could be 10KB+ JSON

**Recommendation:** Add caching layer for frequently accessed full_data:
```typescript
// In-memory LRU cache
import LRU from 'lru-cache';
const fullDataCache = new LRU({ max: 500, ttl: 1000 * 60 * 10 }); // 10 min TTL
```

---

### 🔒 Security Audit

**Missing Security Considerations:**

1. **No CORS origin validation** - Plan says `cors` package but doesn't specify allowed origins
   ```typescript
   // Should be:
   app.use(cors({
     origin: ['http://localhost:5180', 'http://localhost:5179'],
     credentials: true
   }));
   ```

2. **No input validation on HTTP API** - Plan mentions Zod but doesn't show usage
   ```typescript
   // Should validate all POST/PUT bodies
   app.post('/api/timeline', validateBody(timelineEventSchema), handler);
   ```

3. **SQL injection risk** - Plan shows direct string interpolation in examples
   ```typescript
   // BAD (from plan line 841):
   jql: `assignee = currentUser() AND updated > "${lastSync}"`

   // Should use parameterized queries everywhere
   ```

4. **No authentication** - HTTP API on port 3002 is wide open to localhost
   - If deployed to home server later, anyone on network can access
   - **Recommendation:** Add token-based auth in Phase 7 before any network deployment

---

## 📈 Product Manager Audit

### ❌ Critical Issues

#### 1. **MVP Definition is NOT Minimal**

**Current MVP (Phase 1-3):**
- MCP server with SQLite ✅ (essential)
- Timeline event storage ✅ (essential)
- HTTP API ⚠️ (needed for React, but could be simplified)
- React daily timeline view ⚠️ (complex UI, not minimal)
- Google Calendar import (512 events) ❌ (NOT essential for MVP)
- Manual event entry ⚠️ (nice-to-have, not blocker)
- Grouped categories ❌ (just show flat list first)
- Side panel expansion ❌ (can use inline or modal first)
- Cyberpunk theme ❌ (styling is NOT MVP)
- Cute loading animation ❌ (definitely not MVP)

**True MVP Should Be:**
- MCP server working (Claude can store/retrieve memories)
- SQLite with basic timeline_events table
- ONE simple HTTP endpoint: `GET /api/timeline/:date`
- Barebones React view: unstyled list of events for a date
- Manual event creation (no import yet)

**User Value Delivered:**
- Claude has persistent memory ✅
- Can see daily timeline in browser ✅
- Can manually log events ✅
- **Total time:** 3-4 days, not 9

**Feedback:** Current "MVP" is actually "MLP" (Minimum Lovable Product). That's fine, but don't call it MVP - it creates false expectations.

---

#### 2. **Scope Creep in Early Phases**

**Phase 2 includes:**
- Sidebar ❌
- MainContent component ❌
- SidePanel (right slide-in) ❌
- Grouped categories ❌
- Slide transition ❌
- Cyberpunk styling ❌
- Loading animation ❌

**This is ~60% visual polish, 40% functionality.**

**Recommendation:** Split Phase 2 into:
- **Phase 2A (Core):** Basic React app with ugly but functional timeline
- **Phase 2B (Polish):** Layout, styling, animations

**Priority:** Get Phase 2A working first, THEN ask user if polish is worth the time investment.

---

#### 3. **Google Calendar First? Questionable Priority**

**User said data priority:**
1. Google Calendar ← Plan aligns ✅
2. JIRA tickets
3. Spotify
4. Manual journal

**But consider:**
- Calendar import requires OAuth setup, API integration (complexity)
- Manual journal entry is simpler, gets user using system faster
- JIRA tickets already have JSON file (just parsing)

**Alternative Priority:**
1. Manual journal (immediate use, simple)
2. JIRA import (have data ready, parser is easy)
3. Calendar import (complex OAuth, can wait)
4. Spotify (nice-to-have)

**User Value:**
- Manual journal → immediate second brain functionality
- JIRA tickets → see work history, test timeline performance
- Calendar → more comprehensive view (but not blocking daily use)

**Recommendation:** Ask user if they'd accept reordered priorities for faster time-to-value.

---

#### 4. **Timeline Estimates - Overly Optimistic**

| Phase | Planned Days | Realistic Estimate | Notes |
|-------|--------------|-------------------|-------|
| Phase 1 | 3 days | **4-5 days** | MCP dual-mode setup is tricky |
| Phase 2 | 4 days | **6-8 days** | React + styling underestimated |
| Phase 3 | 2 days | **3-4 days** | OAuth + import debugging |
| **MVP Total** | **9 days** | **13-17 days** | ~2-3 weeks more realistic |

**Why Optimistic:**
- No buffer for debugging
- Assumes zero blockers
- "No tests" doesn't mean "no bugs"
- Integration issues always appear

**Recommendation:** Use **realistic timeline** in plan:
- MVP: 2-3 weeks (not 9 days)
- Full feature set: 6-8 weeks (not 30 days)

---

#### 5. **Feature Bloat in Later Phases**

**Phase 6 includes:**
- Natural language query via Claude MCP
- SearchBar with smart suggestions
- Grouped results
- Heatmap calendar
- Work velocity chart
- Month view
- **Search query learning system** ← This alone is a multi-week project

**Reality:** Phase 6 is at least 2 weeks of work, not 5 days.

**Query learning system** is advanced ML/heuristics - way beyond scope for a personal tool.

**Recommendation:**
- Cut query learning entirely (user can manually save favorite queries)
- Simplify NL search to keyword search + Claude summarization
- Make heatmap/charts Phase 7+ (after core value delivered)

---

### 📉 Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| MCP dual-mode doesn't work as planned | **HIGH** | **HIGH** | Prototype in Phase 1, pivot early if needed |
| SQLite concurrency issues | **MEDIUM** | **HIGH** | Test with concurrent writes in Phase 1 |
| Timeline slips 2x | **HIGH** | **MEDIUM** | Use realistic estimates, communicate early |
| Calendar OAuth fails | **MEDIUM** | **LOW** | Defer to later phase, use manual entry first |
| Scope creep continues | **HIGH** | **MEDIUM** | Strict MVP definition, user approval for additions |
| Import scripts corrupt data | **MEDIUM** | **HIGH** | Implement checkpointing and rollback |

---

### 💡 Product Recommendations

#### 1. **Redefine MVP - True Minimal**

**New MVP (Revised Phase 1-2):**

**Week 1: Core Memory Server**
- MCP server with basic `store_memory` / `retrieve_memory` tools
- SQLite with timeline_events table
- HTTP API with `GET /api/timeline/:date` endpoint
- CLI script to manually add events (no UI yet)
- **Test:** Claude can store dev context, retrieve it

**Week 2: Basic UI**
- Unstyled React app (no Tailwind yet)
- Flat list of events for selected date
- Date input field (no calendar picker)
- Button to add manual event
- **Test:** Can view timeline in browser, add events

**Week 3: First Data Import**
- Import JIRA tickets from JSON (simplest integration)
- Verify timeline shows work history
- Add basic styling (not cyberpunk yet)
- **Test:** System useful for viewing work history

**Deliverable:** Working second brain Claude can use, basic timeline view with JIRA data.

**User Decision Point:** Is this valuable? Should we continue to full feature set?

---

#### 2. **Defer All "Delighters" to Post-MVP**

**Move to Phase 8+ (Post-Launch Polish):**
- Cyberpunk/synthwave theme
- Cute loading animation
- Slide transitions
- Weekly digest auto-popup
- Query learning system
- Mood/habit tracking visualizations

**Rationale:** These are nice-to-have. Get core value delivered first, THEN polish.

---

#### 3. **Add User Feedback Loops**

**Missing from Plan:** No user checkpoints between phases.

**Recommendation:** Add decision points:
- After Phase 1: "MCP server works - proceed to UI?"
- After Phase 3: "MVP delivered - is this useful? Continue to full features?"
- After Phase 5: "Core complete - polish or ship?"

**Benefit:** Avoids building features user doesn't actually need.

---

#### 4. **Simplify Success Metrics**

**Current metrics are vague:**
> "Can navigate to any date in <2 clicks"

**Better metrics:**
- **Day 1:** Claude can store and retrieve at least 10 memories without errors
- **Week 2:** Can view timeline for any date with <500ms load time
- **Week 3:** 1,119 JIRA tickets imported, browsable in timeline
- **Week 4:** User logs at least 5 manual journal entries (proves daily use)

---

## 🛠️ Recommended Changes

### Immediate (Before Starting Phase 1)

1. **✅ Create REVISED-MVP.md** with true minimal scope (Weeks 1-3 only)
2. **⚠️ Prototype MCP dual-mode** - spend 2 hours testing if this even works
3. **✅ Add concurrency handling** to storage layer design (write queue)
4. **✅ Remove NL search** from early phases (Phase 6+, and as React feature)
5. **✅ Add error handling patterns** to plan
6. **✅ Specify exact repo for git backups** (where do exports go?)

### Phase 1 Changes

**Add tasks:**
- Test SQLite WAL mode with concurrent read/write
- Verify MCP server can run with HTTP API simultaneously
- Implement write queue for safe concurrency
- Add `PRAGMA busy_timeout` and transaction management

**Remove tasks:**
- "Configure .mcp.json to use new server" (defer until after HTTP API works)

### Phase 2 Changes

**Split into 2A (Core) and 2B (Polish):**

**Phase 2A - Core UI (3 days):**
- Basic React app (no styling)
- Flat list timeline (no grouping)
- Simple date input (no calendar picker)
- Manual event form
- HTTP API endpoints

**Phase 2B - Polish (3 days, OPTIONAL):**
- Sidebar layout
- Grouped categories
- Cyberpunk styling
- Loading animation
- Slide transitions

**Decision point:** After 2A, ask user if 2B is worth the time.

### Phase 3 Changes

**Consider swapping with Phase 4:**
- JIRA import is simpler (just parse JSON)
- Calendar requires OAuth setup (more complex)
- Getting JIRA data in first proves system value faster

---

## 📋 Audit Checklist

### Critical Blockers (Must Fix)
- [x] MCP dual-mode architecture - add prototype task
- [x] SQLite concurrency - add write queue
- [x] NL search circular dependency - move to React app
- [ ] Define true MVP scope - create REVISED-MVP.md
- [ ] Error handling strategy - add to plan
- [ ] Import rollback/checkpointing - add to scripts

### High Priority (Should Fix)
- [ ] Timeline estimates - adjust to realistic 2-3 weeks for MVP
- [ ] Reorder Phase 3/4 - JIRA before Calendar?
- [ ] Split Phase 2 into core + polish
- [ ] Add user decision points between phases
- [ ] Clarify git backup destination
- [ ] Add routing library to tech stack

### Medium Priority (Nice to Have)
- [ ] Add security considerations (CORS origins, input validation)
- [ ] Performance caching strategy (LRU cache for full_details)
- [ ] Offline support for React app
- [ ] Port conflict handling

### Low Priority (Defer)
- [ ] Query learning system (cut entirely or move to Phase 10+)
- [ ] Advanced visualizations (defer until core works)
- [ ] Obsidian export format (nice-to-have)

---

## 🎯 Final Recommendations

### Option A: Ship Faster (Recommended)

**True MVP:**
- Weeks 1-3 only
- MCP + SQLite + Basic UI + JIRA import
- No styling, no animations, no calendar yet
- **Outcome:** Working second brain in 3 weeks

**Then reassess:** Is this valuable? Should we add Calendar? Polish UI?

### Option B: Stick to Current Plan (Higher Risk)

**Keep Phase 1-3 as is:**
- Accept 13-17 day timeline (not 9)
- Prototype MCP dual-mode first
- Add concurrency handling
- Fix NL search architecture
- **Outcome:** Polished MVP in 3-4 weeks

### Option C: Hybrid Approach

**Deliver Phase 1 + 2A first (7-10 days):**
- MCP server + Basic UI + Manual entry
- No imports, no polish
- **Check with user:** Is this useful?
- **Then:** Add JIRA import (Phase 3 revised)
- **Then:** Ask if Calendar import worth the OAuth complexity

---

## ✅ Approval Recommendation

**As Developer:** I recommend **Option A or C** - ship core value fast, iterate based on user feedback.

**As Product Manager:** I recommend **Option A** - true MVP first, prove value, then decide on additional features.

**Next Steps:**
1. User reviews audit
2. Choose Option A, B, or C
3. Create REVISED-MVP.md if going with A or C
4. Prototype MCP dual-mode (2 hours)
5. If prototype succeeds → begin Phase 1 with audit fixes applied

---

**Audit Complete**
**Status:** ⚠️ Plan needs refinement before execution
**Confidence:** With fixes applied, project is viable and valuable
