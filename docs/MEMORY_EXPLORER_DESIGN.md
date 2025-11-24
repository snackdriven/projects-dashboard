# Memory-Shack Interactive Explorer - Design Document

**Status:** Planning
**Created:** 2025-01-23
**Last Updated:** 2025-01-23

## Executive Summary

This document outlines the design and implementation plan for an interactive exploration tool for memory-shack MCP server contents. The recommended approach is a **phased hybrid solution** that starts with lightweight slash commands and progressively adds CLI tools and dashboard widgets based on real usage patterns.

**Quick Start:** Phase 1 (Slash Commands) can be implemented in 4 hours and provides immediate value.

---

## Problem Analysis

### Core Challenge

Design an interactive interface for exploring memory-shack's dual-store architecture:

- **Timeline Store**: Event-based data organized by dates (temporal queries, event types, metadata)
- **Key-Value Store**: Namespaced persistent storage with TTL support (pattern matching, search, lifecycle)

### Key Constraints

1. **MCP Integration**: Must work with existing MCP server tools (20+ available functions)
2. **Performance**: Handle large datasets without degradation (potentially thousands of events/memories)
3. **Developer UX**: Optimized for technical users, not end-users
4. **Real-time**: Stats and views must reflect current state
5. **Dual-store complexity**: Two different data models need unified UX

### Critical Success Factors

- Intuitive navigation between timeline and KV stores
- Fast filtering and search (sub-second response)
- Clear data visualization in terminal environment
- Seamless export workflows
- Minimal cognitive load for complex queries

---

## Solution Options Evaluated

### Option 1: Interactive Slash Command Suite ⭐ RECOMMENDED FOR PHASE 1

**Description:** Specialized slash commands that guide interactive exploration within Claude Code.

**Commands:**
- `/memory-explore` - Main entry point with mode selection
- `/memory-timeline [date]` - Interactive timeline browser
- `/memory-kv [namespace]` - Interactive KV browser
- `/memory-stats` - Real-time statistics dashboard
- `/memory-export [options]` - Guided export wizard

**Pros:**
- ✅ Zero setup - works immediately in Claude Code
- ✅ AI-assisted - Claude can interpret complex queries
- ✅ Flexible - Easy to add new exploration patterns
- ✅ Context-aware - Understands relationships between data
- ✅ Fast iteration - Just edit markdown files

**Cons:**
- ❌ Not real-time - Turn-based interaction
- ❌ No persistent UI - State resets between sessions
- ❌ Limited visualization - Text-based only
- ❌ Slower for rapid navigation

**Use Cases:**
- Initial exploration of unfamiliar memory contents
- Complex queries requiring AI interpretation
- One-time data exports or analysis
- Learning memory-shack structure

**Risk Assessment:** **LOW** - Minimal development effort (4 hours)

---

### Option 2: Node.js TUI Application ⭐ RECOMMENDED FOR PHASE 2

**Description:** Dedicated terminal UI application using React Ink or Blessed-contrib with split-pane interface, real-time updates, and keyboard shortcuts.

**Tech Stack:**
```json
{
  "dependencies": {
    "ink": "^4.0.0",
    "ink-table": "^3.0.0",
    "ink-text-input": "^5.0.0",
    "ink-select-input": "^5.0.0",
    "clipboardy": "^3.0.0",
    "date-fns": "^2.30.0",
    "fast-fuzzy": "^1.12.0"
  }
}
```

**Key Features:**

1. **Timeline View**
   - Calendar navigation (arrow keys)
   - Event type filters (checkboxes)
   - Event detail expansion (Enter)
   - Related memories preview

2. **KV View**
   - Namespace tree (collapsible)
   - Pattern search (fuzzy)
   - TTL indicators (visual)
   - Value preview (truncated)

3. **Stats Panel**
   - Total events by type
   - Memory usage by namespace
   - Recent activity timeline
   - Expiration warnings

4. **Search & Filter**
   - Global search across both stores
   - Stack filters (AND logic)
   - Save filter presets
   - Export filtered results

