# Memory MCP Server - Quick Start Guide

**Status:** Ready to Build
**Prerequisites:** Answer questions in [MEMORY-SERVER-QUESTIONS.md](MEMORY-SERVER-QUESTIONS.md) first

## Implementation Phases

### Phase 1: Core MCP Server (Week 1)
**Goal:** Replace third-party memory server with your own for Claude's dev context

**Tasks:**
- [ ] Scaffold package structure in `packages/memory-shack/`
- [ ] Set up SQLite database with schema (see MEMORY-SERVER-DESIGN.md)
- [ ] Implement storage layer (db.ts, timeline.ts, memory.ts)
- [ ] Build MCP tools for timeline + key-value
- [ ] Configure `.mcp.json` to use new server
- [ ] Test with Claude: store/retrieve memories
- [ ] Migrate existing data from third-party server (if any)

**Deliverable:** Working MCP server that Claude can use for dev context

### Phase 2: HTTP API (Week 2)
**Goal:** Enable React app to query timeline data

**Tasks:**
- [ ] Add Express HTTP server (http-server.ts)
- [ ] Implement REST endpoints for timeline queries
- [ ] Add CORS for React app access
- [ ] Create React hooks for querying (useTimeline, useEvent)
- [ ] Build daily timeline view component
- [ ] Test: Load Nov 19, 2025 data via HTTP API

**Deliverable:** React app can display daily timeline from memory server

### Phase 3: Entity System (Week 3)
**Goal:** Track people, projects, artists with relationships

**Tasks:**
- [ ] Implement entity CRUD operations (entity.ts)
- [ ] Add MCP tools for entity management
- [ ] Add HTTP endpoints for entity queries
- [ ] Implement relation storage (relation.ts)
- [ ] Build entity page component (e.g., "Kayla Gilbert" page)
- [ ] Test: Query "all tickets assigned to Kayla"

**Deliverable:** Entity pages with relationship tracking

### Phase 4: Data Ingestion (Week 4)
**Goal:** Import existing data and set up automated ingestion

**Tasks:**
- [ ] Import JIRA tickets from all-kayla-tickets.json
- [ ] Import Spotify listening history (if available)
- [ ] Import Google Calendar events (from calendar clone)
- [ ] Set up automated ingestion scripts
- [ ] Create manual journal entry form
- [ ] Test: Full daily view with all data sources

**Deliverable:** Historical data loaded, automated tracking active

### Phase 5: Polish & Export (Week 5)
**Goal:** Export tools, backup, and documentation

**Tasks:**
- [ ] Build JSON export script
- [ ] Build Markdown export (Obsidian-compatible)
- [ ] Add SQL backup/restore scripts
- [ ] Create admin UI for inspecting data
- [ ] Write user documentation
- [ ] Set up automated daily backups

**Deliverable:** Production-ready with export/backup tools

## Quick Commands

### Setup
```bash
# Create package
cd packages/
mkdir memory-shack
cd memory-shack
pnpm init

# Install dependencies
pnpm add @modelcontextprotocol/sdk better-sqlite3 express cors zod
pnpm add -D @types/better-sqlite3 @types/express @types/cors typescript tsx
```

### Development
```bash
# Build MCP server
pnpm build

# Run MCP server (for testing)
node dist/index.js

# Run HTTP API server
pnpm dev:http

# Run both (dual-mode)
pnpm dev
```

### Testing
```bash
# Test MCP server with Claude
# (Update .mcp.json, restart Claude Code)

# Test HTTP API
curl http://localhost:3002/api/timeline/2025-11-19

# Test data export
pnpm export:json --date 2025-11-19
pnpm export:markdown --date 2025-11-19
```

### Data Management
```bash
# Backup database
pnpm backup

# Restore from backup
pnpm restore --input backup-2025-11-21.sql

# Import JIRA tickets
pnpm import:jira --input ../all-kayla-tickets.json

# Export daily data
pnpm export:daily --date 2025-11-19 --format markdown
```

## File Structure

```
packages/memory-shack/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # MCP server entry
│   ├── http-server.ts        # HTTP API server
│   ├── storage/
│   │   ├── db.ts             # SQLite setup
│   │   ├── timeline.ts       # Timeline CRUD
│   │   ├── memory.ts         # Key-value CRUD
│   │   ├── entity.ts         # Entity CRUD
│   │   └── relation.ts       # Relation CRUD
│   ├── tools/
│   │   ├── timeline-tools.ts # MCP: timeline
│   │   ├── memory-tools.ts   # MCP: key-value
│   │   ├── entity-tools.ts   # MCP: entities
│   │   └── relation-tools.ts # MCP: relations
│   ├── api/
│   │   ├── routes.ts         # HTTP routes
│   │   ├── timeline.ts       # Timeline endpoints
│   │   ├── entity.ts         # Entity endpoints
│   │   └── memory.ts         # Memory endpoints
│   ├── types.ts              # TypeScript types
│   └── utils/
│       ├── validation.ts     # Zod schemas
│       └── export.ts         # Export utilities
├── data/
│   └── memory.db             # SQLite (gitignored)
├── scripts/
│   ├── migrate.ts            # Schema migrations
│   ├── export-json.ts        # JSON export
│   ├── export-markdown.ts    # Markdown export
│   └── import-tickets.ts     # JIRA import
└── README.md
```

## Configuration Files

