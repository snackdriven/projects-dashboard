# Memory MCP Server - SPARC Implementation Plan

**Project:** Second Brain Life Logging System
**Date:** 2025-11-21
**Status:** Ready for Implementation

---

## Executive Summary

Building a **dual-mode memory MCP server** that serves as both:
1. **Claude's development context** via MCP protocol (stdio)
2. **Life-logging data store** for React dashboard via HTTP API (port 3002)

**Core Value Proposition:** Personal time machine and external memory augmentation system with temporal-first architecture, enabling natural language queries across all life data (work, music, calendar, journal, entities).

**Visual Identity:** Cyberpunk/Synthwave fusion aesthetic (Blade Runner meets Outrun) with dark backgrounds, pink/cyan neon accents, and purple gradients.

**Primary Use Case:** Real-time throughout-the-day logging and context retrieval, with pattern discovery and correlation analysis for personal insights.

---

## 🔍 Audit Update (2025-11-21)

**Status:** ✅ **Architecture Validated - Ready for Implementation**

### Critical Validations Completed

#### 1. ✅ MCP Dual-Mode Architecture - VERIFIED WORKING
**Prototype Results:** `/tmp/mcp-dual-mode-test/`
- MCP server (stdio) + HTTP API (port 3002) can safely share same SQLite database
- **6/6 tests passed:** 50,000 concurrent operations with 0 errors
- WAL mode + busy_timeout configuration proven production-ready
- **No write queue needed** - SQLite WAL handles concurrency perfectly

**Key Configuration:**
```javascript
db.pragma('journal_mode = WAL');      // Enable concurrent read/write
db.pragma('busy_timeout = 5000');     // Prevent SQLITE_BUSY errors
db.pragma('synchronous = NORMAL');    // Safe with WAL + performance
```

#### 2. ✅ SQLite Concurrency Handling - NO QUEUE NEEDED
- Original concern: Multiple processes writing simultaneously
- **Resolution:** WAL mode handles all coordination automatically
- Performance: 1,904 mixed ops/sec with 100% data consistency
- No connection pooling required (better-sqlite3 is synchronous)

#### 3. ✅ Natural Language Search - Architecture Fixed
- **Moved from memory server to React app** (avoids circular dependency)
- Memory server provides simple `search_timeline` MCP tool
- React app orchestrates NL query parsing + display
- Can integrate Claude API client-side for enhanced parsing

#### 4. ✅ Realistic Timeline Estimates
- **Original MVP:** 9 days → **Revised:** 13-17 days (2-3 weeks)
- **With parallelization:** 4 days to working MVP
- Full feature set: 30 days → **Revised:** 6-8 weeks (2.5 weeks with parallelization)

### Parallelization Strategy

**42% time savings identified** through agent parallelization.

See: `MEMORY-SERVER-PARALLEL-EXECUTION.md` for detailed execution plan.

**MVP Timeline with Parallel Agents:**
- **Day 1:** Phase 1 (backend-architect + typescript-pro in parallel)
- **Day 2-3:** Phase 2 (backend + frontend + ui-ux in parallel)
- **Day 4:** Phase 3 (calendar import)
- **Result:** Working MVP in 4 days

### Additional Audit Findings

**Security:**
- Add CORS origin validation (localhost:5180, localhost:5179)
- Input validation with Zod on all HTTP endpoints
- No auth needed for localhost (add before network deployment)

**Error Handling:**
- Implement friendly + details toggle pattern
- Handle SQLITE_BUSY with retry logic
- Import scripts need checkpoint/rollback support

**Git Backup:**
- Weekly exports committed to `packages/memory-shack/backups/`
- Auto-commit Sundays via cron job
- JSON format for easy review in git diffs

**Full Audit:** See `MEMORY-SERVER-AUDIT.md`

---

## S - Specification

### Functional Requirements

#### MVP Features (Phase 1-2)
- ✅ MCP server with SQLite storage
- ✅ Basic timeline event storage/retrieval
- ✅ Key-value memory operations
- ✅ HTTP API on port 3002
- ✅ React daily timeline view (grouped by category)
- ✅ Google Calendar data import (512 events, 2021-2026)
- ✅ Manual event entry via web form

#### Post-MVP Features (Phase 3-5)
- JIRA ticket import (1,119 tickets from all-kayla-tickets.json)
- Spotify listening history import (JSON + Last.fm)
- Entity tracking (People, JIRA Projects)
- Relationship mapping
- Natural language search via Claude
- Insights/analytics dashboard
- Weekly digest generation
- Mood tracking with visualizations
- Habit tracking sidebar widget
- Export tools (JSON, Markdown)

### Non-Functional Requirements

#### Performance
- Daily timeline query: <50ms for 100 events
- Lazy-loading: metadata-first, expand on demand
- Grouped summaries to reduce cognitive load
- Smooth slide transitions between dates

#### Privacy & Data
- 100% local SQLite storage (WSL localhost)
- Optional cloud sync (not MVP)
- All data exportable (JSON, Markdown/Obsidian)
- Version history for entities (configurable retention)
- Weekly git backups (auto-commit Sunday)

#### User Experience
- Desktop-only (no mobile optimization)
- Cyberpunk/synthwave aesthetic
- Minimal by default, expand on demand
- Real-time usage pattern (not just retrospective)
- Cute custom loading animation

### Data Model

#### Core Tables

