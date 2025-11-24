# Memory MCP Server Design - Temporal-First Architecture

**Date:** 2025-11-21
**Status:** Design Complete - Ready for Implementation

## Executive Summary

Building a custom memory MCP server to replace third-party memory server with:
- **Dual Purpose:** Claude dev context + React app data store
- **Primary Feature:** Temporal viewing ("show me everything from Nov 19, 2025")
- **Data Pattern:** Lightweight metadata with lazy-loaded full details
- **Privacy:** Local SQLite, full control, easy export
- **Interface:** MCP tools (Claude) + HTTP API (React app)

## Your Requirements (From Conversation)

### What You Said
- Q3: "data privacy, lack of control or visibility into schema, can't export/interact with it as I want"
- Q8: Both MCP and HTTP API needed
- Q5: "temporal viewing is honestly the biggest deal"
- Q6: "decent bit of metadata, but okay to start with metadata and then... have it expand when I interact with it"
- Q2: "building the react app right now alongside...using it for the dev context for it lmao"

### Translation
1. **Temporal-first:** Time is the primary index/query axis
2. **Lazy-loading:** Store lightweight events, expand on interaction
3. **Dual-mode:** Serve both Claude (MCP) and React app (HTTP)
4. **Privacy:** Local SQLite file, full transparency
5. **Export-friendly:** JSON dumps, SQL exports, Markdown reports

## Architecture Overview

### Core Concept: Timeline Events with Lazy Details

Every piece of data = **Timeline Event**:
```typescript
{
  id: "evt_abc123",
  timestamp: 1732060800,           // Unix timestamp
  date: "2025-11-19",              // YYYY-MM-DD (indexed!)
  type: "spotify_play",            // Event type
  namespace: "daily:2025-11-19",   // Organization
  title: "The Beautiful People - Marilyn Manson",
  metadata: {                      // Lightweight data (always loaded)
    track_id: "spotify:track:abc",
    artist: "Marilyn Manson",
    duration_ms: 212000
  },
  full_data_key: null              // Reference to expanded details
}
```

When user clicks → expand to full details:
```typescript
{
  ...event,
  full_data_key: "spotify:track:abc:full",
  full_data: {
    album: "Antichrist Superstar",
    album_art_url: "...",
    lyrics: "...",
    audio_features: {...},
    listening_context: "working on WRKA-3808"
  }
}
```

## SQLite Schema

### Table: timeline_events (Primary Table)
```sql
CREATE TABLE timeline_events (
  id TEXT PRIMARY KEY,              -- UUID
  timestamp INTEGER NOT NULL,       -- Unix timestamp
  date TEXT NOT NULL,               -- YYYY-MM-DD (fast daily queries)
  type TEXT NOT NULL,               -- jira_ticket, spotify_play, calendar_event, journal_entry
  namespace TEXT,                   -- daily:YYYY-MM-DD, dev:context
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

**Query Performance:**
- Get all events from a day: `WHERE date = '2025-11-19'` → O(log n) index scan
- Get events from date range: `WHERE date BETWEEN '2025-11-01' AND '2025-11-30'`
- Get specific type: `WHERE date = '2025-11-19' AND type = 'spotify_play'`

### Table: full_details (Lazy-Loaded Details)
```sql
CREATE TABLE full_details (
  key TEXT PRIMARY KEY,             -- Matches full_data_key in timeline_events
  data TEXT,                        -- Full JSON payload
  created_at INTEGER,
  accessed_at INTEGER               -- Track when last accessed (LRU cache)
);
```

**Usage Pattern:**
1. Load daily timeline → Query `timeline_events` only (fast, lightweight)
2. User clicks event → Check if `full_data_key` exists
3. If exists → Query `full_details` table
4. If not exists → Fetch from source API, store in `full_details`, update event

### Table: memories (Key-Value for Dev Context)
```sql
CREATE TABLE memories (
  key TEXT PRIMARY KEY,
  value TEXT,                       -- JSON-serialized value
  namespace TEXT,                   -- Optional organization
  created_at INTEGER,
  updated_at INTEGER,
  expires_at INTEGER                -- TTL support (NULL = never expires)
);

CREATE INDEX idx_memories_namespace ON memories(namespace);
CREATE INDEX idx_memories_expires ON memories(expires_at);
```

**Use Cases:**
- Claude stores project state: `dev:project:jira-wrapper:status = "active"`
- Config values: `config:default-view = "daily"`
- Credentials refs: `auth:atlassian:email = "kayla@joinchorus.com"`

### Table: entities (People, Projects, Artists)
```sql
CREATE TABLE entities (
  id TEXT PRIMARY KEY,              -- UUID or slug (person:kayla-gilbert)
  type TEXT,                        -- person, project, artist, ticket
  name TEXT UNIQUE,                 -- Display name (searchable)
  properties TEXT,                  -- JSON blob of properties
  created_at INTEGER,
  updated_at INTEGER
);

CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_name ON entities(name);
```

**Examples:**
```json
// Person entity
{
  "id": "person:kayla-gilbert",
  "type": "person",
  "name": "Kayla Gilbert",
  "properties": {
    "role": "QA Engineer",
    "company": "Chorus",
    "email": "kayla@joinchorus.com",
    "birthday": "1995-05-17",
    "relationships": {
      "engaged_to": "person:patrick"
    }
  }
}

// Project entity
{
  "id": "project:wrka",
  "type": "project",
  "name": "WRKA",
  "properties": {
    "full_name": "Workforce Management - Core",
    "status": "active",
    "team": ["person:kayla-gilbert", "person:jason-lunde"]
  }
}
```

### Table: relations (Entity Relationships)
```sql
CREATE TABLE relations (
  id TEXT PRIMARY KEY,
  from_entity_id TEXT,
  relation_type TEXT,               -- assigned_to, worked_on, listened_to, attended
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

**Examples:**
```json
// Kayla worked on WRKA-3808
{
  "from_entity_id": "person:kayla-gilbert",
  "relation_type": "assigned_to",
  "to_entity_id": "ticket:wrka-3808",
  "properties": {
    "assigned_date": "2025-10-15",
    "completed_date": "2025-11-19",
    "hours_worked": 8.5
  }
}

// WRKA-3808 belongs to WRKA project
{
  "from_entity_id": "ticket:wrka-3808",
  "relation_type": "part_of",
  "to_entity_id": "project:wrka"
}
```

## Namespace Strategy

Namespaces organize data into logical groups using colon-separated prefixes:

```
daily:YYYY-MM-DD:*          # Daily timeline data
  daily:2025-11-19:jira      # JIRA tickets for that day
  daily:2025-11-19:spotify   # Spotify plays
  daily:2025-11-19:calendar  # Calendar events
  daily:2025-11-19:journal   # Manual entries

dev:*                       # Development context (Claude)
  dev:project:*              # Project state
  dev:entity:*               # Entity tracking
  dev:decision:*             # Architecture decisions

config:*                    # Configuration
  config:ui:*                # UI preferences
  config:auth:*              # Auth tokens/refs

cache:*                     # Temporary cached data (with TTL)
```

**Benefits:**
- Bulk operations: Delete all `cache:*` entries
- Scoped queries: Get all daily data for a date
- Organization: Separate concerns clearly
- Time-based: Daily namespaces for temporal data

## Dual Interface Design

### 1. MCP Server (for Claude)

**Protocol:** JSON-RPC over stdio
**Port:** None (stdio communication)
**Usage:** Claude calls tools during conversations

#### Timeline Tools
```typescript
// Store timeline event
store_timeline_event({
  timestamp: number | string,    // Unix timestamp or ISO string
  type: string,                  // Event type
  title: string,                 // Human-readable
  metadata: object,              // Lightweight data
  namespace?: string             // Optional organization
})

// Get timeline for a date
get_timeline({
  date: string,                  // YYYY-MM-DD
  type?: string,                 // Filter by type
  limit?: number                 // Max results
})

// Expand event with full details
expand_event({
  event_id: string,
  full_data: object              // Full details to store
})

// Get event by ID
get_event({ event_id: string })
```

#### Key-Value Tools
```typescript
// Store memory
store_memory({
  key: string,
  value: any,
  namespace?: string,
  ttl?: number                   // Seconds until expiration
})

// Retrieve memory
retrieve_memory({ key: string })

// Delete memory
delete_memory({ key: string })

// List memories
list_memories({
  namespace?: string,            // Filter by namespace
  pattern?: string               // Glob pattern (e.g., "dev:*")
})
```

#### Entity Tools
```typescript
// Create entity
create_entity({
  type: string,                  // person, project, artist, ticket
  name: string,                  // Unique name
  properties: object             // Arbitrary properties
})

// Get entity
get_entity({ name: string })

// Update entity
update_entity({
  name: string,
  properties: object             // Merge with existing
})

// Query entities
query_entities({
  type?: string,                 // Filter by type
  search?: string                // Search in names/properties
})
```

#### Relation Tools
```typescript
// Create relation
create_relation({
  from: string,                  // Entity name
  relation: string,              // Relation type
  to: string,                    // Entity name
  properties?: object            // Optional metadata
})

// Query relations
query_relations({
  from?: string,                 // Start entity
  to?: string,                   // End entity
  relation?: string,             // Relation type
  limit?: number
})
```

### 2. HTTP API (for React App)

**Protocol:** REST over HTTP
**Port:** 3002 (suggested, configurable)
**Usage:** React app queries for UI rendering

#### Timeline Endpoints
```
GET /api/timeline/:date
  → Returns all events for date (lightweight metadata only)
  → Response: { events: Event[], stats: { total, by_type } }

GET /api/timeline/:date/:event_id/full
  → Returns event with expanded full details
  → Response: { ...event, full_data: {...} }

GET /api/timeline/range?start=YYYY-MM-DD&end=YYYY-MM-DD
  → Returns events across date range
  → Response: { events: Event[], stats: {...} }

GET /api/timeline/:date/summary
  → Returns aggregated stats without full event list
  → Response: { date, counts: { jira: 3, spotify: 47, ... } }
```

#### Entity Endpoints
```
GET /api/entities/:type
  → List all entities of type
  → Response: { entities: Entity[] }

GET /api/entities/:type/:name
  → Get specific entity with properties
  → Response: { entity: Entity }

GET /api/entities/:type/:name/timeline
  → Get all timeline events related to entity
  → Response: { events: Event[] }

GET /api/entities/:type/:name/relations
  → Get all relations for entity
  → Response: { relations: Relation[] }
```

#### Memory Endpoints
```
GET /api/memory/:key
  → Retrieve memory by key
  → Response: { key, value, metadata }

POST /api/memory
  → Store memory
  → Body: { key, value, namespace?, ttl? }

DELETE /api/memory/:key
  → Delete memory
```

## Implementation Stack

```
packages/memory-shack/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── http-server.ts        # HTTP API server
│   ├── storage/
│   │   ├── db.ts             # SQLite connection & initialization
│   │   ├── timeline.ts       # Timeline CRUD operations
│   │   ├── memory.ts         # Key-value operations
│   │   ├── entity.ts         # Entity operations
│   │   └── relation.ts       # Relation operations
│   ├── tools/
│   │   ├── timeline-tools.ts # MCP tools for timeline
│   │   ├── memory-tools.ts   # MCP tools for key-value
│   │   ├── entity-tools.ts   # MCP tools for entities
│   │   └── relation-tools.ts # MCP tools for relations
│   ├── api/
│   │   ├── routes.ts         # HTTP route definitions
│   │   ├── timeline.ts       # Timeline HTTP handlers
│   │   ├── entity.ts         # Entity HTTP handlers
│   │   └── memory.ts         # Memory HTTP handlers
│   ├── types.ts              # Shared TypeScript types
│   └── utils/
│       ├── validation.ts     # Input validation
│       └── export.ts         # JSON/SQL export utilities
├── data/
│   └── memory.db             # SQLite database (gitignored)
├── scripts/
│   ├── migrate.ts            # Schema migrations
│   ├── export-json.ts        # Export to JSON
│   ├── export-markdown.ts    # Export to Markdown
│   └── import-tickets.ts     # Import from all-kayla-tickets.json
└── README.md
```

### Dependencies
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",  // MCP protocol
    "better-sqlite3": "^11.0.0",            // Fast SQLite
    "express": "^4.18.2",                   // HTTP server
    "cors": "^2.8.5",                       // CORS for React
    "zod": "^3.22.0"                        // Schema validation
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0"
  }
}
```

## Data Flow Examples

### Example 1: Storing a Spotify Play (via Claude)

**Claude conversation:**
> "I'm listening to Marilyn Manson - The Beautiful People right now"

**MCP Tool Call:**
```typescript
await store_timeline_event({
  timestamp: Date.now(),
  type: "spotify_play",
  title: "The Beautiful People - Marilyn Manson",
  namespace: "daily:2025-11-19",
  metadata: {
    track_id: "spotify:track:6qEhD9MQ8fsBWE3xSVgFs8",
    track_name: "The Beautiful People",
    artist: "Marilyn Manson",
    album: "Antichrist Superstar",
    duration_ms: 212000
  }
})
```

**Database Insert:**
```sql
INSERT INTO timeline_events VALUES (
  'evt_abc123',
  1732060800,
  '2025-11-19',
  'spotify_play',
  'daily:2025-11-19',
  'The Beautiful People - Marilyn Manson',
  '{"track_id":"spotify:track:6qEhD9MQ8fsBWE3xSVgFs8",...}',
  NULL,  -- No full details yet
  1732060800,
  1732060800
);
```

### Example 2: Daily Timeline Query (from React App)

**React Component:**
```typescript
// Fetch daily timeline
const { data } = useQuery(['timeline', '2025-11-19'], async () => {
  const res = await fetch('http://localhost:3002/api/timeline/2025-11-19');
  return res.json();
});

