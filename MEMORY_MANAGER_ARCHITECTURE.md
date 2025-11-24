# Memory Manager Architecture

## Component Hierarchy

```
MemoryManagerPage.tsx
│
├─ State Management
│  ├─ activeTab: 'timeline' | 'kv'
│  ├─ timelineModalOpen: boolean
│  ├─ kvModalOpen: boolean
│  ├─ editingTimelineEvent: TimelineEvent | null
│  └─ editingKVMemory: KVMemory | null
│
├─ Data Hooks (Agent 4)
│  ├─ useMemoryData({ timelineDays: 7 })
│  │  └─ Returns: { timelineEvents, kvMemories, isLoading, refresh }
│  ├─ useMemoryMutations()
│  │  └─ Returns: { create, update, delete } for both types
│  └─ useKeyboardShortcuts({ onSearch, onNew, onRefresh, onToggleTab })
│
├─ Timeline Tab
│  └─ MemoryTable (Agent 1)
│     ├─ Props
│     │  ├─ data: timelineEvents
│     │  ├─ columns: timelineColumns
│     │  ├─ isLoading: boolean
│     │  └─ meta: { openEditModal, deleteEvent, updateEvent }
│     │
│     ├─ TableToolbar
│     │  ├─ Search Input (global filter)
│     │  ├─ Selected Count
│     │  └─ Add Event Button
│     │
│     ├─ Table Header (sticky)
│     │  └─ Sortable Column Headers
│     │
│     ├─ Virtual Rows (TanStack Virtual)
│     │  ├─ Select Checkbox
│     │  ├─ BadgeCell (type) - Agent 2
│     │  ├─ InlineEditCell (title) - Agent 2
│     │  ├─ DateCell (timestamp) - Agent 2
│     │  ├─ InlineEditCell (namespace) - Agent 2
│     │  └─ ActionsCell (edit, delete) - Agent 2
│     │
│     └─ Footer
│        └─ Row Count
│
├─ KV Store Tab
│  └─ MemoryTable (Agent 1)
│     ├─ Props
│     │  ├─ data: kvMemories
│     │  ├─ columns: kvColumns
│     │  ├─ isLoading: boolean
│     │  └─ meta: { openEditModal, deleteEvent, updateEvent }
│     │
│     └─ (Similar structure to Timeline Tab)
│
├─ Timeline Event Modal (Agent 3)
│  └─ FullFormModal
│     └─ TimelineEventForm
│        ├─ Type Selector
│        ├─ Timestamp Input
│        ├─ Title Input
│        ├─ Namespace Input
│        ├─ Metadata JSON Editor
│        └─ Submit/Cancel Buttons
│
└─ KV Memory Modal (Agent 3)
   └─ FullFormModal
      └─ KVMemoryForm
         ├─ Key Input
         ├─ Value JSON Editor
         ├─ Namespace Input
         ├─ TTL Input
         ├─ TTL Unit Selector
         └─ Submit/Cancel Buttons
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     MCP Server (Backend)                     │
│                    memory-shack endpoints                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Requests
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  useMemoryData Hook (Agent 4)                │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │  Timeline   │  │ KV Memories │  │ Loading States   │   │
│  │   Events    │  │             │  │   & Refresh      │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Provides Data
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              MemoryManagerPage (Main Component)              │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Tab Navigation                        │  │
│  │         [Timeline Events] [KV Store]                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   MemoryTable                          │  │
│  │                                                        │  │
│  │   Receives:                                           │  │
│  │   - data (timelineEvents or kvMemories)              │  │
│  │   - columns (column definitions)                     │  │
│  │   - meta (handlers for cells)                        │  │
│  │   - isLoading                                        │  │
│  │                                                        │  │
│  │   ┌──────────────────────────────────────────────┐   │  │
│  │   │         Virtual Scrolling Rows               │   │  │
│  │   │                                              │   │  │
│  │   │  Row 1: [☑] [Badge] [Edit] [Date] [Edit] [⚙]│   │  │
│  │   │  Row 2: [☐] [Badge] [Edit] [Date] [Edit] [⚙]│   │  │
│  │   │  Row 3: [☐] [Badge] [Edit] [Date] [Edit] [⚙]│   │  │
│  │   │  ...                                         │   │  │
│  │   └──────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│                  ┌───────────┴───────────┐                  │
│                  │                       │                  │
│                  ▼                       ▼                  │
│       ┌──────────────────┐   ┌──────────────────┐          │
│       │  Cell Components │   │  Modal Components│          │
│       │   (Agent 2)      │   │   (Agent 3)      │          │
│       │                  │   │                  │          │
│       │ • BadgeCell      │   │ • FullFormModal  │          │
│       │ • DateCell       │   │ • TimelineForm   │          │
│       │ • InlineEditCell │   │ • KVMemoryForm   │          │
│       │ • ActionsCell    │   │                  │          │
│       └──────────────────┘   └──────────────────┘          │
│                 │                       │                   │
│                 └───────────┬───────────┘                   │
│                             ▼                               │
│                 ┌───────────────────────┐                   │
│                 │  Handler Functions    │                   │
│                 │                       │                   │
│                 │ • handleEditEvent     │                   │
│                 │ • handleDeleteEvent   │                   │
│                 │ • handleSubmitEvent   │                   │
│                 └───────────────────────┘                   │
│                             │                               │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              useMemoryMutations Hook (Agent 4)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  CREATE  │  │  UPDATE  │  │  DELETE  │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Requests
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     MCP Server (Backend)                     │
│                    memory-shack endpoints                    │
└─────────────────────────────────────────────────────────────┘
```