**timeline_events** (Primary table for temporal data)
```sql
CREATE TABLE timeline_events (
  id TEXT PRIMARY KEY,              -- UUID
  timestamp INTEGER NOT NULL,       -- Unix timestamp
  date TEXT NOT NULL,               -- YYYY-MM-DD (indexed)
  type TEXT NOT NULL,               -- jira_ticket, spotify_play, calendar_event, journal_entry
  namespace TEXT,                   -- daily:YYYY-MM-DD, dev:*, config:*
  title TEXT,                       -- Human-readable summary
  metadata TEXT,                    -- JSON: lightweight data (always loaded)
  full_data_key TEXT,               -- Key to full_details table (lazy-loaded)
  created_at INTEGER,
  updated_at INTEGER
);

CREATE INDEX idx_timeline_date ON timeline_events(date);
CREATE INDEX idx_timeline_timestamp ON timeline_events(timestamp);
CREATE INDEX idx_timeline_type ON timeline_events(type);
CREATE INDEX idx_timeline_namespace ON timeline_events(namespace);
```

**full_details** (Lazy-loaded expanded data)
```sql
CREATE TABLE full_details (
  key TEXT PRIMARY KEY,             -- Matches full_data_key
  data TEXT,                        -- Full JSON payload
  created_at INTEGER,
  accessed_at INTEGER               -- LRU cache tracking
);
```

**memories** (Key-value for Claude dev context)
```sql
CREATE TABLE memories (
  key TEXT PRIMARY KEY,
  value TEXT,                       -- JSON-serialized
  namespace TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  expires_at INTEGER                -- TTL support
);

CREATE INDEX idx_memories_namespace ON memories(namespace);
CREATE INDEX idx_memories_expires ON memories(expires_at);
```

**entities** (People, Projects, Artists)
```sql
CREATE TABLE entities (
  id TEXT PRIMARY KEY,
  type TEXT,                        -- person, project, artist, ticket
  name TEXT UNIQUE,
  properties TEXT,                  -- JSON blob
  created_at INTEGER,
  updated_at INTEGER
);

CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_name ON entities(name);
```

**entity_versions** (Version history - configurable retention)
```sql
CREATE TABLE entity_versions (
  id TEXT PRIMARY KEY,
  entity_id TEXT,
  version INTEGER,
  properties TEXT,                  -- Snapshot of properties at this version
  changed_by TEXT,                  -- Who/what made the change
  changed_at INTEGER,
  change_reason TEXT,
  FOREIGN KEY (entity_id) REFERENCES entities(id)
);

CREATE INDEX idx_versions_entity ON entity_versions(entity_id);
CREATE INDEX idx_versions_timestamp ON entity_versions(changed_at);
```

**relations** (Entity relationships)
```sql
CREATE TABLE relations (
  id TEXT PRIMARY KEY,
  from_entity_id TEXT,
  relation_type TEXT,               -- assigned_to, worked_on, listened_to
  to_entity_id TEXT,
  properties TEXT,                  -- JSON: timestamps, context
  created_at INTEGER,
  FOREIGN KEY (from_entity_id) REFERENCES entities(id),
  FOREIGN KEY (to_entity_id) REFERENCES entities(id)
);

CREATE INDEX idx_rel_from ON relations(from_entity_id);
CREATE INDEX idx_rel_to ON relations(to_entity_id);
CREATE INDEX idx_rel_type ON relations(relation_type);
```

### Namespace Organization

```
daily:YYYY-MM-DD:*          # Daily timeline data
  daily:2025-11-19:calendar  # Calendar events
  daily:2025-11-19:jira      # JIRA tickets
  daily:2025-11-19:spotify   # Music plays
  daily:2025-11-19:journal   # Manual entries

dev:*                       # Claude's development context
  dev:project:*              # Project state
  dev:entity:*               # Entity tracking
  dev:decision:*             # Architecture decisions

config:*                    # System configuration
  config:ui:*                # UI preferences
  config:entity-versions:*   # Version retention policies
  config:heatmap:metric      # Current heatmap display metric
```

---

## P - Pseudocode / Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Claude Code                         │
│              (MCP Protocol - stdio)                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Memory MCP Server   │
         │  (packages/memory-    │
         │   mcp-server/)        │
         │                       │
         │  ┌─────────────────┐  │
         │  │  MCP Tools      │  │
         │  │  - Timeline     │  │
         │  │  - Memories     │  │
         │  │  - Entities     │  │
         │  │  - Relations    │  │
         │  └─────────────────┘  │
         │                       │
         │  ┌─────────────────┐  │
         │  │  HTTP API       │  │
         │  │  Port 3002      │  │
         │  └─────────────────┘  │
         │                       │
         │  ┌─────────────────┐  │
         │  │  SQLite DB      │  │
         │  │  memory.db      │  │
         │  └─────────────────┘  │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   React Dashboard     │
         │   (localhost:5180)    │
         │                       │
         │  ┌─────────────────┐  │
         │  │  Daily View     │  │
         │  │  - Sidebar      │  │
         │  │  - Timeline     │  │
         │  │  - Side Panel   │  │
         │  └─────────────────┘  │
         │                       │
         │  ┌─────────────────┐  │
         │  │  Entity Pages   │  │
         │  │  Insights Tab   │  │
         │  │  Search         │  │
         │  └─────────────────┘  │
         └───────────────────────┘

External Data Sources:
  - Google Calendar API (reuse from google-calendar-clone)
  - Atlassian MCP Server (JIRA sync)
  - Spotify JSON exports + Last.fm API
```

### MCP Tools Interface

```typescript
// Timeline operations
store_timeline_event({
  timestamp: number | string,
  type: string,
  title: string,
  metadata: object,
  namespace?: string
}) -> { event_id: string }