// Render lightweight events
{data.events.map(event => (
  <EventCard
    key={event.id}
    title={event.title}
    type={event.type}
    metadata={event.metadata}
    onExpand={() => expandEvent(event.id)}  // Lazy-load full details
  />
))}
```

**HTTP Response (Lightweight):**
```json
{
  "events": [
    {
      "id": "evt_abc123",
      "timestamp": 1732060800,
      "type": "spotify_play",
      "title": "The Beautiful People - Marilyn Manson",
      "metadata": {
        "track_id": "spotify:track:abc",
        "artist": "Marilyn Manson",
        "duration_ms": 212000
      },
      "full_data_key": null
    },
    // ... 46 more Spotify plays
    // ... 3 JIRA tickets
    // ... 5 calendar events
  ],
  "stats": {
    "total": 54,
    "by_type": {
      "spotify_play": 47,
      "jira_ticket": 3,
      "calendar_event": 5
    }
  }
}
```

### Example 3: Expanding Event Details (User Clicks)

**React Action:**
```typescript
const expandEvent = async (eventId: string) => {
  // Check if already expanded
  const event = data.events.find(e => e.id === eventId);
  if (event.full_data_key) {
    // Already expanded, fetch from cache
    const res = await fetch(`http://localhost:3002/api/timeline/2025-11-19/${eventId}/full`);
    return res.json();
  }

  // Not expanded yet, fetch from Spotify API and store
  const trackData = await fetchSpotifyTrack(event.metadata.track_id);
  const res = await fetch(`http://localhost:3002/api/timeline/${eventId}/expand`, {
    method: 'POST',
    body: JSON.stringify({ full_data: trackData })
  });
  return res.json();
};
```

**Database Update:**
```sql
-- Insert full details
INSERT INTO full_details VALUES (
  'spotify:track:abc:full',
  '{"album":"Antichrist Superstar","album_art":"...","lyrics":"...",...}',
  1732061000,
  1732061000
);