**Pros:**
- ✅ Rich interactions - Real-time, keyboard-driven
- ✅ High performance - Optimized for large datasets
- ✅ Professional UX - Polished developer experience
- ✅ Scriptable - Can be invoked from scripts
- ✅ Portable - Single binary distribution possible

**Cons:**
- ❌ Development time - 2-4 days for MVP
- ❌ Separate tool - Another thing to install
- ❌ Maintenance - Needs updates for MCP changes
- ❌ Learning curve - New tool to learn

**Use Cases:**
- Daily exploration during development
- Debugging complex memory states
- Monitoring long-running systems
- Power users needing rapid navigation

**Risk Assessment:** **MEDIUM** - Moderate development effort

---

### Option 3: Hybrid CLI + Dashboard Widget ⭐ RECOMMENDED FOR PHASE 3

**Description:** Lightweight CLI commands combined with optional web dashboard widget in the existing projects-dashboard.

**Part A: CLI Commands**
```bash
# Quick queries
mem timeline 2025-01-15              # List events
mem timeline --range 7d --type jira  # Filtered timeline
mem kv list --namespace dev          # List KV memories
mem search "project:dashboard"       # Global search
mem stats --json                     # Stats as JSON
mem export timeline.json --format json --date 2025-01-15

# Interactive mode
mem explore                          # Launch TUI session
```

**Part B: Dashboard Widget**
- Add route to projects-dashboard: `/memory-explorer`
- React component with data tables, charts, filters
- Live updates via polling
- Export buttons, shareable links

**Pros:**
- ✅ Flexibility - CLI for power users, GUI for exploration
- ✅ Integration - Lives in existing dashboard project
- ✅ Progressive - Start with CLI, add GUI later
- ✅ Shareable - Dashboard URLs can share findings
- ✅ Visualization - Charts for timeline patterns

**Cons:**
- ❌ Complexity - Two interfaces to maintain
- ❌ Dashboard coupling - Adds to dashboard bundle
- ❌ Split attention - Which interface for what?

**Use Cases:**
- **CLI**: Daily queries, scripting, automation
- **Dashboard**: Presentations, exploration, analysis
- **Both**: Full workflow from exploration to export

**Risk Assessment:** **MEDIUM-HIGH** - Higher initial effort but can build incrementally

---

### Option 4: AI-Powered Explorer Agent

**Description:** Specialized Claude Code agent providing conversational memory exploration with natural language queries and pattern detection.

**Pros:**
- ✅ Natural language - No syntax to learn
- ✅ Intelligent - Can infer intent and suggest queries
- ✅ Contextual - Remembers previous queries
- ✅ Explanatory - Can explain what it finds

**Cons:**
- ❌ Speed - Slower than direct TUI
- ❌ Precision - May misinterpret complex queries
- ❌ Reproducibility - Harder to script exact queries

**Risk Assessment:** **LOW** - Quick to implement, can complement other solutions

---

## Recommended Approach: Phased Hybrid

### Phase 1: Slash Commands (Week 1) ⚡ IMMEDIATE VALUE

**Timeline:** 4 hours
**Effort:** Low
**Value:** High

Implement 5 focused commands:
- `/memory-timeline [date]` - Interactive timeline browser
- `/memory-kv [namespace]` - Interactive KV browser
- `/memory-search [query]` - Global search
- `/memory-stats` - Real-time statistics
- `/memory-export` - Guided export wizard

**Success Criteria:**
- Commands used 10+ times in first week
- Positive feedback from users
- Clear use cases for CLI/dashboard identified

---

### Phase 2: CLI Tool (Week 2-3) 🛠️ POWER USERS

**Timeline:** 2-3 days
**Effort:** Medium
**Value:** Medium-High

Build standalone CLI with:
```bash
npm install -g @projects-dashboard/memory-explorer

mem timeline 2025-01-15
mem kv list --namespace dev
mem search "pattern"
mem explore  # Launch TUI
```