get_timeline({
  date: string,              // YYYY-MM-DD
  type?: string,             // Filter by event type
  limit?: number
}) -> {
  events: Event[],           // Lightweight metadata only
  stats: {
    total: number,
    by_type: Record<string, number>
  }
}

expand_event({
  event_id: string,
  full_data: object
}) -> Event                  // Returns event with full_data populated

// Memory operations
store_memory({
  key: string,
  value: any,
  namespace?: string,
  ttl?: number
}) -> { success: boolean }

retrieve_memory({
  key: string
}) -> { key: string, value: any, metadata: object }

// Entity operations
create_entity({
  type: string,
  name: string,
  properties: object,
  version_retention?: 'forever' | 'last_N' | 'days_N'
}) -> { entity_id: string }

update_entity({
  name: string,
  properties: object,
  change_reason?: string
}) -> { entity_id: string, version: number }

// Natural language query (uses Claude)
query_natural_language({
  query: string              // "When did Patrick and I get engaged?"
}) -> {
  results: Event[],
  summary: string,           // Claude-generated explanation
  confidence: number
}
```

### HTTP API Endpoints

```
GET  /api/timeline/:date
  → { events: Event[], stats: object }

GET  /api/timeline/:date/:event_id/full
  → Event (with full_data expanded)

POST /api/timeline/:event_id/expand
  Body: { full_data: object }
  → Event (updated with full_data_key)

GET  /api/timeline/range?start=YYYY-MM-DD&end=YYYY-MM-DD
  → { events: Event[], stats: object }

GET  /api/entities/:type
  → { entities: Entity[] }

GET  /api/entities/:type/:name
  → { entity: Entity, versions: EntityVersion[] }

GET  /api/entities/:type/:name/timeline
  → { events: Event[] }

POST /api/entities/:type/:name
  Body: { properties: object, change_reason: string }
  → { entity_id: string, version: number }

GET  /api/search?q=WRKA-3808
  → {
      results: {
        jira_tickets: Event[],
        calendar_events: Event[],
        journal_entries: Event[]
      },
      total: number
    }

POST /api/search/natural
  Body: { query: "Show me stressful work weeks in Q3" }
  → { results: Event[], summary: string, confidence: number }

GET  /api/insights/weekly?week=2025-W47
  → { insights: Insight[], correlations: Correlation[] }

GET  /api/heatmap?metric=mood&start=2025-11&end=2025-11
  → { days: Array<{ date: string, value: number, color: string }> }

POST /api/export
  Body: { format: 'json' | 'markdown', date_range: object }
  → { download_url: string, file_size: number }
