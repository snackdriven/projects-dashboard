# TypeScript Type System Architecture

**Status**: Wave 1 Complete - Foundation for Wave 2 Component Development

## Overview

A comprehensive, strict TypeScript type system for the compact list view with expandable details. All types are designed with type safety, extensibility, and developer experience in mind.

## File Structure

```
src/types/
├── project.ts       # Core project types, state discriminated unions
├── state.ts         # UI state management (expansion, navigation, filters)
├── api.ts           # API request/response types + converters
├── components.ts    # Component prop types for all Wave 2 components
└── index.ts         # Barrel export (single import entry point)
```

## Key Design Decisions

### 1. Discriminated Unions for State

```typescript
type ProjectState =
  | { state: 'stopped' }
  | { state: 'launching'; progress?: number }
  | { state: 'running'; since: Date; uptime: number }
  | { state: 'error'; message: string; code?: string };
```

**Why**: TypeScript can narrow types based on the `state` property, enabling type-safe pattern matching and preventing access to properties that don't exist in the current state.

**Example**:
```typescript
if (project.status.state === 'running') {
  // TypeScript knows 'since' and 'uptime' exist here
  console.log(project.status.uptime);
}
```

### 2. Readonly by Default

Most types use `readonly` modifiers to enforce immutability:

```typescript
export interface ProjectMetadata {
  readonly name: string;
  readonly path: string;
  readonly status: ProjectState;
  // ...
}
```

**Why**: Prevents accidental mutations, enforces functional programming patterns, makes data flow more predictable.

### 3. Type Guards for Runtime Checks

```typescript
export function isRunning(project: ProjectMetadata): project is ProjectMetadata & {
  status: { state: 'running'; since: Date; uptime: number };
} {
  return project.status.state === 'running';
}
```

**Why**: Combines runtime checking with compile-time type narrowing. After calling `isRunning()`, TypeScript knows the project has runtime-specific properties.

### 4. Separate API and Internal Types

API types use strings for dates (ISO 8601), internal types use Date objects:

```typescript
// API
interface ProjectMetadataResponse {
  readonly lastStarted?: string; // ISO timestamp
}

// Internal
interface ProjectMetadata {
  readonly lastStarted?: Date;
}
```

**Why**: HTTP APIs must use JSON-serializable types (strings), but internal code benefits from native Date objects. Converter functions handle the transformation.

### 5. Action-Based Architecture

```typescript
type ProjectAction =
  | { type: 'launch'; projectName: string }
  | { type: 'stop'; projectName: string }
  | { type: 'open'; projectName: string };

type ProjectActionHandler = (action: ProjectAction) => void | Promise<void>;
```

**Why**: Centralized action handling, easy to log/debug, simple to extend with new actions, works well with state management libraries.

## Type Categories

### Core Project Types (`project.ts`)

| Type | Purpose |
|------|---------|
| `Project` | Lightweight project reference (name + path) |
| `ProjectState` | Discriminated union for runtime state |
| `ProjectMetadata` | Complete project information |
| `GitStatus` | Git repository status |
| `RunningProject` | Utility type for projects in 'running' state |

**Key Features**:
- Type guards: `isRunning()`, `isError()`, `isLaunching()`, `isStopped()`
- Utility functions: `formatBytes()`, `formatUptime()`, `getMemoryTier()`

### State Management Types (`state.ts`)

| Type | Purpose |
|------|---------|
| `ExpansionState` | Manage which rows are expanded |
| `KeyboardNavState` | Keyboard focus management |
| `FilterState` | Search and filter state |
| `SortState` | Sort configuration |
| `ProjectListStore` | Root store type (for Zustand/Context) |

**Key Features**:
- Uses `Set<string>` for O(1) lookup performance
- Includes hook return types (`UseExpansionStateReturn`, etc.)
- Designed for future features (multi-select, bulk actions)

### API Types (`api.ts`)

| Type | Purpose |
|------|---------|
| `ProjectsResponse` | GET /api/projects |
| `ProjectMetadataResponse` | GET /api/projects/:name/metadata |
| `LaunchProjectResponse` | POST /api/projects/:name/launch |
| `StopProjectResponse` | POST /api/projects/:name/stop |

**Key Features**:
- Complete request/response types for all endpoints
- Type converters: `apiResponseToMetadata()`, `metadataToApiResponse()`
- Type-safe fetch wrapper: `apiFetch<T>()`
- Error handling: `ApiErrorResponse`, `isApiError()`