**Architecture:**
```
memory-explorer-cli/
├── src/
│   ├── components/
│   │   ├── TimelineExplorer.tsx
│   │   ├── KVExplorer.tsx
│   │   ├── StatsView.tsx
│   │   └── InteractiveExplorer.tsx
│   ├── hooks/
│   │   ├── useMemoryShack.ts
│   │   ├── useTimeline.ts
│   │   └── useKVStore.ts
│   ├── lib/
│   │   └── mcp-client.ts
│   └── index.js
├── package.json
└── README.md
```

**Success Criteria:**
- Installation success rate > 90%
- Daily active users: 3+
- Query response time < 500ms

---

### Phase 3: Dashboard Widget (Week 4-5) 📊 VISUALIZATION

**Timeline:** 3-4 days
**Effort:** Medium-High
**Value:** Medium

Add to projects-dashboard:
```
http://localhost:5180/memory-explorer
```

**Features:**
- Timeline chart (Recharts)
- KV table (React-Table)
- Export buttons
- Shareable URLs

**Components:**
- `TimelineChart.tsx` - Visualize events over time
- `KVTable.tsx` - Browse memories
- `StatsCards.tsx` - Summary statistics
- `SearchBar.tsx` - Global search
- `ExportButton.tsx` - Data export

**Success Criteria:**
- Page load time < 2 seconds
- Export usage: 10+ exports/week
- Users report insights found via visualization

---

### Phase 4: AI Agent (Ongoing) 🤖 INTELLIGENCE LAYER

**Timeline:** Ongoing enhancement
**Effort:** Low (incremental)
**Value:** High (compound)

Memory Explorer Agent provides:
- Query suggestions based on context
- Pattern detection and anomaly alerts
- Guided debugging workflows
- Natural language exploration

---

## Implementation Details

### Phase 1: Slash Commands (Detailed)

#### File Structure
```
.claude/commands/
├── memory-timeline.md
├── memory-kv.md
├── memory-search.md
├── memory-stats.md
└── memory-export.md
```

#### `/memory-timeline` Command

**Purpose:** Interactive timeline event browser

**Usage:**
```bash
/memory-timeline              # Browse today
/memory-timeline 2025-01-15   # Specific date
/memory-timeline --range 7d   # Last 7 days
```

**Workflow:**
1. Fetch timeline using `get_timeline` or `get_timeline_range`
2. Display events grouped by type with counts
3. Offer drill-down options:
   - View event details (`expand_event`)
   - Filter by type
   - Search within results
   - Export selection
4. Show related memories (if event_id used as memory key)

**Display Format:**
```
📅 Timeline: 2025-01-15 (42 events)

🎫 JIRA Tickets (15)
  #1 • PROJECT-123 "Fix authentication bug" • 09:15
  #2 • PROJECT-124 "Add export feature" • 10:30
  [Show all...]

🎵 Spotify Plays (20)
  #1 • "Song Title" by Artist • 14:20
  [Show all...]

📝 Journal Entries (7)
  #1 • "Daily standup notes" • 18:00
  [Show all...]

Actions:
[E] Expand event details
[F] Filter by type
[S] Search
[X] Export
[Q] Quit
```

---

#### `/memory-kv` Command

**Purpose:** Interactive key-value memory browser

**Usage:**
```bash
/memory-kv                    # All namespaces
/memory-kv dev                # Specific namespace
/memory-kv --pattern "user:*" # Pattern search
```

**Workflow:**
1. List memories using `list_memories`
2. Group by namespace
3. Show key, value preview, TTL, timestamps
4. Offer actions:
   - View full value
   - Search by pattern
   - Delete memory
   - Update TTL
   - Export namespace

**Display Format:**
```
🗄️ Key-Value Store

📁 Namespace: dev (12 memories)
  user:preferences     {...}           No expiry    Modified 2h ago
  session:abc123       "active"        Expires 30m  Created 45m ago
  cache:api-response   {...}           Expires 5m   Created 2m ago

📁 Namespace: prod (5 memories)
  feature:flags        {...}           No expiry    Modified 1d ago

Actions:
[V] View full value
[S] Search pattern
[D] Delete memory
[T] Update TTL
[X] Export
[Q] Quit
```

