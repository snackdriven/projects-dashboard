# Memory Management Hooks

Custom React hooks for interacting with the chronicle MCP server.

## Overview

These hooks provide a complete interface for managing timeline events and key-value memories:

- **useMemoryData** - Fetch timeline events and KV memories
- **useMemoryMutations** - CRUD operations (create, update, delete)
- **useKeyboardShortcuts** - Keyboard navigation and shortcuts

## Installation

All hooks are exported from `@/hooks`:

```tsx
import { useMemoryData, useMemoryMutations, useKeyboardShortcuts } from '@/hooks';
```

---

## useMemoryData

Fetches timeline events and KV memories from the MCP server.

### Usage

```tsx
import { useMemoryData } from '@/hooks';

function MyComponent() {
  const {
    timelineEvents,
    timelineStats,
    kvMemories,
    isLoading,
    timelineError,
    kvError,
    refresh,
    refreshTimeline,
    refreshKV,
  } = useMemoryData({
    timelineDays: 7,      // Fetch last 7 days (default)
    autoFetch: true,      // Auto-fetch on mount (default)
    kvNamespace: 'dev',   // Optional namespace filter
  });

  return (
    <div>
      <h2>Timeline Events ({timelineEvents.length})</h2>
      {timelineEvents.map(event => (
        <div key={event.id}>{event.title}</div>
      ))}

      <button onClick={refresh}>Refresh All</button>
    </div>
  );
}
```

### Options

```typescript
interface UseMemoryDataOptions {
  timelineDays?: number;    // Number of days to fetch (default: 7)
  autoFetch?: boolean;      // Auto-fetch on mount (default: true)
  kvNamespace?: string;     // Filter KV memories by namespace
}
```

### Return Value

```typescript
interface UseMemoryDataReturn {
  // Timeline data
  timelineEvents: TimelineEvent[];
  timelineStats: { total: number; by_type: Record<string, number> } | null;

  // KV data
  kvMemories: KVMemory[];

  // Loading states
  isLoadingTimeline: boolean;
  isLoadingKV: boolean;
  isLoading: boolean;

  // Error states
  timelineError: Error | null;
  kvError: Error | null;

  // Actions
  refreshTimeline: () => Promise<void>;
  refreshKV: () => Promise<void>;
  refresh: () => Promise<void>;
}
```

---

## useMemoryMutations

Provides CRUD operations for timeline events and KV memories.

### Usage

```tsx
import { useMemoryMutations } from '@/hooks';

function MyComponent() {
  const {
    createTimelineEvent,
    updateTimelineEvent,
    deleteTimelineEvent,
    bulkDeleteTimeline,
    createKVMemory,
    updateKVMemory,
    deleteKVMemory,
    bulkDeleteKV,
    isLoading,
    error,
    clearError,
  } = useMemoryMutations();

  const handleCreateEvent = async () => {
    try {
      const eventId = await createTimelineEvent({
        timestamp: Date.now(),
        type: 'journal_entry',
        title: 'My first entry',
        metadata: { mood: 'happy' },
      });
      console.log('Created event:', eventId);
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    const result = await bulkDeleteTimeline(ids);
    console.log(`Deleted ${result.deleted}, failed ${result.failed}`);
  };

  return <button onClick={handleCreateEvent}>Create Event</button>;
}
```

### Return Value

```typescript
interface UseMemoryMutationsReturn {
  // Timeline mutations
  createTimelineEvent: (data: TimelineEventInput) => Promise<string>;
  updateTimelineEvent: (id: string, updates: TimelineEventUpdate) => Promise<TimelineEvent>;
  deleteTimelineEvent: (id: string) => Promise<boolean>;
  bulkDeleteTimeline: (ids: string[]) => Promise<BulkDeleteResult>;

  // KV mutations
  createKVMemory: (data: KVMemoryInput) => Promise<boolean>;
  updateKVMemory: (key: string, value: any, ttl?: number) => Promise<boolean>;
  deleteKVMemory: (key: string) => Promise<boolean>;
  bulkDeleteKV: (keys: string[]) => Promise<BulkDeleteResult>;

  // State
  isLoading: boolean;
  error: Error | null;
  clearError: () => void;
}
```

### Bulk Operations

Bulk operations process items in batches of 10 to avoid overwhelming the server:

