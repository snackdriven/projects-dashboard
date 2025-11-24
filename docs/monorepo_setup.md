# Monorepo Setup Guide

Complete guide to the monorepo architecture and how to work with it effectively.

## Architecture Overview

This monorepo uses **pnpm workspaces** + **Turborepo** for optimal performance and developer experience.

### Why This Stack?

| Tool | Benefit | Performance Gain |
|------|---------|------------------|
| **pnpm** | Content-addressable storage, strict isolation | 60% faster installs, GB of saved disk space |
| **Turborepo** | Smart caching, parallel execution | 75-150x faster rebuilds |
| **Workspaces** | Shared dependencies, monorepo structure | Simplified dependency management |

## Workspace Structure

```
projects-dashboard/
├── packages/               # Shared packages (internal only)
│   ├── ui/                # React UI components
│   └── shared-config/     # TypeScript, ESLint, Tailwind configs
├── projects/               # Individual applications
│   ├── google-calendar-clone/
│   ├── jira-wrapper/
│   ├── lastfm-clone/
│   ├── livejournal-clone/
│   ├── react-ts-templates/
│   ├── task-manager/
│   └── quantified-life/
├── src/                    # Dashboard frontend
├── server/                 # Dashboard backend
├── pnpm-workspace.yaml     # Workspace configuration
└── turbo.json              # Build orchestration
```

## Package Management

### Installing Dependencies

**Root-level dependencies** (affects all projects):
```bash
pnpm add <package> --workspace-root
```

**Project-specific dependencies:**
```bash
pnpm add <package> --filter <project-name>

# Examples:
pnpm add axios --filter google-calendar-clone
pnpm add -D vitest --filter task-manager
```

**Shared package dependencies:**
```bash
pnpm add <package> --filter @projects-dashboard/ui
```

**Install all dependencies:**
```bash
pnpm install  # Always run from monorepo root
```

### Using Workspace Dependencies

Projects can depend on other workspace packages:

```json
{
  "dependencies": {
    "@projects-dashboard/ui": "workspace:*",
    "@projects-dashboard/shared-config": "workspace:*"
  }
}
```

The `workspace:*` protocol links to the local package.

## Turborepo Build Orchestration

### How Turborepo Works

Turborepo creates a **task graph** and:
1. Runs tasks in parallel when possible
2. Caches outputs for lightning-fast rebuilds
3. Only rebuilds changed projects

### Task Configuration (`turbo.json`)

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],           // Build dependencies first
      "outputs": ["dist/**"],            // Cache these outputs
      "env": ["NODE_ENV", "VITE_*"]      // Invalidate cache if these change
    },
    "type-check": {
      "outputs": ["*.tsbuildinfo"]       // Cache type-check results
    },
    "lint": {
      "outputs": [".eslintcache"]        // Cache lint results
    }
  }
}
```

### Running Tasks

**Single project:**
```bash
pnpm build --filter google-calendar-clone
pnpm lint --filter task-manager
```

**All projects:**
```bash
pnpm build:all   # Runs 'build' in all workspaces
pnpm lint:all    # Runs 'lint' in all workspaces
```

**Affected projects only:**
```bash
pnpm build:all --filter='...[origin/main]'  # Only changed projects
```

### Cache Behavior

**First run:**
```bash
pnpm build:all
# ✓ google-calendar-clone:build (5.2s)
# ✓ jira-wrapper:build (4.8s)
# ✓ task-manager:build (5.1s)
# Total: 15s
```

**Second run (no changes):**
```bash
pnpm build:all
# ✓ google-calendar-clone:build (cache hit)
# ✓ jira-wrapper:build (cache hit)
# ✓ task-manager:build (cache hit)
# Total: 0.2s  ← 75x faster!
```

**After changing one file:**
```bash
# Edit: projects/task-manager/src/App.tsx
pnpm build:all
# ✓ google-calendar-clone:build (cache hit)
# ✓ jira-wrapper:build (cache hit)
# ✓ task-manager:build (3.1s)  ← Only this rebuilds
# Total: 3.1s
```

### Cache Invalidation

Cache is invalidated when:
- Source files change
- Dependencies change
- Environment variables change
- Configuration files change (listed in `globalDependencies`)

**Force rebuild:**
```bash
pnpm build:all --force  # Ignore cache
```

## Shared Packages

### @projects-dashboard/ui

**Purpose:** Reusable React UI components

**Adding New Components:**

1. Create component file:
```tsx
// packages/ui/src/components/Input.tsx
export function Input({ ...props }) {
  return <input {...props} />;
}
```

2. Export in index:
```ts
// packages/ui/src/index.ts
export { Input } from './components/Input';
```

3. Build the package:
```bash
pnpm build --filter @projects-dashboard/ui
```

4. Use in projects:
```tsx
import { Input } from '@projects-dashboard/ui';
```

### @projects-dashboard/shared-config

**Purpose:** Centralized configuration files

**TypeScript Configs:**
- `typescript/base.json` - Base TypeScript settings
- `typescript/react.json` - React-specific settings

**Tailwind Configs:**
- `tailwind/base.js` - Shared Tailwind theme

**Usage in Projects:**
```json
// tsconfig.json
{
  "extends": "@projects-dashboard/shared-config/typescript/react.json"
}
```

## Development Workflows

### Starting Development

**Dashboard + Backend:**
```bash
pnpm dev  # Starts frontend (5180) + backend (3001)
```

**All Projects:**
```bash
pnpm dev:all  # Starts all 7+ projects in parallel
```

**Specific Projects:**
```bash
pnpm dev --filter google-calendar-clone --filter task-manager
```

### Building for Production

**Full Build:**
```bash
pnpm verify  # Build + Lint + Type-check everything
```

**Individual Project:**
```bash
pnpm build --filter task-manager
```

### Testing Changes

**After modifying shared package:**
```bash
# 1. Build the shared package
pnpm build --filter @projects-dashboard/ui