---

#### `/memory-search` Command

**Purpose:** Global search across timeline and KV stores

**Usage:**
```bash
/memory-search "project:dashboard"  # Search all
/memory-search --timeline "JIRA"    # Timeline only
/memory-search --kv "user:*"        # KV only
```

**Workflow:**
1. Search timeline: `get_timeline_range` + filter
2. Search KV: `search_memories`
3. Combine and rank results
4. Display unified results with source indicators

**Display Format:**
```
🔍 Search: "project:dashboard" (8 results)

📅 Timeline Events (3)
  [2025-01-15] JIRA Ticket: PROJECT-123 "Dashboard bug"
  [2025-01-14] Calendar Event: "Dashboard review meeting"

🗄️ KV Memories (5)
  [dev] project:dashboard:config {...}
  [dev] project:dashboard:state {...}

Actions:
[O] Open result
[R] Refine search
[X] Export results
[Q] Quit
```

---

#### `/memory-stats` Command

**Purpose:** Real-time memory-shack statistics dashboard

**Workflow:**
1. Get timeline summary: `get_timeline_summary`
2. Get event types: `get_event_types`
3. Get KV stats: `get_memory_stats`
4. Display unified dashboard

**Display Format:**
```
📊 Memory-Shack Statistics

📅 TIMELINE STORE
  Total Events: 1,247
  Date Range: 2024-12-01 to 2025-01-23

  Events by Type:
  • jira_ticket      425 (34%)  ████████████░░░
  • spotify_play     380 (30%)  ███████████░░░░
  • calendar_event   215 (17%)  ██████░░░░░░░░░
  • journal_entry    127 (10%)  ████░░░░░░░░░░░
  • github_commit    100 (8%)   ███░░░░░░░░░░░░

  Recent Activity (24h): 42 events

🗄️ KEY-VALUE STORE
  Total Memories: 89

  By Namespace:
  • dev              45 (51%)
  • prod             25 (28%)
  • cache            19 (21%)

  Expiration:
  • No expiry        60 (67%)
  • < 1 hour         15 (17%)  ⚠️
  • < 24 hours       10 (11%)
  • > 24 hours        4 (5%)

💾 STORAGE
  Estimated Size: ~2.5 MB
  Events with full data: 156
  Expired memories cleaned: 23

Actions:
[R] Refresh
[E] Export stats
[C] Clean expired
[Q] Quit
```

---

#### `/memory-export` Command

**Purpose:** Guided export wizard for memory data

**Workflow:**
1. Ask: What to export? (Timeline / KV / Both / Search results)
2. Ask: Filter criteria (date range, namespace, type)
3. Ask: Format (JSON / CSV / Markdown / PDF)
4. Ask: Destination (File / Clipboard / Display)
5. Execute export using appropriate MCP tools
6. Confirm completion

**Export Formats:**

**JSON:**
```json
{
  "exported_at": "2025-01-23T...",
  "source": "memory-shack",
  "timeline": [...],
  "kv_store": {...}
}
```

**CSV (Timeline):**
```csv
date,timestamp,type,title,metadata
2025-01-15,1705320000000,jira_ticket,PROJECT-123,...
```

**Markdown:**
```markdown
# Memory Export - 2025-01-23

## Timeline Events (42)

### JIRA Tickets
- **PROJECT-123** (2025-01-15 09:15)
  Fix authentication bug

## Key-Value Memories (89)

### Namespace: dev
- `user:preferences`: {...}
```

---

### Phase 2: CLI Tool Architecture

#### Main Entry Point