-- Update timeline event
UPDATE timeline_events
SET full_data_key = 'spotify:track:abc:full',
    updated_at = 1732061000
WHERE id = 'evt_abc123';
```

## Export Formats

### JSON Export
```typescript
// scripts/export-json.ts
pnpm export:json --date 2025-11-19 --output daily-2025-11-19.json
```

**Output:**
```json
{
  "date": "2025-11-19",
  "exported_at": "2025-11-21T10:30:00Z",
  "events": [
    {
      "timestamp": 1732060800,
      "type": "spotify_play",
      "title": "The Beautiful People - Marilyn Manson",
      "metadata": {...},
      "full_data": {...}
    }
  ],
  "entities": [...],
  "relations": [...]
}
```

### Markdown Export (Obsidian-Compatible)
```typescript
// scripts/export-markdown.ts
pnpm export:markdown --date 2025-11-19 --output daily-2025-11-19.md
```

**Output:**
```markdown
# Daily Log - November 19, 2025

## Work (3 tickets)
- [[WRKA-3808]] Fix authentication bug ✅ Completed
- [[WRKA-3807]] Update API endpoints ⏳ In Progress
- [[WMB-3217]] Review test coverage 📋 Pending

## Music (47 plays)
- [[Marilyn Manson]] - 15 plays
  - The Beautiful People (3×)
  - Antichrist Superstar (2×)
- [[Tool]] - 8 plays
- [[Nine Inch Nails]] - 6 plays

## Calendar (5 events)
- 09:00 - Daily standup
- 10:30 - Sprint planning
- ...

## Journal
**Mood:** 😊 Productive
**Gratitude:**
- Shipped WRKA-3808 finally!
- Good coffee this morning
```

### SQL Backup
```bash
# Full database backup
pnpm backup --output memory-backup-2025-11-21.sql

# Restore from backup
pnpm restore --input memory-backup-2025-11-21.sql
```

## Performance Considerations

### Query Performance
- **Daily timeline:** ~5-10ms for 100 events (date index)
- **Lazy-load expansion:** ~2-5ms per event (primary key lookup)
- **Entity queries:** ~10-20ms for 1000 entities (type + name indexes)
- **Relation queries:** ~15-30ms for complex traversals (multi-index joins)

### Optimization Strategies
1. **Indexes on all query columns** (date, type, namespace, entity names)
2. **JSON fields for flexible data** (avoid schema migrations)
3. **Separate full_details table** (keep timeline queries fast)
4. **TTL cleanup job** (delete expired memories periodically)
5. **LRU cache for hot queries** (cache common date queries in memory)

### Scalability
- **SQLite handles 100,000+ events** without issues
- **Daily timeline with 500 events:** <20ms query time
- **Full year of data (180,000 events):** <50MB database file
- **Entity graph with 1,000 entities + 5,000 relations:** <30ms traversal

## Next Steps

See [MEMORY-SERVER-QUICKSTART.md](MEMORY-SERVER-QUICKSTART.md) for implementation checklist.

See [MEMORY-SERVER-QUESTIONS.md](MEMORY-SERVER-QUESTIONS.md) for questions that need answering before implementation.