## Agent Responsibilities

### Agent 1: Table Core
- ✅ MemoryTable.tsx - Main table component
- ✅ TableToolbar.tsx - Search and actions toolbar
- ✅ Virtual scrolling with TanStack Virtual
- ✅ Sorting with TanStack Table
- ✅ Row selection state management

### Agent 2: Cell Components
- ✅ BadgeCell.tsx - Colored type badges
- ✅ DateCell.tsx - Formatted timestamps with tooltips
- ✅ InlineEditCell.tsx - Click-to-edit with save/cancel
- ✅ ActionsCell.tsx - Edit/delete buttons with confirmation

### Agent 3: Modal & Forms
- ✅ FullFormModal.tsx - Reusable modal wrapper
- ✅ TimelineEventForm.tsx - Timeline event creation/editing
- ✅ KVMemoryForm.tsx - KV memory creation/editing
- ✅ JSONEditor.tsx - JSON editing with syntax highlighting

### Agent 4: Utilities & Hooks
- ✅ useMemoryData.ts - Data fetching hook
- ✅ useMemoryMutations.ts - CRUD operations hook
- ✅ useKeyboardShortcuts.ts - Global keyboard shortcuts
- ✅ memorySchemas.ts - Zod validation schemas

## Communication Patterns

### Table → Cells (via props spread)
```tsx
cell: (props) => <BadgeCell {...props} />
// Props include: getValue, row, column, table
```

### Cells → Handlers (via table.options.meta)
```tsx
table.options.meta?.openEditModal(row.original)
table.options.meta?.deleteEvent(id)
table.options.meta?.updateEvent(id, data)
```

### Forms → Handlers (via callbacks)
```tsx
<TimelineEventForm
  initialData={formData}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

### Handlers → Hooks (direct calls)
```tsx
await updateTimelineEvent(id, data)
refresh()
```

## State Management Strategy

**Local State (useState):**
- Modal open/close states
- Currently editing items
- Active tab selection

**Hook State:**
- Data fetching (timelineEvents, kvMemories)
- Loading states
- Error states

**Table State (TanStack Table):**
- Sorting
- Row selection
- Global filter
- Column visibility

## Type Safety Flow

```
TypeScript Types (memory.ts)
         ↓
Zod Schemas (memorySchemas.ts)
         ↓
Form Data (React Hook Form)
         ↓
Mutation Hooks (useMemoryMutations)
         ↓
API Requests (typed fetch)
         ↓
MCP Server (validated input)
```

## Performance Optimizations

1. **Virtual Scrolling** - Only render visible rows
2. **Memoization** - React.memo on cell components (potential)
3. **Debounced Search** - Reduce filter computations
4. **Lazy Modals** - Only mount when open
5. **Optimistic Updates** - Update UI before server response (potential)

## Error Handling Strategy

1. **Form Validation** - Zod schemas with error messages
2. **Mutation Errors** - Try-catch in handlers, alert user
3. **Inline Edit Errors** - Rollback on failure
4. **Delete Confirmation** - Prevent accidental deletions
5. **Loading States** - Show spinners during operations

## Accessibility Features

- ✅ Keyboard navigation (arrow keys, tab)
- ✅ ARIA labels on checkboxes
- ✅ Focus management in modals
- ✅ Semantic HTML
- ✅ Screen reader friendly