```javascript
// memory-explorer-cli/src/index.js
import { program } from 'commander';
import { render } from 'ink';
import { TimelineExplorer } from './components/TimelineExplorer.js';
import { KVExplorer } from './components/KVExplorer.js';
import { StatsView } from './components/StatsView.js';
import { InteractiveExplorer } from './components/InteractiveExplorer.js';
import { MCPClient } from './lib/mcp-client.js';

const mcp = new MCPClient('memory-shack');

program
  .name('mem')
  .description('Memory-Shack CLI Explorer')
  .version('1.0.0');

program
  .command('timeline [date]')
  .option('-r, --range <days>', 'Date range in days')
  .option('-t, --type <type>', 'Filter by event type')
  .option('--json', 'Output as JSON')
  .action(async (date, options) => {
    if (options.json) {
      const data = await mcp.getTimeline(date, options);
      console.log(JSON.stringify(data, null, 2));
    } else {
      render(<TimelineExplorer date={date} options={options} />);
    }
  });

program
  .command('kv [namespace]')
  .option('-p, --pattern <pattern>', 'Key pattern')
  .option('--json', 'Output as JSON')
  .action(async (namespace, options) => {
    if (options.json) {
      const data = await mcp.listMemories(namespace, options);
      console.log(JSON.stringify(data, null, 2));
    } else {
      render(<KVExplorer namespace={namespace} options={options} />);
    }
  });

program
  .command('stats')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    if (options.json) {
      const stats = await mcp.getStats();
      console.log(JSON.stringify(stats, null, 2));
    } else {
      render(<StatsView />);
    }
  });

program
  .command('explore')
  .description('Launch interactive TUI explorer')
  .action(() => {
    render(<InteractiveExplorer />);
  });

program.parse();
```

#### MCP Client Library

```javascript
// lib/mcp-client.js
export class MCPClient {
  constructor(serverName) {
    this.serverName = serverName;
  }

  async getTimeline(date, options = {}) {
    // Call MCP tool: mcp__memory-shack__get_timeline
    // Handle pagination, filtering
  }

  async getTimelineRange(startDate, endDate, options = {}) {
    // Call MCP tool: mcp__memory-shack__get_timeline_range
  }

  async listMemories(namespace, options = {}) {
    // Call MCP tool: mcp__memory-shack__list_memories
  }

  async search(query) {
    // Call MCP tool: mcp__memory-shack__search_memories
  }

  async getStats() {
    // Aggregate stats from multiple MCP tools:
    // - get_event_types
    // - get_memory_stats
    // - get_timeline_summary
  }

  async export(format, data) {
    // Format and export data to JSON, CSV, Markdown, or PDF
  }
}
```

#### React Ink Components

**TimelineExplorer:**
```jsx
import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useTimeline } from '../hooks/useTimeline.js';
import EventList from './EventList.js';
import Pagination from './Pagination.js';

export function TimelineExplorer({ date, options }) {
  const { events, loading, error, page, setPage } = useTimeline(date, options);

  if (loading) return <Text>Loading timeline...</Text>;
  if (error) return <Text color="red">Error: {error.message}</Text>;

  return (
    <Box flexDirection="column">
      <Text bold>📅 Timeline: {date || 'Today'}</Text>
      <EventList events={events} />
      <Pagination
        page={page}
        total={events.length}
        onPageChange={setPage}
      />
    </Box>
  );
}
```

**InteractiveExplorer (Full TUI):**
```jsx
import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TabView } from './TabView.js';
import { TimelinePanel } from './TimelinePanel.js';
import { KVPanel } from './KVPanel.js';
import { StatsPanel } from './StatsPanel.js';

export function InteractiveExplorer() {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Timeline', 'KV Store', 'Stats'];

  useInput((input, key) => {
    if (key.tab) setActiveTab((activeTab + 1) % tabs.length);
    if (input === 'q') process.exit(0);
  });

  return (
    <Box flexDirection="column" height="100%">
      <TabView tabs={tabs} activeTab={activeTab} />
      <Box flexGrow={1}>
        {activeTab === 0 && <TimelinePanel />}
        {activeTab === 1 && <KVPanel />}
        {activeTab === 2 && <StatsPanel />}
      </Box>
      <Text dimColor>
        Tab: Switch view | q: Quit | ?: Help
      </Text>
    </Box>
  );
}
```