```

---

## A - Architecture

### File Structure

```
packages/memory-shack/
├── package.json
├── tsconfig.json
├── .gitignore
├── src/
│   ├── index.ts                    # MCP server entry point
│   ├── http-server.ts              # HTTP API server (Express)
│   │
│   ├── storage/
│   │   ├── db.ts                   # SQLite connection & init
│   │   ├── timeline.ts             # Timeline CRUD
│   │   ├── memory.ts               # Key-value CRUD
│   │   ├── entity.ts               # Entity CRUD + versioning
│   │   └── relation.ts             # Relation CRUD
│   │
│   ├── tools/                      # MCP tools
│   │   ├── timeline-tools.ts
│   │   ├── memory-tools.ts
│   │   ├── entity-tools.ts
│   │   ├── relation-tools.ts
│   │   └── query-tools.ts          # Natural language search
│   │
│   ├── api/                        # HTTP API handlers
│   │   ├── routes.ts               # Route definitions
│   │   ├── timeline.ts
│   │   ├── entity.ts
│   │   ├── search.ts
│   │   ├── insights.ts
│   │   └── export.ts
│   │
│   ├── integrations/               # Data source connectors
│   │   ├── google-calendar.ts      # Reuse from calendar-clone
│   │   ├── atlassian-jira.ts       # MCP-based sync
│   │   ├── spotify.ts              # JSON import + Last.fm
│   │   └── github.ts               # (Future)
│   │
│   ├── analytics/                  # Pattern detection
│   │   ├── correlations.ts         # Cross-domain correlation finder
│   │   ├── insights.ts             # Insight generation
│   │   └── weekly-digest.ts        # Weekly summary generator
│   │
│   ├── types.ts                    # Shared TypeScript types
│   │
│   └── utils/
│       ├── validation.ts           # Zod schemas
│       ├── export.ts               # JSON/Markdown exporters
│       ├── git-backup.ts           # Git auto-commit logic
│       └── versioning.ts           # Entity version management
│
├── data/
│   └── memory.db                   # SQLite database (gitignored)
│
├── backups/                        # Git-committed exports
│   ├── 2025-W47.json               # Weekly exports
│   └── .gitkeep
│
├── scripts/
│   ├── migrate.ts                  # Schema migrations
│   ├── import-calendar.ts          # One-time calendar import
│   ├── import-jira.ts              # JIRA ticket import
│   ├── import-spotify.ts           # Spotify history import
│   ├── export-json.ts              # Manual export script
│   ├── export-markdown.ts          # Obsidian export
│   └── backup-weekly.ts            # Git backup (cron Sunday)
│
└── README.md
```

### React Dashboard Structure

```
projects/quantified-life/           # New project or extend existing?
├── src/
│   ├── App.tsx
│   │
│   ├── pages/
│   │   ├── DailyView.tsx           # Main timeline view
│   │   ├── EntityPage.tsx          # Generic entity detail page
│   │   ├── InsightsTab.tsx         # Analytics/correlations
│   │   ├── SearchResults.tsx       # Search interface
│   │   └── WeeklyDigest.tsx        # Weekly review page
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx         # Left sidebar (calendar, nav, stats)
│   │   │   ├── SidePanel.tsx       # Right slide-in panel
│   │   │   └── MainContent.tsx     # Center timeline area
│   │   │
│   │   ├── timeline/
│   │   │   ├── EventGroup.tsx      # Grouped category (Work, Music, etc.)
│   │   │   ├── EventCard.tsx       # Individual event card
│   │   │   ├── EventExpanded.tsx   # Expanded details in side panel
│   │   │   └── EmptyState.tsx      # No events placeholder
│   │   │
│   │   ├── navigation/
│   │   │   ├── CalendarPicker.tsx  # Date selection
│   │   │   ├── DateNavigation.tsx  # < Nov 19 > arrows + Today
│   │   │   ├── FilterChips.tsx     # Toggle chips for filtering
│   │   │   └── DateRangePresets.tsx # Quick presets
│   │   │
│   │   ├── journal/
│   │   │   ├── MoodPicker.tsx      # Emoji grid picker
│   │   │   ├── GratitudeList.tsx   # Bullet points + chips + prompts
│   │   │   ├── HabitTracker.tsx    # Sidebar widget checkboxes
│   │   │   └── JournalForm.tsx     # Full manual entry form
│   │   │
│   │   ├── visualizations/
│   │   │   ├── HeatmapCalendar.tsx # GitHub-style activity heatmap
│   │   │   ├── MoodGraph.tsx       # Line graph + emoji timeline
│   │   │   ├── MusicCharts.tsx     # Artist pills, genre distribution
│   │   │   └── WorkVelocity.tsx    # Ticket completion over time
│   │   │
│   │   ├── entity/
│   │   │   ├── EntityHeader.tsx    # Stats card
│   │   │   ├── EntityTimeline.tsx  # Filtered timeline for entity
│   │   │   ├── EntityRelations.tsx # Relationship graph
│   │   │   └── InlineEdit.tsx      # Click-to-edit fields
│   │   │
│   │   ├── insights/
│   │   │   ├── InsightCard.tsx     # Individual insight/correlation
│   │   │   ├── InsightFeed.tsx     # Feed of cards
│   │   │   └── CorrelationChart.tsx # Visual correlation display
│   │   │
│   │   ├── search/
│   │   │   ├── SearchBar.tsx       # Natural language input
│   │   │   ├── SearchFilters.tsx   # Date/type/entity filters
│   │   │   └── GroupedResults.tsx  # Results by type
│   │   │
│   │   └── ui/
│   │       ├── LoadingAnimation.tsx # Cute custom loader
│   │       ├── Toast.tsx           # Subtle notifications
│   │       ├── ErrorDisplay.tsx    # Friendly + details toggle
│   │       └── SlideTransition.tsx # Date navigation animation
│   │
│   ├── hooks/
│   │   ├── useTimeline.ts          # React Query for timeline data
│   │   ├── useEntity.ts            # Entity CRUD operations
│   │   ├── useSearch.ts            # Search with debouncing
│   │   ├── useInsights.ts          # Weekly insights fetcher
│   │   └── useHeatmap.ts           # Heatmap data with metric selector
│   │
│   ├── lib/
│   │   ├── api.ts                  # HTTP client (fetch wrappers)
│   │   ├── types.ts                # Shared types with backend
│   │   └── theme.ts                # Cyberpunk/synthwave theme config
│   │
│   └── styles/
│       ├── globals.css             # Tailwind base + custom properties
│       └── cyberpunk-theme.css     # Neon colors, gradients, animations
│
├── public/
│   └── animations/                 # Loading animation assets
│
└── vite.config.ts                  # Port 5179 (quantified-life)
```

### Tech Stack

**Backend (Memory MCP Server):**
- TypeScript 5.3+
- Node.js 20+
- @modelcontextprotocol/sdk ^1.0.0
- better-sqlite3 ^11.0.0 (SQLite with WAL mode)
  - **Critical:** Enable WAL mode for concurrent access (see audit results)
  - **Configuration:** `busy_timeout=5000`, `synchronous=NORMAL`
  - **Performance:** Validated 50,000+ concurrent ops with 0 errors
- Express ^4.18.2 (HTTP API)
- cors ^2.8.5 (React app access)
- zod ^3.22.0 (Schema validation)

**Frontend (React Dashboard):**
- React 19
- TypeScript 5.3+
- Vite (Rolldown)
- Tailwind CSS 4
- @tanstack/react-query ^5.0.0 (Data fetching)
- Framer Motion ^11.0.0 (Animations, slide transitions)
- Zustand ^4.5.0 (State management)
- date-fns ^3.0.0 (Date utilities)
- recharts ^2.10.0 (Charts for analytics)

**Development Tools:**
- tsx (TypeScript execution)
- pnpm (Package management)
- Turborepo (Monorepo orchestration)
- ESLint + Prettier (Code quality)

---

## R - Refinements

### UI/UX Design System

#### Color Palette (Cyberpunk/Synthwave Fusion)

```css
/* Dark Base */
--bg-primary: #0a0e27;        /* Deep space blue-black */
--bg-secondary: #1a1f3a;      /* Slightly lighter panels */
--bg-tertiary: #252b4a;       /* Elevated cards */

/* Neon Accents (Cyberpunk) */
--neon-pink: #ff006e;         /* Hot pink (primary accent) */
--neon-cyan: #00f5ff;         /* Electric cyan (secondary) */
--neon-purple: #b000ff;       /* Deep purple (tertiary) */
--neon-blue: #0066ff;         /* Bright blue */

