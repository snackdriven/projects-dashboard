# Graphiti + chronicle - Quick Start

## ✅ Setup Complete

You now have two memory systems working together:

### 1. Graphiti (Knowledge Graph)
- **What**: AI-powered entity extraction and relationship tracking
- **Best for**: "Remember that I prefer TypeScript for new projects"
- **Endpoint**: http://localhost:8000/mcp/
- **Database**: FalkorDB (graph database)

### 2. chronicle (Timeline + KV)
- **What**: Event logging and simple key-value storage
- **Best for**: "Log event: Started Graphiti at 10AM"
- **Database**: SQLite at `.swarm/chronicle.db`

## Starting Everything

**1. Ensure Docker Desktop is running** (Windows)

**2. Start FalkorDB:**
```bash
docker start falkordb
# Or first time:
docker run -d -p 6379:6379 -p 3000:3000 --name falkordb falkordb/falkordb:latest
```

**3. Restart Claude Code** - Both servers auto-start via `.mcp.json`

## Quick Test

```bash
# Check FalkorDB is running
docker ps | grep falkordb

# Check FalkorDB connection
nc -zv localhost 6379

# View FalkorDB web UI
open http://localhost:3000/
```

## API Keys Used

- **OpenAI**: LLM for entity extraction (gpt-4o-mini) and embeddings (text-embedding-3-small)
- **Anthropic**: Optional, kept for reference (rate limits were problematic)

## Architecture

```
Docker Desktop (with WSL integration)
  └─ FalkorDB (localhost:6379)
       └─ Connected to: Graphiti MCP Server (WSL Python)
            └─ Accessed by: Claude Code

SQLite (.swarm/chronicle.db)
  └─ Connected to: chronicle MCP Server (Node.js)
       └─ Accessed by: Claude Code
```

## Configuration Files

- `.mcp.json` - MCP servers configuration
- `projects/graphiti/mcp_server/.env` - API keys
- `projects/graphiti/mcp_server/config/config.yaml` - Graphiti settings

## Full Documentation

See `projects/graphiti/GRAPHITI_SETUP.md` for complete setup details.

## Troubleshooting

**FalkorDB not accessible:**
```bash
docker start falkordb
```

**Graphiti won't start:**
```bash
cd projects/graphiti/mcp_server
./start-graphiti.sh
```

**Docker not working in WSL:**
- Check Docker Desktop is running
- Verify WSL integration: Docker Desktop → Settings → Resources → WSL Integration

## What Changed from Initial Setup

✅ **Before**: FalkorDB via Windows networking (`10.255.255.254:6379`)
✅ **After**: Docker Desktop WSL integration (`localhost:6379`)
✅ **Benefit**: Simpler networking, more reliable, easier to debug

---

**Status**: ✅ Fully operational
**Last updated**: 2025-11-25