---

### Phase 3: Dashboard Widget

#### Integration

```typescript
// src/App.tsx
import { MemoryExplorerPage } from './pages/MemoryExplorerPage';

// Add route
<Route path="/memory-explorer" element={<MemoryExplorerPage />} />
```

#### Main Component

```typescript
// src/pages/MemoryExplorerPage.tsx
import { useState } from 'react';
import { TimelineChart } from '../components/memory/TimelineChart';
import { KVTable } from '../components/memory/KVTable';
import { StatsCards } from '../components/memory/StatsCards';
import { SearchBar } from '../components/memory/SearchBar';
import { ExportButton } from '../components/memory/ExportButton';
import { useMemoryShack } from '../hooks/useMemoryShack';

export function MemoryExplorerPage() {
  const [dateRange, setDateRange] = useState({
    start: '2025-01-01',
    end: '2025-01-23'
  });
  const [searchQuery, setSearchQuery] = useState('');

  const { timeline, kvStore, stats, loading } = useMemoryShack({
    dateRange,
    search: searchQuery
  });

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Memory Explorer</h1>
        <div className="flex gap-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <ExportButton data={{ timeline, kvStore }} />
        </div>
      </header>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimelineChart
          data={timeline}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
        <KVTable
          memories={kvStore}
          onDelete={(key) => {/* ... */}}
        />
      </div>
    </div>
  );
}
```

#### Timeline Chart

