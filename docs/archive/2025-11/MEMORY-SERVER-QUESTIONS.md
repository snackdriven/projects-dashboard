# Memory MCP Server - Questions Before Implementation

**Status:** Awaiting Answers
**Context:** See [MEMORY-SERVER-DESIGN.md](MEMORY-SERVER-DESIGN.md) for full architecture

## Questions Summary

Based on our conversation, you've already answered:
- **Q3:** Data privacy, lack of control/visibility, can't export/interact as you want ✅
- **Q8:** Both MCP and HTTP API needed ✅
- **Q11:** Namespaces explained - you understand the concept ✅
- **Q5:** Temporal viewing is the biggest deal ✅
- **Q6:** Start with metadata, expand on interaction (lazy-loading) ✅
- **Q2:** Building React app now while using memory for dev context ✅

## Remaining Questions

### Q1 - Port Assignment
**Question:** The memory server HTTP API needs a port. Is **port 3002** okay?

**Context:**
- Port 3001 is already used by dashboard backend
- Port 3002 is next available
- MCP server (stdio) doesn't need a port
- Only HTTP API needs a port

**Options:**
- A) Use port 3002 (recommended)
- B) Use a different port (specify which)

**Your Answer:**
```
[Answer here]
```

---

### Q2 - Existing Data Migration
**Question:** Do you have existing data from the third-party memory server that needs to be migrated?

**Context:**
- You have files: `memory-graph-export.md`, `memory-graph-export-kayla-only.md`
- These suggest you've been using the memory server
- Need to know if we should import this data

**Options:**
- A) Yes, I have data to migrate (provide export files)
- B) No, start fresh
- C) Not sure, let's check what's in those files

**Your Answer:**
```
[Answer here]
```

---

### Q3 - Initial Data Sources Priority
**Question:** Which data sources should we design ingestion for FIRST?

**Context:**
You have:
- ✅ `all-kayla-tickets.json` (1,119 JIRA tickets ready to import)
- ✅ Google Calendar integration (already in calendar clone)
- ❓ Spotify listening history (do you have exports?)
- ❓ Manual journal entries (need to design entry form)

**Options (rank or select):**
- [ ] JIRA tickets (have JSON ready)
- [ ] Google Calendar events (have integration)
- [ ] Spotify listening history (need to export first?)
- [ ] Manual journal entries (need UI)

**Your Answer:**
```
[Answer here - rank in order of priority]
```

---

### Q4 - Timeline Query Behavior
**Question:** When querying "show me November 19, 2025", should it:

**Context:**
- Heavy days could have 100+ events (47 songs + tickets + calendar + journal)
- Need to balance performance vs completeness

**Options:**
- A) Return ALL events (could be 100+ items, might be slow to render)
- B) Return grouped summaries with drill-down (e.g., "47 Spotify plays [expand]")
- C) Return paginated (first 20, "load more" button)
- D) Return prioritized (recent/important first, load more available)

**Your Answer:**
```
[Answer here]
```

---

### Q5 - Development Priority
**Question:** What's most urgent to build FIRST?

**Context:**
- You're building the React app NOW
- You need memory for Claude's dev context
- Both are important, but which is blocking you more?

**Options:**
- A) MCP server for Claude's dev context (replace third-party ASAP)
- B) HTTP API for React app's daily timeline view
- C) Both at the same time (dual-mode from day 1)

**Your Answer:**
```
[Answer here]
```

---

### Q6 - Spotify Data
**Question:** Do you have Spotify listening history exports, or do we need to set up tracking first?

**Context:**
- You have 6,698 tracks in Spotify library (mentioned in docs)
- Not sure if you have historical play data
- Options: Import history vs start tracking now

**Options:**
- A) I have Spotify data exports (provide files/format)
- B) No history, start tracking from now
- C) Use Spotify API to fetch recent plays retroactively
- D) Not a priority right now

**Your Answer:**
```
[Answer here]
```

---

### Q7 - Entity Tracking Scope
**Question:** Which entities should we track initially?

**Context:**
- The system can track people, projects, tickets, artists, events, etc.
- More entities = more setup, but richer relationships

**Options (select all that apply):**
- [ ] People (you, coworkers, family)
- [ ] JIRA Projects (WRKA, WMB, CP, etc.)
- [ ] JIRA Tickets (individual tickets)
- [ ] Music Artists (Marilyn Manson, Tool, etc.)
- [ ] Calendar Events (meetings, appointments)
- [ ] Other (specify)

**Your Answer:**
```
[Answer here]
```

---

### Q8 - Backup Strategy
**Question:** How do you want to handle backups/exports?

**Context:**
- SQLite file is portable (can just copy it)
- Can also export to JSON, Markdown, SQL dumps
- Want to make sure you never lose data

**Options (select all that apply):**
- [ ] Automatic daily backup (SQLite file copy)
- [ ] Manual export commands (JSON, Markdown)
- [ ] Git integration (commit JSON exports daily)
- [ ] Cloud sync (Dropbox, Google Drive, etc.)
- [ ] Just the SQLite file is enough

**Your Answer:**
```
[Answer here]
```

---

### Q9 - Manual Journal Entry Interface
**Question:** How do you envision entering manual journal data?

**Context:**
- Need to capture: mood, gratitude, notes, habits
- Could be CLI, web form, or both

**Options:**
- A) Web form in React app (visual, easy to use)
- B) CLI tool (quick terminal entry)
- C) Both (web for detailed, CLI for quick)
- D) Markdown files (write in editor, import)
- E) Not a priority right now

**Your Answer:**
```
[Answer here]
```

---

### Q10 - Date Range for Initial Import
**Question:** When importing historical data, how far back should we go?

**Context:**
- You have data going back to 2021 (calendar) and 1,119 tickets
- More history = slower initial import, but richer context

**Options:**
- A) Last 6 months only (manageable, recent context)
- B) Last year (2024-2025)
- C) Everything available (all 1,119 tickets, all calendar events)
- D) Start with nothing, add as I explore

**Your Answer:**
```
[Answer here]
```

---

## Answer Format

You can answer these questions in any format:
1. **All at once** - Copy this file, fill in answers
2. **Three at a time** - Like you requested earlier
3. **One by one** - We discuss each before answering

Once you provide answers, I'll immediately start building the appropriate implementation!

## Quick Reference

**Already Decided:**
- ✅ Temporal-first architecture (time is primary index)
- ✅ Lazy-loading (metadata first, expand on click)
- ✅ SQLite storage (local, transparent, exportable)
- ✅ Dual interface (MCP + HTTP)
- ✅ Namespace organization (daily:YYYY-MM-DD, dev:*, etc.)
- ✅ Privacy-first (local data, full control)

**Your Answers So Far:**
- Q3: Want data privacy + control + exportability
- Q8: Need both MCP and HTTP API
- Q5: Temporal viewing is #1 priority
- Q6: Metadata first, expand on interaction
- Q2: Building React app alongside using memory for dev context

**Ready to Build:**
- Package structure design ✅
- Database schema ✅
- MCP tools specification ✅
- HTTP API endpoints ✅
- Implementation plan ✅

**Waiting On:**
- Your answers to remaining questions above
- Then immediate implementation starts!