```tsx
const result = await bulkDeleteTimeline(['id1', 'id2', 'id3']);
// result = { deleted: 3, failed: 0, errors: undefined }
```

---

## useKeyboardShortcuts

Adds keyboard shortcuts for common memory management actions.

### Usage

```tsx
import { useKeyboardShortcuts } from '@/hooks';

function MyComponent() {
  const searchRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcuts({
    onSearch: () => searchRef.current?.focus(),
    onNew: () => setShowModal(true),
    onDelete: handleBulkDelete,
    onClose: () => setShowModal(false),
    onRefresh: refresh,
    onToggleTab: () => setActiveTab(prev => prev === 'timeline' ? 'kv' : 'timeline'),
    onSelectAll: handleSelectAll,
    disabled: false,  // Optional: disable shortcuts
  });

  return <input ref={searchRef} type="text" />;
}
```

### Configuration

```typescript
interface KeyboardShortcutsConfig {
  onSearch?: () => void;      // Cmd/Ctrl+K: Focus search
  onNew?: () => void;         // Cmd/Ctrl+N: New item
  onDelete?: () => void;      // Delete: Bulk delete
  onClose?: () => void;       // Escape: Close modal
  onRefresh?: () => void;     // Cmd/Ctrl+R: Refresh
  onToggleTab?: () => void;   // Cmd/Ctrl+T: Toggle tab
  onSelectAll?: () => void;   // Cmd/Ctrl+A: Select all
  disabled?: boolean;         // Disable shortcuts
}
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl+K | Focus search input |
| Cmd/Ctrl+N | Create new item |
| Cmd/Ctrl+R | Refresh data |
| Cmd/Ctrl+T | Toggle between tabs |
| Cmd/Ctrl+A | Select all items |
| Delete/Backspace | Delete selected items |
| Escape | Close modal/clear selection |

### Input Field Behavior

- Shortcuts are automatically disabled when typing in input/textarea fields
- Escape key works in input fields to close modals
- This prevents accidental actions while typing

---

## Complete Example

See [MemoryManagerDemo.tsx](../components/memory/MemoryManagerDemo.tsx) for a complete integration example.

```tsx
import { useMemoryData, useMemoryMutations, useKeyboardShortcuts } from '@/hooks';
import { BulkActionsBar } from '@/components/memory';

function MemoryManager() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch data
  const { timelineEvents, kvMemories, refresh } = useMemoryData();

  // Mutations
  const { bulkDeleteTimeline, bulkDeleteKV } = useMemoryMutations();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => searchRef.current?.focus(),
    onDelete: handleBulkDelete,
    onRefresh: refresh,
  });

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    await bulkDeleteTimeline(ids);
    setSelectedIds(new Set());
    await refresh();
  }

  return (
    <div>
      <input ref={searchRef} type="text" placeholder="Search (Cmd+K)" />

      {/* Your timeline/KV list here */}

      <BulkActionsBar
        selectedCount={selectedIds.size}
        selectedItems={getSelectedItems()}
        type="timeline"
        onDelete={handleBulkDelete}
        onClearSelection={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
```

---

## MCP Integration

These hooks communicate with the chronicle MCP server via the backend API:

```
Frontend Hook � POST /api/mcp/chronicle/{tool_name} � MCP Server � SQLite DB
```

### Available MCP Tools

**Timeline:**
- `store_timeline_event`
- `get_timeline_range`
- `update_event`
- `delete_event`

**KV Memories:**
- `store_memory`
- `list_memories`
- `delete_memory`

See [chronicle documentation](../../projects/chronicle/README.md) for details.

---

## Error Handling

All hooks provide error states:

```tsx
const { error, clearError } = useMemoryMutations();

if (error) {
  return (
    <div className="error">
      {error.message}
      <button onClick={clearError}>Dismiss</button>
    </div>
  );
}
```

---

## Performance

- **Caching**: useMemoryData caches responses on the server side
- **Batching**: Bulk operations process in batches of 10
- **Parallel Fetching**: Timeline and KV data fetch in parallel
- **Debouncing**: Consider debouncing search/filter operations

---

## TypeScript

All hooks are fully typed. Import types from `@/types/memory`:

```tsx
import type {
  TimelineEvent,
  TimelineEventInput,
  KVMemory,
  BulkDeleteResult,
} from '@/types/memory';
```