```typescript
// src/components/memory/TimelineChart.tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function TimelineChart({ data, dateRange, onDateRangeChange }) {
  // Group events by date and type
  const chartData = data.reduce((acc, event) => {
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = {};
    acc[date][event.type] = (acc[date][event.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Timeline Activity</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={Object.entries(chartData).map(([date, types]) => ({
          date,
          ...types
        }))}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="jira_ticket" fill="#3b82f6" />
          <Bar dataKey="spotify_play" fill="#22c55e" />
          <Bar dataKey="calendar_event" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## Success Metrics

### Phase 1 (Slash Commands)
- ✅ Time to explore timeline: < 30 seconds
- ✅ Commands used weekly: 5+
- ✅ User satisfaction: Positive feedback

### Phase 2 (CLI Tool)
- ✅ Installation success rate: > 90%
- ✅ Daily active users: 3+
- ✅ Average session time: 2-5 minutes
- ✅ Query response time: < 500ms

### Phase 3 (Dashboard)
- ✅ Page load time: < 2 seconds
- ✅ Concurrent users: 5+
- ✅ Export usage: 10+ exports/week
- ✅ Visualization value: Users report insights found

---

## Risk Mitigation

### Technical Risks

**Risk:** MCP server performance degradation with large datasets
**Mitigation:**
- Implement pagination early (Phase 1)
- Cache frequently accessed data
- Monitor query times, alert if > 1 second

**Risk:** Memory-shack tool API changes
**Mitigation:**
- Version-lock MCP client
- Abstract MCP calls behind interface
- Test suite against MCP tools

**Risk:** Terminal compatibility issues
**Mitigation:**
- Test on Windows/WSL, Mac, Linux
- Graceful fallback to simple output
- User-reported compatibility matrix

### UX Risks

**Risk:** Learning curve too steep
**Mitigation:**
- Interactive help (`/memory-help`)
- Examples in each command
- Video walkthrough

**Risk:** Feature creep
**Mitigation:**
- Stick to phased plan
- Collect feedback before next phase
- Kill features with low usage

---

## Future Considerations

### Multi-user Collaboration
- Shared exploration sessions
- Annotate timeline events
- Team dashboards

### AI-Powered Insights
- Anomaly detection
- Pattern recognition
- Predictive analytics

### Integration Expansion
- Export to Notion, Obsidian
- Import from external sources
- Webhook triggers

### Performance Optimization
- Server-side indexing
- GraphQL API layer
- Real-time subscriptions

---

## Alternative Perspectives

### Contrarian View: "Just Use Raw MCP Tools"

**Argument:**
- Learning another tool adds cognitive load
- Direct MCP calls are more explicit
- Custom exploration fits ad-hoc needs
- No maintenance burden

**Counter:**
- Raw tools require 10+ calls for complex queries
- No visual overview of data structure
- Hard to share findings with team
- Repeated patterns waste time

**Synthesis:**
Keep raw MCP tools accessible via `--raw` flag or advanced mode. Explorer is for common cases, not all cases.

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-01-23 | Adopt phased hybrid approach | Balances quick value with long-term flexibility |
| 2025-01-23 | Start with slash commands (Phase 1) | Lowest risk, immediate value, learning opportunity |
| TBD | Proceed to Phase 2 (CLI) | Based on Phase 1 usage patterns |
| TBD | Proceed to Phase 3 (Dashboard) | Based on visualization needs |

---

## Next Steps

### Immediate (Today)
1. ✅ Create slash command files in `.claude/commands/`
2. ✅ Test `/memory-timeline` with real data
3. ✅ Iterate based on initial usage

### Week 1
1. Complete all 5 slash commands
2. Gather user feedback
3. Document common use cases
4. Decide: Proceed to Phase 2?

### Week 2-3 (If approved)
1. Set up CLI project structure
2. Implement MCP client library
3. Build React Ink components
4. Test across platforms

### Week 4-5 (If approved)
1. Add dashboard route
2. Build React components
3. Integrate with existing dashboard
4. Deploy to staging

---

## References

### MCP Server Tools (memory-shack)

**Timeline Tools:**
- `store_timeline_event` - Store new event
- `get_timeline` - Get events for date
- `get_timeline_range` - Get events for range
- `get_event` - Get single event
- `expand_event` - Store full event data
- `delete_event` - Delete event
- `update_event` - Update event fields
- `get_timeline_summary` - Get stats for date
- `get_event_types` - List all event types

**Key-Value Tools:**
- `store_memory` - Store memory
- `retrieve_memory` - Get memory
- `delete_memory` - Delete memory
- `list_memories` - List memories
- `search_memories` - Search by content
- `bulk_store_memories` - Store multiple
- `bulk_delete_memories` - Delete multiple
- `has_memory` - Check existence
- `update_memory_ttl` - Update TTL
- `get_memory_stats` - Get statistics
- `clean_expired_memories` - Clean expired

### Related Documentation
- `CLAUDE.md` - Project development guide
- `docs/credential_setup.md` - API credential setup
- `.mcp.json` - MCP server configuration

---

## Appendix: Quick Reference

### Slash Commands Quick Reference

```bash
# Browse timeline
/memory-timeline                    # Today's events
/memory-timeline 2025-01-15         # Specific date
/memory-timeline --range 7d         # Last 7 days

# Browse KV store
/memory-kv                          # All namespaces
/memory-kv dev                      # Specific namespace
/memory-kv --pattern "user:*"       # Pattern search

# Search everywhere
/memory-search "query"              # Global search
/memory-search --timeline "JIRA"    # Timeline only
/memory-search --kv "pattern"       # KV only

# View statistics
/memory-stats                       # Full dashboard

# Export data
/memory-export                      # Guided wizard
```

### CLI Commands Quick Reference

```bash
# Timeline
mem timeline                        # Today
mem timeline 2025-01-15             # Specific date
mem timeline --range 7d --type jira # Filtered

# KV Store
mem kv list                         # All
mem kv list --namespace dev         # Specific
mem kv search "pattern"             # Search

# Global
mem search "query"                  # Search all
mem stats                           # Statistics
mem stats --json                    # JSON output

# Interactive
mem explore                         # Launch TUI
```

---

**Document Version:** 1.0
**Status:** Planning
**Next Review:** After Phase 1 completion