/* Synthwave Gradients */
--gradient-sunset: linear-gradient(135deg, #ff006e 0%, #b000ff 50%, #0066ff 100%);
--gradient-night: linear-gradient(180deg, #0a0e27 0%, #1a1f3a 100%);
--gradient-glow: radial-gradient(circle, rgba(255,0,110,0.2) 0%, transparent 70%);

/* Functional Colors */
--text-primary: #ffffff;
--text-secondary: #b4b8d4;
--text-muted: #6b7096;
--success: #00ff9f;           /* Neon green */
--warning: #ffaa00;           /* Amber */
--error: #ff006e;             /* Pink (matches accent) */

/* Hover/Active States */
--hover-bg: rgba(255, 0, 110, 0.1);
--active-bg: rgba(255, 0, 110, 0.2);
--glow-shadow: 0 0 20px rgba(255, 0, 110, 0.5);
```

#### Component Styling Patterns

**Event Cards:**
```tsx
// Base card: Dark with subtle border
className="bg-bg-tertiary border border-neon-pink/20 rounded-lg p-4
           transition-all duration-200
           hover:bg-bg-tertiary/80 hover:brightness-110"

// Expanded/active card: Neon glow
className="border-neon-pink shadow-glow-shadow"
```

**Toggle Chips (Filters):**
```tsx
// Inactive chip
className="px-4 py-2 rounded-full border border-neon-cyan/30
           text-text-secondary bg-bg-secondary
           hover:bg-hover-bg hover:border-neon-cyan/50
           transition-all duration-200"

// Active chip
className="px-4 py-2 rounded-full border-2 border-neon-cyan
           text-white bg-neon-cyan/10
           shadow-[0_0_15px_rgba(0,245,255,0.4)]"
```

**Side Panel (Expansion):**
```tsx
// Slide-in from right, 400px wide
<motion.div
  initial={{ x: '100%' }}
  animate={{ x: 0 }}
  exit={{ x: '100%' }}
  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
  className="fixed right-0 top-0 h-full w-[400px]
             bg-bg-secondary border-l border-neon-purple/30
             shadow-[-10px_0_30px_rgba(176,0,255,0.2)]
             overflow-y-auto z-50"
>
  {/* Expanded content */}
</motion.div>
```

**Date Slide Transition:**
```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={currentDate}
    initial={{ opacity: 0, x: direction === 'next' ? 100 : -100 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: direction === 'next' ? -100 : 100 }}
    transition={{ duration: 0.3 }}
  >
    <DailyTimeline date={currentDate} />
  </motion.div>
</AnimatePresence>
```

#### Typography

```css
/* Headings - Sans-serif, bold, uppercase tracking */
h1 {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 2rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: var(--gradient-sunset);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Body - Clean, readable */
body {
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-primary);
}

/* Code/Technical - Monospace */
code, .technical {
  font-family: 'Fira Code', 'Monaco', monospace;
  font-size: 0.9em;
}

/* Timestamps */
.timestamp {
  font-family: 'Fira Code', monospace;
  font-size: 0.85rem;
  color: var(--neon-cyan);
  font-variant-numeric: tabular-nums;
}
```

#### Loading Animation Concept

**"Neon Pulse Orb"** - Custom cute loader matching cyberpunk aesthetic:

```tsx
// Animated SVG: pulsing orb with rotating neon ring
<div className="flex items-center justify-center h-64">
  <div className="relative w-24 h-24">
    {/* Core orb */}
    <motion.div
      className="absolute inset-0 rounded-full bg-gradient-sunset opacity-80 blur-md"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    />

    {/* Rotating ring */}
    <motion.div
      className="absolute inset-0 border-4 border-neon-cyan/50 rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      style={{ borderTopColor: 'var(--neon-pink)' }}
    />

    {/* Center dot */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-4 h-4 rounded-full bg-white shadow-glow-shadow" />
    </div>
  </div>

  <p className="absolute mt-32 text-neon-cyan font-mono text-sm animate-pulse">
    Loading timeline...
  </p>
</div>
```

### Data Import Strategies

#### Google Calendar Import

**Reuse from google-calendar-clone:**
```typescript
// src/integrations/google-calendar.ts

import { calendar_v3 } from 'googleapis';
import { getCalendarClient } from '../../../projects/google-calendar-clone/src/lib/google-api';

async function importCalendarEvents(
  dateRange: { start: string; end: string }
) {
  const client = await getCalendarClient();
  const events = await client.events.list({
    calendarId: 'primary',
    timeMin: new Date(dateRange.start).toISOString(),
    timeMax: new Date(dateRange.end).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  for (const event of events.data.items || []) {
    await storeTimelineEvent({
      timestamp: new Date(event.start.dateTime || event.start.date).getTime(),
      type: 'calendar_event',
      title: event.summary,
      namespace: `daily:${formatDate(event.start)}`,
      metadata: {
        event_id: event.id,
        attendees: event.attendees?.map(a => a.email),
        location: event.location,
        description: event.description?.substring(0, 200), // Lightweight preview
      },
      full_data_key: `calendar:${event.id}:full`,
    });

    // Store full details separately
    await storeFullDetails(`calendar:${event.id}:full`, {
      html_link: event.htmlLink,
      full_description: event.description,
      attachments: event.attachments,
      conferenceData: event.conferenceData,
      recurrence: event.recurrence,
    });
  }
}

// One-time import: 2021-2026 (512 events)
// scripts/import-calendar.ts
importCalendarEvents({
  start: '2021-01-01',
  end: '2026-12-31'
});
```

#### JIRA Ticket Import

**Use Atlassian MCP + all-kayla-tickets.json:**
```typescript
// src/integrations/atlassian-jira.ts

import fs from 'fs/promises';
import { AtlassianMCP } from './mcp-client'; // Wrapper for MCP calls

// One-time import from JSON
async function importJiraTicketsFromJSON(filePath: string) {
  const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));

  for (const ticket of data.tickets) {
    await storeTimelineEvent({
      timestamp: new Date(ticket.updated).getTime(), // Or created/resolved
      type: 'jira_ticket',
      title: `${ticket.key}: ${ticket.summary}`,
      namespace: `daily:${formatDate(ticket.updated)}`,
      metadata: {
        key: ticket.key,
        status: ticket.status,
        project: ticket.project,
        assignee: ticket.assignee,
        priority: ticket.priority,
        component: ticket.component,
      },
      full_data_key: `jira:${ticket.key}:full`,
    });

    await storeFullDetails(`jira:${ticket.key}:full`, {
      description: ticket.description,
      comments: ticket.comments,
      attachments: ticket.attachments,
      changelog: ticket.changelog,
    });

    // Create entities
    await createEntity({
      type: 'project',
      name: ticket.project,
      properties: { full_name: ticket.project_full_name },
    });
  }
}

// Ongoing sync: Fetch new/updated tickets
async function syncJiraTickets() {
  const mcp = new AtlassianMCP();
  const lastSync = await getMemory('jira:last_sync_timestamp');

  const updatedTickets = await mcp.searchTickets({
    jql: `assignee = currentUser() AND updated > "${lastSync}"`,
  });

  for (const ticket of updatedTickets) {
    // Same import logic as above
    // But also check for updates to existing events
  }

  await storeMemory('jira:last_sync_timestamp', Date.now());
}
```

#### Spotify Import

**JSON export + Last.fm API:**
```typescript
// src/integrations/spotify.ts

import fs from 'fs/promises';
import fetch from 'node-fetch';

// Import from Spotify JSON export (StreamingHistory.json)
async function importSpotifyJSON(filePath: string) {
  const history = JSON.parse(await fs.readFile(filePath, 'utf-8'));

  for (const play of history) {
    await storeTimelineEvent({
      timestamp: new Date(play.endTime).getTime(),
      type: 'spotify_play',
      title: `${play.trackName} - ${play.artistName}`,
      namespace: `daily:${formatDate(play.endTime)}`,
      metadata: {
        track_id: play.spotify_track_uri,
        track_name: play.trackName,
        artist_name: play.artistName,
        duration_ms: play.msPlayed,
      },
      full_data_key: null, // Fetch on demand from Spotify API
    });

    // Create artist entity
    await createEntity({
      type: 'artist',
      name: play.artistName,
      properties: { spotify_uri: play.spotify_artist_uri },
    });
  }
}

// Import from Last.fm API (historical scrobbles)
async function importLastFmScrobbles(username: string, apiKey: string) {
  const response = await fetch(
    `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=200`
  );
  const data = await response.json();

  for (const track of data.recenttracks.track) {
    await storeTimelineEvent({
      timestamp: parseInt(track.date.uts) * 1000,
      type: 'spotify_play', // Or 'lastfm_scrobble'
      title: `${track.name} - ${track.artist['#text']}`,
      namespace: `daily:${formatDate(track.date.uts)}`,
      metadata: {
        track_name: track.name,
        artist_name: track.artist['#text'],
        album_name: track.album['#text'],
        lastfm_url: track.url,
      },
    });
  }
}
```

### Natural Language Search Implementation

**✅ CORRECTED ARCHITECTURE - React App Feature (Not Memory Server)**

Natural language search lives in the **React frontend**, not the memory server. This avoids circular dependencies and leverages Claude's conversational context.

#### Memory Server Provides Simple Search Tools (MCP)

```typescript
// src/tools/search-tools.ts (Memory Server)

// Simple structured search - Claude can call this
export const searchTimelineTool = {
  name: 'search_timeline',
  description: 'Search timeline events by filters',
  inputSchema: {
    type: 'object',
    properties: {
      date_range: { type: 'object' },
      types: { type: 'array', items: { type: 'string' } },
      entity_names: { type: 'array', items: { type: 'string' } },
      keywords: { type: 'array', items: { type: 'string' } },
      limit: { type: 'number' }
    }
  },
  handler: async (args) => {
    return await searchTimeline(args);
  }
};
```

#### React App Orchestrates Natural Language Search

```typescript
// React app: src/hooks/useNaturalLanguageSearch.ts

import { useQuery } from '@tanstack/react-query';

export function useNaturalLanguageSearch(query: string) {
  return useQuery({
    queryKey: ['nlsearch', query],
    queryFn: async () => {
      // React app calls memory server's HTTP API for structured search
      // Claude (in browser context) can help parse the query if needed

      // Option 1: Simple keyword search first
      const response = await fetch(`http://localhost:3002/api/search?q=${encodeURIComponent(query)}`);
      const results = await response.json();

      // Option 2: Later, integrate Claude API for NL parsing
      // const claudeResponse = await callClaude({
      //   prompt: `Parse this search query into filters: "${query}"`,
      //   tools: ['search_timeline'] // Claude can call memory server's MCP tools
      // });

      return results;
    }
  });
}
```

#### HTTP API Endpoint (Simple Keyword Search)

```typescript
// src/api/search.ts (Memory Server HTTP API)

app.get('/api/search', async (req, res) => {
  const { q, types, date_range } = req.query;

  // Simple full-text search across timeline events
  const results = await db.prepare(`
    SELECT * FROM timeline_events
    WHERE (title LIKE ? OR metadata LIKE ?)
      AND (? IS NULL OR type IN (?))
      AND (? IS NULL OR date BETWEEN ? AND ?)
    ORDER BY timestamp DESC
    LIMIT 100
  `).all(
    `%${q}%`, `%${q}%`,
    types, types,
    date_range, date_range?.start, date_range?.end
  );

  res.json({ results, total: results.length });
});
```

#### Flow Diagram

```
┌─────────────────┐
│  User in React  │
│  "Show me Q3    │
│  work stress"   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  React SearchBar        │
│  - Parse query locally  │
│  - Extract keywords     │
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────┐
│  HTTP GET /api/search    │
│  ?q=stress&types=jira,   │
│  calendar&date=Q3        │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Memory Server          │
│  - SQLite query         │
│  - Return events        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  React displays results │
│  (grouped by type)      │
└─────────────────────────┘

Optional: Later integrate Claude API in React for better NL parsing
```

**Example query flow:**
1. User types: "Show me stressful work weeks in Q3"
2. React app extracts: keywords=["stress"], types=["jira", "calendar"], date="2025-Q3"
3. Calls: `GET /api/search?q=stress&types=jira,calendar&date_range=2025-07-01,2025-09-30`
4. Memory server returns: Timeline events matching filters
5. React displays: Grouped results with stats

**Benefits:**
- ✅ No circular dependency (memory server doesn't call itself)
- ✅ Simple keyword search in MVP, can enhance later
- ✅ Claude integration happens in React (has access to Claude API)
- ✅ Memory server stays focused (data storage + simple queries)

### Correlation Detection

**Temporal auto-linking for analytics:**
```typescript
// src/analytics/correlations.ts

async function detectCorrelations(timeRange: { start: string; end: string }) {
  const correlations = [];

  // Music vs Mood correlation
  const moodEntries = await getTimelineEvents({ type: 'journal_entry', date_range: timeRange });
  const musicPlays = await getTimelineEvents({ type: 'spotify_play', date_range: timeRange });

  for (const mood of moodEntries) {
    // Find music played within ±2 hours of mood entry
    const nearbyMusic = musicPlays.filter(m =>
      Math.abs(m.timestamp - mood.timestamp) < 2 * 60 * 60 * 1000
    );

    // Group by artist
    const artistCounts = groupBy(nearbyMusic, 'metadata.artist_name');

    // Store correlation
    correlations.push({
      type: 'music_mood',
      condition: mood.metadata.mood,
      associated_entity: topArtist(artistCounts),
      strength: calculateStrength(artistCounts),
      sample_size: nearbyMusic.length,
    });
  }

  // Work intensity vs Mood
  // JIRA tickets per day vs mood that day
  const dailyStats = await getDailyAggregates(timeRange);
  for (const day of dailyStats) {
    if (day.ticket_count > day.avg_ticket_count * 1.5 && day.mood < 5) {
      correlations.push({
        type: 'work_stress',
        condition: 'high_ticket_count',
        effect: 'low_mood',
        strength: calculateCorrelation(day.ticket_count, day.mood),
      });
    }
  }

  return correlations;
}

// Weekly digest uses this to surface insights
async function generateWeeklyDigest(weekStart: string) {
  const correlations = await detectCorrelations({
    start: weekStart,
    end: addDays(weekStart, 7),
  });

  return {
    week: weekStart,
    insights: correlations.map(c => formatInsight(c)),
    top_artists: await getTopArtists(weekStart),
    work_summary: await getWorkSummary(weekStart),
    mood_trend: await getMoodTrend(weekStart),
  };
}
```

---

## C - Code

### Implementation Phases

#### **Phase 1: Core MCP Server (Days 1-3)**

**Goal:** Claude can store/retrieve memories, SQLite works

**Tasks:**
- [x] Scaffold `packages/memory-shack/` structure
- [x] Initialize SQLite database with schema
- [x] Implement `storage/db.ts` (connection, WAL mode, migrations)
- [x] Implement `storage/timeline.ts` (CRUD for timeline_events)
- [x] Implement `storage/memory.ts` (CRUD for memories table)
- [x] Create MCP tools (`tools/timeline-tools.ts`, `tools/memory-tools.ts`)
- [x] Configure `.mcp.json` to use new server
- [x] Test with Claude: store/retrieve memories, timeline events

**Deliverable:** Working MCP server, Claude can track dev context

---

#### **Phase 2: HTTP API + React Daily View (Days 4-7)**

**Goal:** React app shows grouped daily timeline

**Tasks:**
- [x] Add Express HTTP server (`http-server.ts`)
- [x] Implement timeline REST endpoints (`api/timeline.ts`)
- [x] Add CORS for localhost:5180
- [x] Scaffold React dashboard (or extend quantified-life project)
- [x] Create layout components (Sidebar, MainContent, SidePanel)
- [x] Build DailyView with grouped categories
- [x] Implement EventCard, EventGroup components
- [x] Create CalendarPicker + DateNavigation
- [x] Add slide transition between dates
- [x] Style with Tailwind + cyberpunk theme
- [x] Implement cute loading animation
- [x] Manual event entry form

**Deliverable:** React app displays daily timeline, manual logging works

---

#### **Phase 3: Google Calendar Import (Days 8-9)**

**Goal:** 512 calendar events imported and viewable

**Tasks:**
- [x] Reuse Google Calendar API code from google-calendar-clone
- [x] Create `integrations/google-calendar.ts`
- [x] Write `scripts/import-calendar.ts` (2021-2026 date range)
- [x] Run one-time import
- [x] Verify events in daily timeline
- [x] Add event detail view in side panel
- [x] Implement post-event notes feature

**Deliverable:** Calendar events integrated, viewable in timeline

---

#### **Phase 4: Entity System + JIRA Import (Days 10-14)**

**Goal:** People/Projects tracked, JIRA tickets imported

**Tasks:**
- [x] Implement `storage/entity.ts` (CRUD + versioning)
- [x] Implement `storage/relation.ts`
- [x] Create entity MCP tools (`tools/entity-tools.ts`)
- [x] Add entity HTTP endpoints (`api/entity.ts`)
- [x] Build EntityPage component (hybrid: stats + timeline)
- [x] Import JIRA tickets from `all-kayla-tickets.json`
- [x] Create People entities (Kayla, Patrick, coworkers)
- [x] Create JIRA Project entities (WRKA, WMB, CP)
- [x] Set up Atlassian MCP sync for new tickets
- [x] Add JIRA preview info (status breakdown, project distribution)

**Deliverable:** Entity pages work, 1,119 JIRA tickets imported

---

#### **Phase 5: Spotify + Journal + Insights (Days 15-20)**

**Goal:** Full data sources, manual journal, weekly digest

**Tasks:**
- [x] Import Spotify JSON export
- [x] Import Last.fm scrobbles
- [x] Build MoodPicker (emoji grid)
- [x] Build GratitudeList (bullet points + chips + prompts)
- [x] Build HabitTracker (sidebar widget)
- [x] Implement JournalForm
- [x] Create InsightsTab with feed of cards
- [x] Implement `analytics/correlations.ts`
- [x] Implement `analytics/weekly-digest.ts`
- [x] Build WeeklyDigest page (dedicated + auto-popup Sunday)
- [x] Add MoodGraph (line + emoji timeline)
- [x] Add MusicCharts (pill buttons with avatars)

**Deliverable:** All data sources integrated, insights working

---

#### **Phase 6: Search + Visualizations (Days 21-25)**

**Goal:** Natural language search, heatmaps, analytics charts

**Tasks:**
- [x] Implement natural language query via Claude MCP
- [x] Build SearchBar with smart suggestions
- [x] Create GroupedResults component
- [x] Add HeatmapCalendar (customizable metric)
- [x] Add WorkVelocity chart
- [x] Implement month view (navigation + patterns + milestones)
- [x] Build search query learning system

**Deliverable:** Full search, all visualizations working

---

#### **Phase 7: Export + Automation (Days 26-30)**

**Goal:** Exports, git backups, automation

**Tasks:**
- [x] Implement `utils/export.ts` (JSON, Markdown)
- [x] Create `scripts/export-json.ts`
- [x] Create `scripts/export-markdown.ts` (Obsidian-compatible)
- [x] Implement `utils/git-backup.ts`
- [x] Create `scripts/backup-weekly.ts`
- [x] Set up cron job for Sunday backups
- [x] Add error handling (friendly + details toggle)
- [x] Final UI polish (neon glow effects, animations)

**Deliverable:** Production-ready system with backups

---

### MVP Checklist (Phase 1-3)

Minimum viable system you can use day 1:

- [ ] MCP server running, Claude can access it
- [ ] SQLite database with timeline_events + memories tables
- [ ] React dashboard showing daily timeline
- [ ] Grouped by category (Work, Music, Calendar, Journal)
- [ ] Calendar events imported (512 events)
- [ ] Manual event entry works
- [ ] Side panel expansion for details
- [ ] Cyberpunk theme applied
- [ ] Cute loading animation
- [ ] Basic error handling

**Timeline:**
- **Sequential execution:** ~13-17 days to MVP, ~40+ days to full feature set
- **With parallelization:** ~4 days to MVP, ~18-20 days to full feature set
- **Recommended:** Use parallel agent execution (see MEMORY-SERVER-PARALLEL-EXECUTION.md)

---

## Success Metrics

### Technical Metrics
- [ ] Daily timeline query <50ms (100 events)
- [ ] Lazy-load expansion <5ms per event
- [ ] Database size <50MB after 1 year of data
- [ ] Zero data loss (git backups working)
- [ ] Entity version history functioning

### User Experience Metrics
- [ ] Can navigate to any date in <2 clicks
- [ ] Side panel expansion feels instant (<100ms)
- [ ] Search returns results in <500ms
- [ ] Weekly digest generates in <3 seconds
- [ ] No blocking errors (all errors gracefully handled)

### Data Completeness
- [ ] 512 calendar events imported
- [ ] 1,119 JIRA tickets imported
- [ ] Spotify history imported (TBD count)
- [ ] Manual journal entries working
- [ ] Entity relationships mapped

---

## Next Steps

**Ready to proceed?**

1. **Review this plan** - Any changes or additions needed?
2. **Start Phase 1** - Scaffold MCP server, build SQLite storage
3. **Iterate rapidly** - No tests, ship fast, fix bugs as found
4. **MVP in ~9 days** - MCP + Daily View + Calendar import

**Pending user approval to begin implementation.**

---

**Document Version:** 2.0 (Audited & Validated)
**Last Updated:** 2025-11-21
**Author:** Claude (Sonnet 4.5) + Kayla Gilbert
**Audit Status:** ✅ Architecture validated, parallel execution plan ready
**Related Documents:**
- `MEMORY-SERVER-AUDIT.md` - Comprehensive audit findings
- `MEMORY-SERVER-PARALLEL-EXECUTION.md` - Agent parallelization strategy
- `/tmp/mcp-dual-mode-test/` - MCP dual-mode prototype & test results