# 2. Test in a project
pnpm dev --filter google-calendar-clone
```

**After modifying configuration:**
```bash
# Configurations are picked up automatically
# But you may need to restart dev servers
pnpm dev:all
```

## Dependency Management

### Checking for Updates

```bash
pnpm deps:check  # Shows outdated dependencies across monorepo
```

### Updating Dependencies

**Interactive (recommended):**
```bash
pnpm deps:check-interactive  # Choose which to update
```

**Automatic:**
```bash
pnpm deps:update-minor  # Safe: only minor/patch
pnpm deps:update        # All updates (risky)
```

**After updating:**
```bash
pnpm install    # Install new versions
pnpm verify     # Ensure nothing broke
```

### Deduplicate Dependencies

pnpm automatically deduplicates, but you can check:

```bash
pnpm dedupe  # Remove duplicate packages
```

## Common Tasks

### Adding a New Project

1. **Create project directory:**
```bash
mkdir projects/my-new-project
cd projects/my-new-project
pnpm create vite . --template react-ts
```

2. **Update vite.config.ts with unique port:**
```ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5181,  // Next available port
  },
});
```

3. **Add shared dependencies:**
```json
{
  "dependencies": {
    "@projects-dashboard/ui": "workspace:*"
  }
}
```

4. **Install dependencies:**
```bash
pnpm install  # From monorepo root
```

5. **Add to dashboard:**
Edit `src/App.tsx` to include new project.

### Creating a Shared Package

1. **Create package directory:**
```bash
mkdir -p packages/my-package/src
```

2. **Create package.json:**
```json
{
  "name": "@projects-dashboard/my-package",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

3. **Add to workspace:**
Automatically detected via `packages/*` in `pnpm-workspace.yaml`

4. **Use in projects:**
```json
{
  "dependencies": {
    "@projects-dashboard/my-package": "workspace:*"
  }
}
```

### Running Commands in Multiple Projects

**Run in all projects:**
```bash
pnpm -r <command>  # -r = recursive

# Examples:
pnpm -r build
pnpm -r type-check
```

**Run in specific projects:**
```bash
pnpm --filter <pattern> <command>

# Examples:
pnpm --filter "google-*" build     # All projects starting with 'google-'
pnpm --filter "!task-manager" build # All except task-manager
```

## Troubleshooting

### "Module not found: @projects-dashboard/ui"

**Solution:**
```bash
# 1. Ensure package is built
pnpm build --filter @projects-dashboard/ui

# 2. Reinstall dependencies
pnpm install

# 3. Check package.json has workspace dependency
{
  "dependencies": {
    "@projects-dashboard/ui": "workspace:*"
  }
}
```

### "pnpm install" is slow

**Solution:**
```bash
# Clean cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install --frozen-lockfile
```

### Turborepo cache is stale

**Solution:**
```bash
pnpm build:all --force  # Force rebuild, ignore cache
```

### Port conflicts

**Solution:**
Check `PORT_ASSIGNMENTS.md` and update `vite.config.ts`:
```ts
server: {
  port: 5XXX,  // Use next available port
}
```

## Performance Optimization

### 1. Use Turborepo Effectively

- Don't use `--force` unless necessary
- Let Turborepo cache do its job
- Use `--filter` to run only what you need

### 2. Parallelize When Possible

```bash
# Good: Parallel execution
pnpm build:all

# Slower: Sequential execution
pnpm build --filter project1
pnpm build --filter project2
pnpm build --filter project3
```

### 3. Leverage Shared Packages

- Reduce code duplication
- Faster builds (shared code built once)
- Easier maintenance

### 4. Keep Dependencies Updated

```bash
pnpm deps:check-interactive  # Monthly maintenance
```

## Best Practices

1. **Always install from root:** `pnpm install` (not in subdirectories)
2. **Use workspace dependencies:** `"@projects-dashboard/ui": "workspace:*"`
3. **Build shared packages first:** When creating new components
4. **Leverage Turborepo cache:** Don't force rebuild unnecessarily
5. **Update dependencies together:** Use interactive mode
6. **Test after updates:** Run `pnpm verify`
7. **Assign unique ports:** Check PORT_ASSIGNMENTS.md
8. **Use shared configs:** Extend TypeScript/Tailwind configs

## Advanced Topics

### Remote Caching

Turborepo supports remote caching for team collaboration:

```json
{
  "remoteCache": {
    "enabled": true,
    "signature": true
  }
}
```

See [Turborepo Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching) for setup.

### Pipeline Visualization

Visualize task dependencies:

```bash
pnpm build:all --graph  # Generates graph
```

### Affected Projects

Only run tasks on changed projects:

```bash
pnpm build:all --filter='...[HEAD^1]'  # Since last commit
pnpm build:all --filter='...[origin/main]'  # Since main branch
```

## Summary

This monorepo setup provides:

- ✅ **Fast installs** - pnpm content-addressable storage
- ✅ **Fast builds** - Turborepo caching and parallelization
- ✅ **Shared code** - UI components and configs
- ✅ **Type safety** - Shared TypeScript configurations
- ✅ **Consistency** - Shared tooling across projects
- ✅ **Scalability** - Easy to add new projects
- ✅ **Developer experience** - Simple commands, clear structure

For more details, see:
- `CLAUDE.md` - Development guide
- `ADDING_PROJECTS.md` - Adding new projects
- `DEPENDENCY_MANAGEMENT.md` - Managing dependencies
- `PORT_ASSIGNMENTS.md` - Port allocation
