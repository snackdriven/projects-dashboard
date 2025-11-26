# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Projects Dashboard** - A monorepo containing a centralized dashboard for managing and launching development projects, plus 7+ individual React applications.

**Tech Stack:**
- React 19 with TypeScript
- Vite (Rolldown - Rust-based bundler)
- Tailwind CSS 4
- pnpm workspaces
- Turborepo for build orchestration
- Framer Motion for animations
- Zustand for state management

**Performance Philosophy:**
- Rolldown for 10x faster builds
- Turborepo caching for 150x faster rebuilds
- pnpm for 60% faster installs
- WSL2 required on Windows for optimal performance

## Monorepo Structure

```
projects-dashboard/
├── src/                    # Dashboard React frontend (port 5180)
├── server/                 # Express backend API (port 3001)
├── packages/               # Shared monorepo packages
│   ├── ui/                # Shared React UI components
│   └── shared-config/     # Shared configurations (TypeScript, ESLint, Tailwind)
├── projects/               # Individual project workspaces
│   ├── google-calendar-clone/     (port 5173)
│   ├── jira-wrapper/              (port 5174)
│   ├── lastfm-clone/              (port 5175)
│   ├── livejournal-clone/         (port 5176)
│   ├── react-ts-templates/        (port 5177)
│   ├── task-manager/              (port 5178)
│   └── quantified-life/           (port 5179)
├── pnpm-workspace.yaml    # Workspace configuration
└── turbo.json             # Turborepo orchestration
```

## Development Commands

### Starting Projects

```bash
# Dashboard only (frontend + backend)
pnpm dev

# All projects in parallel
pnpm dev:all

# Individual components
pnpm dev:frontend   # Dashboard frontend only
pnpm dev:backend    # Dashboard backend only
```

### Building

```bash
# Dashboard only
pnpm build

# All projects (uses Turborepo caching)
pnpm build:all

# Force rebuild (ignore cache)
pnpm build:all --force
```

### Quality Checks

```bash
# Lint
pnpm lint           # Dashboard only
pnpm lint:all       # All projects

# Type-check
pnpm type-check     # Dashboard only
pnpm type-check:all # All projects

# Full verification (build + lint + type-check)
pnpm verify
```

### Dependency Management

```bash
# Check for outdated dependencies across monorepo
pnpm deps:check

# Interactive update (recommended)
pnpm deps:check-interactive

# Update all dependencies
pnpm deps:update

# Update only minor/patch (safer)
pnpm deps:update-minor
```

### Cleanup

```bash
pnpm clean          # Clean dashboard build artifacts
pnpm clean:all      # Clean all projects
```

## Port Assignments

**IMPORTANT:** Each project has a dedicated port to avoid conflicts.

| Project | Port | Configuration File |
|---------|------|--------------------|
| Dashboard Frontend | 5180 | vite.config.ts |
| Dashboard Backend | 3001 | server/index.js |
| google-calendar-clone | 5173 | projects/google-calendar-clone/vite.config.ts |
| jira-wrapper | 5174 | projects/jira-wrapper/vite.config.ts |
| lastfm-clone | 5175 | projects/lastfm-clone/vite.config.ts |
| livejournal-clone | 5176 | projects/livejournal-clone/vite.config.ts |
| react-ts-templates | 5177 | projects/react-ts-templates/vite.config.ts |
| task-manager | 5178 | projects/task-manager/vite.config.ts |
| quantified-life | 5179 | projects/quantified-life/vite.config.ts |

When adding new projects, assign the next available port starting from 5181+.

## Shared Packages

### @projects-dashboard/ui

Shared React UI components used across projects.

**Usage:**
```tsx
import { Button, Card } from '@projects-dashboard/ui';

<Button variant="primary" size="md">Click me</Button>
<Card hover gradient>Content</Card>
```

**Location:** `packages/ui/`
**Components:** Button, Card (more to be added)

### @projects-dashboard/shared-config

Shared configuration files for TypeScript, ESLint, and Tailwind CSS.

**TypeScript Usage:**
```json
{
  "extends": "@projects-dashboard/shared-config/typescript/react.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo"
  },
  "include": ["src"]
}
```

**Tailwind Usage:**
```js
import baseConfig from '@projects-dashboard/shared-config/tailwind/base.js';

export default {
  ...baseConfig,
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme.extend,
      // Custom extensions
    },
  },
};
```

## Turborepo Caching

Turborepo caches build outputs for lightning-fast rebuilds:

- **First build:** ~15 seconds
- **Cached build (no changes):** ~0.2 seconds (75x faster)
- **Single project changed:** Only rebuilds that project

**Cache Configuration:** See `turbo.json`

**Outputs Cached:**
- Build artifacts: `dist/`, `.next/`
- Type-check artifacts: `*.tsbuildinfo`, `node_modules/.tmp/`
- Lint caches: `.eslintcache`
- Test coverage: `coverage/`

**Environment Variables:**
- `NODE_ENV` - Global environment
- `VITE_*` - Build-time environment variables

## Git Structure

This monorepo uses a **multi-repo approach**:

- **Dashboard:** Main git repo (this folder)
- **Each project in `projects/`:** Independent git repos
- **Standard branch:** `main` (all projects)
- **Remote:** GitHub (all projects)

See `git_guide.md` for detailed workflows.

## API Credentials

Several projects require API credentials (Google Calendar, Spotify, Atlassian/JIRA).

**Setup Scripts:**
```bash
./setup-credentials.sh    # Interactive credential wizard
./test-credentials.sh     # Verify credentials work
```

**Environment Files:**
- `.env` - Root credentials (shared services)
- `projects/*/\.env` - Project-specific credentials

See `credential_setup.md` for detailed setup.

## Adding New Projects

See `adding_projects.md` for the complete guide.

**Quick Steps:**
1. Create project in `projects/`
2. Assign unique port in `vite.config.ts`
3. Add to dashboard in `src/App.tsx`
4. Run `pnpm install` from root
5. Turborepo auto-detects it

## Common Development Patterns

### Using Shared UI Components

1. Add dependency in project's `package.json`:
```json
{
  "dependencies": {
    "@projects-dashboard/ui": "workspace:*"
  }
}
```

2. Run `pnpm install` from root

3. Import components:
```tsx
import { Button, Card } from '@projects-dashboard/ui';
```

### Creating New Shared Components

1. Add component to `packages/ui/src/components/`
2. Export in `packages/ui/src/index.ts`
3. Run `pnpm build` in `packages/ui/`
4. Use in projects

### TypeScript Configuration

All projects should extend shared TypeScript configs:

```json
{
  "extends": "@projects-dashboard/shared-config/typescript/react.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo"
  },
  "include": ["src"]
}
```

### Tailwind Configuration

All projects should extend shared Tailwind configs:

```js
import baseConfig from '@projects-dashboard/shared-config/tailwind/base.js';

export default {
  ...baseConfig,
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
};
```

## Troubleshooting

### "pnpm: command not found" (Windows)

You're in Windows terminal, not WSL. Either:
- Run `wsl` first, then commands
- Use `.\launch.bat` which handles WSL automatically

### Port Already in Use

Check `port_assignments.md` for assigned ports. Each project has a unique port.

To find what's using a port:
```bash
lsof -i :5173  # Linux/Mac/WSL
```

### Build Fails After Dependency Update

```bash
pnpm clean:all     # Clean all build artifacts
pnpm install       # Reinstall dependencies
pnpm build:all     # Rebuild everything
```

### Turborepo Cache Issues

```bash
pnpm build:all --force    # Force rebuild, ignore cache
```

### Shared Package Not Found

```bash
pnpm install              # Install from root
pnpm build --filter @projects-dashboard/ui  # Build shared package
```

## Performance Tips

1. **Always use WSL on Windows** - 10x faster file operations
2. **Leverage Turborepo cache** - Don't use `--force` unless needed
3. **Use `pnpm build:all`** - Parallel builds are faster
4. **Install from root** - `pnpm install` from monorepo root
5. **Update dependencies monthly** - Use `pnpm deps:check-interactive`

## Code Quality

- **TypeScript:** Strict mode enabled
- **Linting:** ESLint with React hooks rules
- **Formatting:** Follow existing patterns
- **Components:** Use Framer Motion for animations
- **State:** Zustand for state management (lightweight)

## Documentation Files

| File | Purpose |
|------|---------|
| readme.md | Project overview and quick start |
| claude.md | This file - development guide |
| adding_projects.md | Guide for adding new projects |
| git_guide.md | Git structure and workflows |
| port_assignments.md | Port assignments for all projects |
| credential_setup.md | API credential setup guide |
| monorepo_setup.md | Monorepo architecture and workflows |
| graphiti-quickstart.md | Graphiti + chronicle integration guide |

## MCP Servers

The project uses MCP (Model Context Protocol) servers for enhanced AI assistance:

- **Atlassian/JIRA:** Ticket access and management
- **Graphiti:** Temporally-aware knowledge graph with AI-powered entity extraction (see `projects/graphiti/GRAPHITI_SETUP.md`)
- **chronicle:** Timeline events and key-value storage for structured data
- **context7:** Up-to-date library documentation
- **chrome-devtools:** Browser automation and debugging

Configuration in `.mcp.json` and `.env` files.

### Memory Storage Architecture

The project uses two complementary memory systems:

1. **Graphiti** (`projects/graphiti/`) - Knowledge graph for relationships and entities
   - Entity extraction from conversations
   - Semantic search across knowledge
   - Temporal tracking (what changed when)
   - Best for: Concept relationships, entity management

2. **chronicle** (`projects/chronicle/`) - Timeline and key-value storage
   - Time-based event logging
   - Simple configuration storage
   - Best for: Event logs, structured data

See `projects/graphiti/GRAPHITI_SETUP.md` for complete setup documentation.

## Important Notes

1. **Always push migrations to Supabase CLI** (from user's global CLAUDE.md)
2. **Test credentials after updating** - Use `./test-credentials.sh`
3. **Port conflicts are common** - Check port_assignments.md first
4. **WSL is required for Windows** - Better performance and compatibility
5. **Rolldown (Vite) requires WSL** - Officially recommended by Rolldown team