### Component Prop Types (`components.ts`)

Props for all Wave 2 components:

| Component | Props Interface |
|-----------|----------------|
| CompactList | `CompactListProps` |
| ProjectRow | `ProjectRowProps` |
| ProjectDetails | `ProjectDetailsProps` |
| ProjectStatusBadge | `ProjectStatusBadgeProps` |
| GitStatusIndicator | `GitStatusIndicatorProps` |
| MemoryUsageIndicator | `MemoryUsageIndicatorProps` |
| UptimeDisplay | `UptimeDisplayProps` |

**Key Features**:
- Consistent prop naming patterns
- Shared base props: `InteractiveComponentProps`
- Pre-defined animation variants for Framer Motion
- Responsive design types: `Breakpoint`, `LayoutConfig`

## Usage Examples

### Importing Types

```typescript
// Single barrel export
import type {
  ProjectMetadata,
  ProjectAction,
  ExpansionState,
  CompactListProps
} from '@/types';

// Or from specific files
import type { ProjectMetadata } from '@/types/project';
```

### Using Type Guards

```typescript
function renderProjectRow(project: ProjectMetadata) {
  if (isRunning(project)) {
    // TypeScript knows project.status.uptime exists
    return <UptimeDisplay uptime={project.status.uptime} />;
  }

  if (isError(project)) {
    // TypeScript knows project.status.message exists
    return <ErrorBadge message={project.status.message} />;
  }

  return <StoppedBadge />;
}
```

### Fetching with Type Safety

```typescript
const result = await apiFetch<ProjectMetadataResponse>(
  `/api/projects/${projectName}/metadata`
);

if (result.ok) {
  const metadata = apiResponseToMetadata(result.data);
  // metadata is now ProjectMetadata with Date objects
} else {
  console.error(result.error, result.code);
}
```

### Action Handling

```typescript
const handleAction: ProjectActionHandler = async (action) => {
  switch (action.type) {
    case 'launch':
      await launchProject(action.projectName);
      break;
    case 'stop':
      await stopProject(action.projectName);
      break;
    case 'open':
      window.open(`http://localhost:${getPort(action.projectName)}`);
      break;
  }
};
```

### Component Props

```typescript
function ProjectRow({
  project,
  isExpanded,
  isFocused,
  onToggleExpand,
  onAction
}: ProjectRowProps) {
  return (
    <div>
      <ProjectStatusBadge status={project.status} />
      {isRunning(project) && (
        <UptimeDisplay uptime={project.status.uptime} />
      )}
      <button onClick={() => onAction({ type: 'launch', projectName: project.name })}>
        Launch
      </button>
    </div>
  );
}
```

## Type Safety Features

### Strict Mode Enabled

All types are compiled with TypeScript strict mode:
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

### No `any` Types

Zero `any` types in the entire type system. Unknown types use `unknown` with proper type guards.

### Exhaustiveness Checking

Discriminated unions enable exhaustiveness checking:

```typescript
function convertApiStatus(status: ApiStatus): ProjectState {
  switch (status.state) {
    case 'stopped': return { state: 'stopped' };
    case 'launching': return { state: 'launching', progress: status.progress };
    case 'running': return { state: 'running', ... };
    case 'error': return { state: 'error', ... };
    default:
      const _exhaustive: never = status.state;
      throw new Error(`Unhandled state: ${_exhaustive}`);
  }
}
```

If you add a new state but forget to handle it, TypeScript will error at compile time.

## Future Extensibility

The type system is designed to accommodate future features:

### Already Designed (Not Implemented)

1. **Multi-select**: `SelectionState` interface ready
2. **Bulk actions**: `BulkActionsProps` defined
3. **Project logs**: `ProjectLogsResponse` API type ready
4. **Restart endpoint**: `RestartProjectRequest/Response` ready
5. **Animation tracking**: `AnimationState` interface ready
6. **Advanced polling**: `PollingState` with error retry logic

### Adding New States

To add a new project state (e.g., 'paused'):

1. Update `ProjectState` union in `project.ts`:
   ```typescript
   type ProjectState =
     | { state: 'stopped' }
     | { state: 'paused'; pausedAt: Date }  // NEW
     | { state: 'launching'; progress?: number }
     | { state: 'running'; since: Date; uptime: number }
     | { state: 'error'; message: string; code?: string };
   ```

2. Add type guard in `project.ts`:
   ```typescript
   export function isPaused(project: ProjectMetadata): project is ProjectMetadata & {
     status: { state: 'paused'; pausedAt: Date };
   } {
     return project.status.state === 'paused';
   }
   ```

3. Update API types in `api.ts`
4. Update converters in `api.ts`
5. TypeScript will error everywhere you need to handle the new state

### Adding New Actions

To add a new action (e.g., 'duplicate'):

1. Update `ProjectAction` in `components.ts`:
   ```typescript
   export type ProjectAction =
     | { type: 'launch'; projectName: string }
     | { type: 'duplicate'; projectName: string; newName: string }  // NEW
     | // ... existing actions
   ```

2. Handle in action handler:
   ```typescript
   const handleAction: ProjectActionHandler = async (action) => {
     switch (action.type) {
       case 'duplicate':
         await duplicateProject(action.projectName, action.newName);
         break;
       // ... existing cases
     }
   };
   ```

## Important Notes for Wave 2 Developers

### 1. Always Use Type Guards

Don't check states with string comparisons in components:

```typescript
// BAD
if (project.status.state === 'running') {
  console.log(project.status.uptime); // TypeScript doesn't narrow here
}

