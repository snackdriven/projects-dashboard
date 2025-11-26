# Projects Dashboard

A centralized dashboard for managing and launching your development projects. Built with React 19, TypeScript, Vite (Rolldown), and Tailwind CSS 4.

## Features

- 🚀 **Quick Launch** - Launch any project with a single click
- 📊 **Status Monitoring** - Real-time status checking for all projects
- ⌨️ **Keyboard Navigation** - Full keyboard support for efficient navigation
- 🎨 **Smooth Animations** - Beautiful animations powered by Framer Motion
- ⚡ **Monorepo Setup** - pnpm workspaces + Turborepo for blazing fast builds
- 🎯 **Single User** - Designed for personal development use

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4
- **Backend:** Express.js
- **Build Tool:** Vite with Rolldown (Rust-based bundler)
- **Package Manager:** pnpm (60% faster than npm)
- **Build Orchestration:** Turborepo (parallel builds with caching)
- **Animations:** Framer Motion

## Prerequisites

- Node.js 18+
- pnpm (installed automatically during setup)
- WSL2 (for Windows users - recommended for 10x better performance)
- API credentials for integrated services (see [Credential Setup](#credential-setup))

## Quick Start

### Windows

1. **Double-click** `launch.bat` (automatically runs in WSL)

Or manually:
```bash
wsl
cd /mnt/c/Users/bette/Desktop/projects-dashboard
pnpm install
pnpm dev
```

### Linux/Mac

```bash
chmod +x launch.sh
./launch.sh
```

Or:
```bash
pnpm install
pnpm dev
```

The dashboard will be available at **http://localhost:5180**

## Monorepo Structure

```
projects-dashboard/
├── src/                    # Dashboard React frontend
├── server/                 # Express backend API
├── projects/               # Your development projects (6 projects)
│   ├── google-calendar-clone/
│   ├── jira-wrapper/
│   ├── lastfm-clone/
│   ├── livejournal-clone/
│   ├── react-ts-templates/
│   └── task-manager/
├── pnpm-workspace.yaml     # Workspace configuration
├── turbo.json              # Turborepo configuration
├── launch.bat              # Windows launcher (runs in WSL)
├── launch.sh               # Linux/Mac launcher
└── package.json
```

## Available Scripts

### Development

```bash
pnpm dev              # Start dashboard (frontend + backend)
pnpm dev:all          # Start all projects in parallel
pnpm dev:frontend     # Start only frontend
pnpm dev:backend      # Start only backend
```

### Building

```bash
pnpm build            # Build dashboard only
pnpm build:all        # Build all projects in parallel (cached!)
```

### Quality Checks

```bash
pnpm lint             # Lint dashboard
pnpm lint:all         # Lint all projects
pnpm type-check       # Type-check dashboard
pnpm type-check:all   # Type-check all projects
pnpm verify           # Run build + lint + type-check on everything
```

### Dependencies

```bash
pnpm deps:check                # Check for outdated dependencies
pnpm deps:check-interactive    # Choose which dependencies to update
pnpm deps:update               # Update all dependencies
pnpm deps:update-minor         # Update only minor/patch versions (safer)
```

### Cleanup

```bash
pnpm clean            # Clean dashboard build artifacts
pnpm clean:all        # Clean all build artifacts
```

## How It Works

1. **Backend** scans the `projects/` directory for subdirectories
2. Each project is displayed as a card in the dashboard
3. Click "Launch Project" to open it (runs `pnpm dev` in that project)
4. Dashboard periodically checks if projects are running (via port detection)
5. **Turborepo** caches build results for 150x faster rebuilds

## Keyboard Navigation

- `↑` / `↓` - Navigate between projects
- `Enter` - Launch the focused project (if not running)

## Port Assignments

Each project has a dedicated port to avoid conflicts:

| Project | Port |
|---------|------|
| Dashboard Frontend | 5180 |
| Dashboard Backend | 3001 |
| google-calendar-clone | 5173 |
| jira-wrapper | 5174 |
| lastfm-clone | 5175 |
| livejournal-clone | 5176 |
| react-ts-templates | 5177 |
| task-manager | 5178 |

See `port_assignments.md` for details.

## Adding New Projects

See **`adding_projects.md`** for complete guide.

Quick steps:
1. Create project in `projects/`
2. Update `src/App.tsx` to add project to dashboard
3. Assign unique port in `vite.config.ts`
4. Run `pnpm install` from root
5. Done! Turborepo auto-detects it

## Managing Dependencies

See **`docs/monorepo_setup.md`** for complete guide.

Quick update workflow:
```bash
pnpm deps:check-interactive    # Choose what to update
pnpm install                   # Install updates
pnpm verify                    # Verify everything works
```

## Git Structure

This monorepo uses **multi-repo structure**:
- Dashboard has its own git repo
- Each project in `projects/` has its own independent git repo

See **`git_guide.md`** for complete guide.

## Performance Benefits

### pnpm (vs npm)
- ✅ 60-70% faster installs
- ✅ Saves GB of disk space (content-addressable storage)
- ✅ No phantom dependencies (strict isolation)

### Turborepo (vs manual builds)
- ✅ Parallel execution (all projects build at once)
- ✅ Smart caching (150x faster on cached builds)
- ✅ Only rebuilds changed projects

**Example:**
```bash
# First build: 15 seconds
pnpm build:all

# No changes: 0.2 seconds (75x faster!)
pnpm build:all

# Changed 1 project: 3 seconds (only rebuilds that one)
pnpm build:all
```

## Credential Setup

Several projects require API credentials (Google Calendar, Spotify, Atlassian/JIRA). Use our automated setup:

### Quick Setup (Recommended)

```bash
./setup-credentials.sh    # Interactive credential wizard
./test-credentials.sh     # Verify all credentials work
```

The setup wizard will:
- Guide you through getting credentials for each service
- Automatically populate your `.env` file
- Configure the Atlassian MCP server
- Backup existing credentials

See **`credential_setup.md`** for detailed manual setup instructions.

### What Credentials You Need

| Service | Required For | Setup Link |
|---------|--------------|------------|
| **Atlassian/JIRA** | MCP server, ticket access | [Get API Token](https://id.atlassian.com/manage-profile/security/api-tokens) |
| **Google API** | google-calendar-clone, task-manager | [Console](https://console.cloud.google.com/apis/credentials) |
| **Spotify API** | lastfm-clone, livejournal-clone | [Dashboard](https://developer.spotify.com/dashboard) |

## Documentation

| File | Description |
|------|-------------|
| **credential_setup.md** | Complete credential setup guide |
| **monorepo_setup.md** | Monorepo architecture and workflows |
| **adding_projects.md** | Guide for adding new projects |
| **git_guide.md** | Git structure and workflows |
| **port_assignments.md** | Port assignments for all projects |
| **graphiti-quickstart.md** | Graphiti + chronicle integration |

## WSL Performance

If you're on Windows, using WSL provides:
- 10x faster file system operations
- Better compatibility with development tools
- Rolldown (Rust bundler) officially recommends WSL

The `launch.bat` and `install-all.bat` scripts automatically run in WSL!

## Troubleshooting

### "pnpm: command not found"
You're in Windows terminal, not WSL. Either:
- Run `wsl` first, then commands
- Use `.\launch.bat` which handles WSL automatically

### API credentials not working
```bash
./test-credentials.sh    # Test all API connections
```
See `credential_setup.md` for troubleshooting specific services.

### Atlassian MCP server errors
1. Verify `.env` file exists with correct credentials
2. Check `.mcp.json` references environment variables
3. Restart Claude Code after updating `.env`
4. Test with: `curl -u "email:token" "https://site.atlassian.net/rest/api/3/myself"`

### Port already in use
Check `port_assignments.md` - each project has a unique port.

### Build fails after dependency update
```bash
pnpm clean:all     # Clean all build artifacts
pnpm install       # Reinstall dependencies
pnpm build:all     # Rebuild everything
```

### Turborepo cache issues
```bash
pnpm build:all --force    # Force rebuild, ignore cache
```

## Contributing

This is a personal project, but feel free to use it as a template for your own dashboard!

## License

Private project for personal use.

---

**Built with** ❤️ **and modern web tech**
- React 19
- pnpm workspaces
- Turborepo
- Rolldown (Vite)
- Tailwind CSS 4