### package.json
```json
{
  "name": "@projects-dashboard/memory-shack",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "dev:http": "tsx src/http-server.ts",
    "export:json": "tsx scripts/export-json.ts",
    "export:markdown": "tsx scripts/export-markdown.ts",
    "import:jira": "tsx scripts/import-tickets.ts",
    "backup": "tsx scripts/backup.ts",
    "restore": "tsx scripts/restore.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "better-sqlite3": "^11.0.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "zod": "^3.22.0"
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

### tsconfig.json
```json
{
  "extends": "@projects-dashboard/shared-config/typescript/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "ESNext",
    "target": "ES2022",
    "moduleResolution": "node",
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### .mcp.json (Root - Update this)
```json
{
  "mcpServers": {
    "memory": {
      "command": "node",
      "args": ["./packages/memory-shack/dist/index.js"],
      "env": {
        "MEMORY_DB_PATH": "./packages/memory-shack/data/memory.db",
        "HTTP_PORT": "3002",
        "HTTP_ENABLED": "true"
      }
    },
    "atlassian": {
      "type": "sse",
      "url": "https://mcp.atlassian.com/v1/sse",
      "headers": {
        "Authorization": "..."
      }
    }
  }
}
```

## Example Usage

### From Claude (MCP)

```typescript
// Store a memory
await store_memory({
  key: "project:jira-wrapper:status",
  value: "active",
  namespace: "dev"
})

// Retrieve it
const status = await retrieve_memory({ key: "project:jira-wrapper:status" })
// → "active"

// Store a timeline event
await store_timeline_event({
  timestamp: Date.now(),
  type: "jira_ticket",
  title: "WRKA-3808: Fix authentication bug",
  namespace: "daily:2025-11-19",
  metadata: {
    ticket_id: "WRKA-3808",
    status: "Done",
    project: "WRKA"
  }
})

// Get daily timeline
const timeline = await get_timeline({ date: "2025-11-19" })
// → { events: [...], stats: {...} }
```

### From React App (HTTP)

```typescript
// Fetch daily timeline
const response = await fetch('http://localhost:3002/api/timeline/2025-11-19');
const { events, stats } = await response.json();

// Component
function DailyView({ date }: { date: string }) {
  const { data, isLoading } = useQuery(['timeline', date], async () => {
    const res = await fetch(`http://localhost:3002/api/timeline/${date}`);
    return res.json();
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h1>{date}</h1>
      <Stats counts={data.stats.by_type} />
      <EventList events={data.events} onExpand={expandEvent} />
    </div>
  );
}

// Expand event details
async function expandEvent(eventId: string) {
  const res = await fetch(
    `http://localhost:3002/api/timeline/${date}/${eventId}/full`
  );
  return res.json();
}
```

## Port Assignments (Updated)

| Service | Port | Purpose |
|---------|------|---------|
| Dashboard Backend | 3001 | Project launcher API |
| Memory MCP Server (HTTP) | 3002 | Timeline/entity queries |
| Memory MCP Server (stdio) | - | Claude tool calls |

Add this to [port_assignments.md](port_assignments.md).

## Testing Checklist

### Phase 1: MCP Server
- [ ] Claude can store memories
- [ ] Claude can retrieve memories
- [ ] Claude can list memories by namespace
- [ ] Claude can store timeline events
- [ ] Claude can query timeline by date
- [ ] Data persists across restarts

### Phase 2: HTTP API
- [ ] HTTP server starts on port 3002
- [ ] React app can fetch daily timeline
- [ ] Events return lightweight metadata
- [ ] Expanding events loads full details
- [ ] CORS allows localhost:5180 requests

### Phase 3: Entities
- [ ] Create person entity (Kayla Gilbert)
- [ ] Create project entity (WRKA)
- [ ] Link entities with relations (Kayla worked_on WRKA-3808)
- [ ] Query relations (find all tickets for Kayla)
- [ ] Entity page shows timeline + relations

### Phase 4: Data Import
- [ ] JIRA tickets imported from JSON
- [ ] Calendar events imported
- [ ] Manual journal entries work
- [ ] Daily view shows all data sources

### Phase 5: Export
- [ ] JSON export creates valid file
- [ ] Markdown export is Obsidian-compatible
- [ ] SQL backup/restore works
- [ ] Data survives backup → restore cycle

## Troubleshooting

### "Module not found: better-sqlite3"
```bash
# Rebuild native module
pnpm rebuild better-sqlite3
```

### "Port 3002 already in use"
```bash
# Check what's using it
lsof -i :3002  # WSL/Linux
netstat -ano | findstr :3002  # Windows

# Change port in .mcp.json
"HTTP_PORT": "3003"
```

### "Database is locked"
SQLite doesn't handle concurrent writes well. Solutions:
1. Use WAL mode (Write-Ahead Logging) - already in db.ts
2. Ensure only one server instance running
3. Use transactions for bulk writes

### "Claude can't find MCP server"
```bash
# Check MCP server is built
cd packages/memory-shack
pnpm build
ls dist/index.js  # Should exist

# Check .mcp.json path is correct (relative to root)
# Restart Claude Code to reload .mcp.json
```

## Next Steps

1. **Answer questions** in [MEMORY-SERVER-QUESTIONS.md](MEMORY-SERVER-QUESTIONS.md)
2. **Start Phase 1** - Scaffold package and build MCP server
3. **Test with Claude** - Verify it works for dev context
4. **Add HTTP API** - Enable React app queries
5. **Import data** - Load historical JIRA/Spotify/Calendar data
6. **Iterate** - Add features as needed for life-logging dashboard

## Additional Resources

- Full design: [MEMORY-SERVER-DESIGN.md](MEMORY-SERVER-DESIGN.md)
- Questions: [MEMORY-SERVER-QUESTIONS.md](MEMORY-SERVER-QUESTIONS.md)
- MCP SDK Docs: https://github.com/modelcontextprotocol/sdk
- SQLite Docs: https://www.sqlite.org/docs.html
- better-sqlite3: https://github.com/WiseLibs/better-sqlite3