// GOOD
if (isRunning(project)) {
  console.log(project.status.uptime); // TypeScript knows this exists
}
```

### 2. Use API Converters

Always convert API responses to internal types:

```typescript
// BAD
const response = await fetch('/api/projects/foo/metadata');
const data = await response.json();
setProject(data); // API type, dates are strings

// GOOD
const result = await apiFetch<ProjectMetadataResponse>('/api/projects/foo/metadata');
if (result.ok) {
  const metadata = apiResponseToMetadata(result.data);
  setProject(metadata); // Internal type, dates are Date objects
}
```

### 3. Prefer Actions Over Direct Handlers

Use the action system instead of multiple prop functions:

```typescript
// BAD
<ProjectRow
  project={project}
  onLaunch={() => launchProject(project.name)}
  onStop={() => stopProject(project.name)}
  onOpen={() => openProject(project.name)}
/>

// GOOD
<ProjectRow
  project={project}
  onAction={handleAction}
/>
```

### 4. Leverage Readonly

Don't try to mutate props or state directly:

```typescript
// BAD
function updateProject(project: ProjectMetadata) {
  project.status = { state: 'running' }; // TypeScript error: readonly
}

// GOOD
function updateProject(project: ProjectMetadata): ProjectMetadata {
  return { ...project, status: { state: 'running', since: new Date(), uptime: 0 } };
}
```

### 5. Use Utility Functions

Don't re-implement formatting logic:

```typescript
// BAD
const memoryMB = (project.memory || 0) / (1024 * 1024);
const formatted = `${memoryMB.toFixed(1)} MB`;

// GOOD
import { formatBytes } from '@/types';
const formatted = formatBytes(project.memory || 0);
```

## Verification

Type system verified with:
- `pnpm type-check` - No errors
- Strict mode enabled
- No `any` types
- All exports properly typed

## Files Created

All files located in `/mnt/c/Users/bette/Desktop/projects-dashboard/src/types/`:

1. **project.ts** (191 lines)
   - Core project types
   - Discriminated union for ProjectState
   - Type guards and utility functions

2. **state.ts** (144 lines)
   - UI state management types
   - Store interfaces
   - Hook return types

3. **api.ts** (326 lines)
   - API request/response types
   - Type converters (API ↔ Internal)
   - Type-safe fetch wrapper

4. **components.ts** (228 lines)
   - Component prop types
   - Action system types
   - Animation variants
   - Responsive design types

5. **index.ts** (78 lines)
   - Barrel export for all types
   - Single import entry point

**Total**: 967 lines of strictly typed TypeScript

## Next Steps for Wave 2

Wave 2 component developers should:

1. Import types from `@/types`
2. Use provided type guards (`isRunning`, etc.)
3. Follow the action-based architecture
4. Leverage utility functions
5. Reference `components.ts` for prop types
6. Use `apiFetch()` for API calls
7. Convert API responses with `apiResponseToMetadata()`

The type system provides full IntelliSense support, compile-time safety, and a consistent API for all component development.
