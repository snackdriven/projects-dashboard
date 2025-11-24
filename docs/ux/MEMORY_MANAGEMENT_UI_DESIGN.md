# Memory-Shack Management UI - Design Document

**Status:** Planning
**Created:** 2025-01-23
**Last Updated:** 2025-01-23
**Recommended Approach:** Option 3 - Hybrid Inline + Slide-Over

---

## Table of Contents

1. [Problem Analysis](#problem-analysis)
2. [Solution Options](#solution-options)
3. [Recommended Solution](#recommended-solution)
4. [Implementation Details](#implementation-details)
5. [Success Metrics](#success-metrics)
6. [Risk Mitigation](#risk-mitigation)
7. [Implementation Roadmap](#implementation-roadmap)

---

## Problem Analysis

### Core Challenge

Design a comprehensive UI for managing memory-shack's dual-store architecture:

**1. Timeline Events** - Temporal data with:
- Required: `timestamp`, `type`
- Optional: `title`, `namespace`, `metadata`
- Relationships: Events can have `full_data` (lazy-loaded)

**2. Key-Value Memories** - Persistent storage with:
- Required: `key`, `value`
- Optional: `namespace`, `ttl` (expiration)
- Features: Pattern matching, search, bulk operations

### Key Constraints

1. **Dual Data Models**: Two fundamentally different schemas requiring distinct UX
2. **Existing Dashboard**: Must integrate into projects-dashboard without disrupting current UX
3. **Tech Stack**: React 19, TypeScript, Tailwind 4, Framer Motion, Zustand
4. **MCP Integration**: All operations via MCP tools (network latency considerations)
5. **Developer Users**: Power users who value efficiency over hand-holding
6. **Accessibility**: WCAG 2.1 AA compliance required

### Critical Success Factors

- **Discoverability**: Users can find CRUD operations intuitively
- **Efficiency**: Minimal clicks for common operations
- **Error Prevention**: Validation before destructive actions
- **Feedback**: Clear confirmation of success/failure
- **Performance**: Sub-second response for all operations
- **Flexibility**: Support both single-item and bulk operations

---

## Solution Options

### Option 1: Unified Modal System (Quick Win)

**Description:** Single page at `/memory` with split view (Timeline | KV) and modal dialogs for all CRUD operations.

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Memory Manager                    [+ Add] [⚙]  │
├──────────────┬──────────────────────────────────┤
│ [Timeline]   │  Search: [___________] [Filters] │
│ [KV Store]   │                                   │
│              │  ┌─────────────────────────────┐ │
│ Filters:     │  │ Event 1  | jira_ticket      │ │
│ □ JIRA       │  │ 2025-01-23 14:30  [Edit][Del]│ │
│ □ Spotify    │  ├─────────────────────────────┤ │
│ □ Calendar   │  │ Event 2  | calendar_event   │ │
│              │  │ 2025-01-23 09:00  [Edit][Del]│ │
│ Date Range:  │  └─────────────────────────────┘ │
│ [______]     │                                   │
│              │  Showing 1-20 of 150   [1][2][3] │
└──────────────┴──────────────────────────────────┘
```

**Modal for Add/Edit:**
```
┌───────────────────────────────────────┐
│  Add Timeline Event              [×]  │
├───────────────────────────────────────┤
│  Event Type: [jira_ticket      ▼]     │
│  Timestamp:  [2025-01-23 14:30  📅]   │
│  Title:      [Fix login bug         ] │
│  Namespace:  [dev                   ] │
│                                       │
│  Metadata (JSON):                     │
│  ┌─────────────────────────────────┐ │
│  │ {                               │ │
│  │   "project": "dashboard",       │ │
│  │   "priority": "high"            │ │
│  │ }                               │ │
│  └─────────────────────────────────┘ │
│                                       │
│     [Cancel]              [Create]   │
└───────────────────────────────────────┘
```

**Pros:**
- ✅ Simple navigation - one page, no routing complexity
- ✅ Fast implementation - 2-3 days
- ✅ Familiar pattern - modals are intuitive
- ✅ Keyboard friendly - Esc to close, Tab navigation
- ✅ Mobile friendly - modals adapt well
- ✅ Less code - no route management

**Cons:**
- ❌ Limited space - complex forms feel cramped
- ❌ Context switching - modal hides main list
- ❌ Multi-step flows - harder to implement wizards
- ❌ Deep linking - can't link to specific edit modal
- ❌ Browser history - back button doesn't work intuitively

**Risk Assessment:** **LOW**

---

### Option 2: Dedicated CRUD Pages (Power Tool)

**Description:** Separate pages for each operation with full-screen forms and rich editing capabilities.

**Routing:**
```
/memory                    → List view (Timeline + KV tabs)
/memory/timeline/new       → Add timeline event
/memory/timeline/:id/edit  → Edit timeline event
/memory/kv/new             → Add KV memory
/memory/kv/:key/edit       → Edit KV memory
```

**Layout (List View):**
```
┌─────────────────────────────────────────────────┐
│  ← Dashboard                    Memory Manager  │
├─────────────────────────────────────────────────┤
│  [Timeline Events] [KV Memories]                │
│                                                  │
│  [+ New Event]  Search: [________]  [Filters ▼] │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ PROJECT-123 • Fix login bug              │  │
│  │ jira_ticket • 2025-01-23 14:30           │  │
│  │ Namespace: dev                    [Edit] │  │
│  ├──────────────────────────────────────────┤  │
│  │ Daily standup meeting                    │  │
│  │ calendar_event • 2025-01-23 09:00        │  │
│  │                                   [Edit] │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Layout (Edit Page):**
```
┌─────────────────────────────────────────────────┐
│  ← Back to Memory Manager                       │
├─────────────────────────────────────────────────┤
│  Edit Timeline Event: PROJECT-123               │
│                                                  │
│  Event Type                                     │
│  [jira_ticket                            ▼]     │
│                                                  │
│  Timestamp                                      │
│  [2025-01-23]  [14:30]  [UTC-5 ▼]              │
│                                                  │
│  Title                                          │
│  [Fix login bug                              ]  │
│                                                  │
│  Namespace (optional)                           │
│  [dev                                        ]  │
│                                                  │
│  Metadata (JSON)                                │
│  ┌────────────────────────────────────────────┐ │
│  │ {                                          │ │
│  │   "project": "dashboard",                  │ │
│  │   "priority": "high",                      │ │
│  │   "assignee": "john@example.com"           │ │
│  │ }                                          │ │
│  │                                            │ │
│  │ [✓] Valid JSON                             │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  [Delete Event]         [Cancel]  [Save Changes]│
└─────────────────────────────────────────────────┘
```

**Pros:**
- ✅ More space - complex forms feel natural
- ✅ Deep linking - can share edit URLs
- ✅ Browser history - back button works
- ✅ Multi-step - easy to implement wizards
- ✅ Focused UI - less distraction
- ✅ Better validation - room for inline error messages

**Cons:**
- ❌ More navigation - extra clicks to edit
- ❌ Context loss - can't see list while editing
- ❌ More code - route management, page components
- ❌ Slower - full page transitions
- ❌ Mobile - more scrolling on small screens

**Risk Assessment:** **MEDIUM**

---

### Option 3: Hybrid Inline + Slide-Over ⭐ RECOMMENDED

**Description:** Combines best of both: inline editing for quick changes, slide-over panel for detailed editing, modals for confirmations.

**Interaction Patterns:**

1. **Quick Edit (Inline):**
   - Click value → Inline editor appears
   - Edit → Auto-save on blur or Enter
   - Ideal for: title, namespace, simple values

2. **Full Edit (Slide-over):**
   - Click "Edit" button → Slide-over from right
   - Full form with all fields
   - Ideal for: metadata, complex JSON, bulk fields

3. **Create (Slide-over):**
   - Click "+ Add" → Slide-over with empty form
   - Can stay open while viewing list

4. **Delete (Modal):**
   - Click "Delete" → Confirmation modal
   - Prevents accidental deletions

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  Memory Manager         [+ Add Event ▼] [+ Add Memory]   │
├───────────┬──────────────────────────────────────────────┤
│ Timeline  │  Search: [_________]  Filters: [All Types ▼] │
│ KV Store  │                                               │
│           │  ┌────────────────────────────────────────┐  │
│ Filters:  │  │ PROJECT-123                     [Edit] │  │
│ Types:    │  │ jira_ticket • 2025-01-23 14:30  [Del]  │  │
│ ☑ JIRA    │  │ Title: Fix login bug ←(inline editable)│  │
│ ☑ Spotify │  │ Namespace: dev                         │  │
│ □ Calendar│  ├────────────────────────────────────────┤  │
│           │  │ Daily standup                   [Edit] │  │
│ Date:     │  │ calendar_event • 2025-01-23 09:00      │  │
│ Last 7d ▼ │  └────────────────────────────────────────┘  │
│           │                                               │
│ [Export]  │  Showing 1-20 of 150  [1] [2] [3]            │
└───────────┴──────────────────────────────────────────────┘
```

**Slide-over Panel (Edit):**
```
┌─────────────────────────────────────┐
│  Edit Timeline Event           [×]  │
├─────────────────────────────────────┤
│  Event Type                         │
│  [jira_ticket              ▼]       │
│                                     │
│  Timestamp                          │
│  [2025-01-23] [14:30]               │
│                                     │
│  Title                              │
│  [Fix login bug                  ]  │
│                                     │
│  Namespace                          │
│  [dev                            ]  │
│                                     │
│  ─── Advanced ───                   │
│                                     │
│  Metadata (JSON)                    │
│  ┌───────────────────────────────┐ │
│  │ {                             │ │
│  │   "project": "dashboard",     │ │
│  │   "priority": "high"          │ │
│  │ }                             │ │
│  │                               │ │
│  │ ✓ Valid JSON                  │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Delete Event]                     │
│                                     │
│  [Cancel]            [Save Changes] │
└─────────────────────────────────────┘
```

**Pros:**
- ✅ Best of both - Quick edits + detailed forms
- ✅ Context maintained - List visible while editing
- ✅ Progressive disclosure - Simple → Advanced
- ✅ Modern UX - Slide-overs are trendy (Gmail, Linear, Notion)
- ✅ Keyboard friendly - Focus management works well
- ✅ Mobile friendly - Slide-over becomes full screen
- ✅ Flexible - Can add wizards, multi-step flows

**Cons:**
- ❌ More complex - Multiple interaction patterns
- ❌ Learning curve - Users need to discover patterns
- ❌ Implementation time - 3-4 days
- ❌ State complexity - Managing inline + panel state

**Risk Assessment:** **MEDIUM**

**Why Recommended:**
- Best UX for both quick edits and complex forms
- Modern, familiar pattern (used by Gmail, Linear, Notion)
- Maintains context while editing
- Mobile-friendly with responsive design
- Accessible with proper ARIA labels and keyboard shortcuts

---

### Option 4: Table-First with Row Actions (Data-Heavy)

**Description:** Spreadsheet-like interface optimized for viewing large datasets with powerful filtering and inline actions.

**Layout:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  Memory Manager                          [+ Add] [Export] [Bulk Actions] │
├──────────────────────────────────────────────────────────────────────────┤
│  [Timeline Events] [KV Memories]                                         │
│                                                                           │
│  Search: [__________]  Type: [All ▼]  Date: [Last 7d ▼]  Namespace: [▼] │
│                                                                           │
│  ┌───┬──────────┬──────────────┬────────────┬───────────┬──────────┐    │
│  │ ☐ │ Type     │ Title        │ Timestamp  │ Namespace │ Actions  │    │
│  ├───┼──────────┼──────────────┼────────────┼───────────┼──────────┤    │
│  │ ☐ │ JIRA     │ Fix login    │ 2025-01-23 │ dev       │ [E][D][↓]│    │
│  │   │          │ bug          │ 14:30      │           │          │    │
│  ├───┼──────────┼──────────────┼────────────┼───────────┼──────────┤    │
│  │ ☐ │ Calendar │ Daily        │ 2025-01-23 │ -         │ [E][D][↓]│    │
│  │   │          │ standup      │ 09:00      │           │          │    │
│  └───┴──────────┴──────────────┴────────────┴───────────┴──────────┘    │
│                                                                           │
│  Showing 1-100 of 1,247  [← Prev] [Next →]                              │
└──────────────────────────────────────────────────────────────────────────┘
```

**Pros:**
- ✅ Data density - See many items at once
- ✅ Sorting - Click column headers
- ✅ Filtering - Powerful multi-column filters
- ✅ Bulk operations - Select multiple rows
- ✅ Excel-like - Familiar to data users

**Cons:**
- ❌ Mobile unfriendly - Tables don't adapt well
- ❌ Limited editing - Inline editing is tricky
- ❌ Visual complexity - Can feel overwhelming
- ❌ Accessibility - Screen readers struggle with tables

**Risk Assessment:** **MEDIUM**

**Use Case:** Best for power users managing hundreds of events, not recommended as primary interface.

---

## Recommended Solution: Option 3 Details

### Component Structure

```
src/pages/
  └── MemoryManagerPage.tsx           # Main page component

src/components/memory/
  ├── TimelineList.tsx                # Timeline events list
  │   └── TimelineEventCard.tsx       # Individual event card
  │       ├── InlineEdit.tsx          # Inline editing component
  │       └── QuickActions.tsx        # Edit/delete buttons
  │
  ├── KVList.tsx                      # KV memories list
  │   └── KVMemoryCard.tsx           # Individual memory card
  │       ├── InlineEdit.tsx
  │       └── QuickActions.tsx
  │
  ├── SlideOverPanel.tsx              # Reusable slide-over
  │   ├── TimelineEventForm.tsx       # Full timeline form
  │   └── KVMemoryForm.tsx           # Full KV form
  │
  ├── DeleteConfirmModal.tsx          # Delete confirmation
  ├── BulkActionsBar.tsx             # Bulk operations
  └── SearchFilterPanel.tsx           # Search and filters

src/components/ui/
  ├── SlideOver.tsx                   # Base slide-over component
  ├── InlineEditor.tsx                # Generic inline editor
  ├── JSONEditor.tsx                  # JSON editor (Monaco/CodeMirror)
  └── MetadataEditor.tsx              # Metadata editor
```

### State Management (Zustand)

```typescript
interface MemoryManagerStore {
  // Data
  timeline: TimelineEvent[];
  kvStore: KVMemory[];

  // UI State
  slideOver: {
    open: boolean;
    mode: 'create' | 'edit';
    type: 'timeline' | 'kv';
    itemId?: string;
  };

  // Filters
  filters: {
    searchQuery: string;
    typeFilter: string[];
    dateRange: { start: string; end: string };
    namespaceFilter: string[];
  };

  // Selection
  selectedIds: Set<string>;

  // Actions
  openSlideOver: (mode, type, id?) => void;
  closeSlideOver: () => void;
  toggleSelection: (id: string) => void;

  // CRUD operations
  createTimelineEvent: (event) => Promise<void>;
  updateTimelineEvent: (id, updates) => Promise<void>;
  deleteTimelineEvent: (id) => Promise<void>;

  createKVMemory: (memory) => Promise<void>;
  updateKVMemory: (key, updates) => Promise<void>;
  deleteKVMemory: (key) => Promise<void>;

  // Bulk operations
  bulkDeleteTimeline: (ids) => Promise<void>;
  bulkDeleteKV: (keys) => Promise<void>;
}
```

---

## Implementation Details

### 1. SlideOver Base Component

```typescript
interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function SlideOver({ open, onClose, title, size = 'md', children }: SlideOverProps) {
  return (
    <Transition show={open}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className={cn(
        "fixed inset-y-0 right-0 flex max-w-full",
        size === 'sm' && 'w-96',
        size === 'md' && 'w-[32rem]',
        size === 'lg' && 'w-[48rem]'
      )}>
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="flex flex-col bg-white shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} aria-label="Close">
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {children}
          </div>
        </motion.div>
      </div>
    </Transition>
  );
}
```

### 2. Timeline Event Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const timelineEventSchema = z.object({
  timestamp: z.string().datetime().or(z.date()),
  type: z.string().min(1, 'Event type is required'),
  title: z.string().optional(),
  namespace: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

type TimelineEventFormData = z.infer<typeof timelineEventSchema>;

interface TimelineEventFormProps {
  mode: 'create' | 'edit';
  initialData?: TimelineEvent;
  onSubmit: (data: TimelineEventFormData) => Promise<void>;
  onCancel: () => void;
}

export function TimelineEventForm({ mode, initialData, onSubmit, onCancel }: TimelineEventFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TimelineEventFormData>({
    resolver: zodResolver(timelineEventSchema),
    defaultValues: initialData || {
      timestamp: new Date().toISOString(),
      type: '',
      title: '',
      namespace: '',
      metadata: {},
    },
  });

  const [metadataJSON, setMetadataJSON] = useState(
    JSON.stringify(initialData?.metadata || {}, null, 2)
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Event Type */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Event Type <span className="text-red-500">*</span>
        </label>
        <select
          {...register('type')}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Select type...</option>
          <option value="jira_ticket">JIRA Ticket</option>
          <option value="spotify_play">Spotify Play</option>
          <option value="calendar_event">Calendar Event</option>
          <option value="journal_entry">Journal Entry</option>
          <option value="github_commit">GitHub Commit</option>
        </select>
        {errors.type && (
          <p className="mt-1 text-sm text-red-500">{errors.type.message}</p>
        )}
      </div>

      {/* Timestamp */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Timestamp <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          {...register('timestamp')}
          className="w-full px-3 py-2 border rounded-lg"
        />
        {errors.timestamp && (
          <p className="mt-1 text-sm text-red-500">{errors.timestamp.message}</p>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Title <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          {...register('title')}
          placeholder="Brief description..."
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      {/* Namespace */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Namespace <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          {...register('namespace')}
          placeholder="e.g., dev, prod, personal"
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      {/* Metadata (JSON) */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Metadata <span className="text-gray-400">(JSON)</span>
        </label>
        <JSONEditor
          value={metadataJSON}
          onChange={setMetadataJSON}
          height="200px"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        {mode === 'edit' && (
          <button
            type="button"
            className="text-red-600 hover:text-red-700"
            onClick={() => {/* Delete handler */}}
          >
            Delete Event
          </button>
        )}
        <div className="flex gap-3 ml-auto">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Event' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
}
```

### 3. Inline Editor Component

```typescript
interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  type?: 'text' | 'number' | 'date';
  placeholder?: string;
  className?: string;
}

export function InlineEdit({ value, onSave, type = 'text', placeholder, className }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      setEditValue(value); // Rollback on error
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <span
        onClick={() => setIsEditing(true)}
        className={cn(
          'cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded',
          'border border-transparent hover:border-gray-300',
          className
        )}
        role="button"
        tabIndex={0}
      >
        {value || <span className="text-gray-400 italic">{placeholder || 'Click to edit'}</span>}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type={type}
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      disabled={isSaving}
      className={cn(
        'px-1 py-0.5 border border-blue-500 rounded',
        'focus:outline-none focus:ring-2 focus:ring-blue-500',
        isSaving && 'opacity-50 cursor-wait',
        className
      )}
    />
  );
}
```

### 4. Event Card with Inline Editing

```typescript
interface TimelineEventCardProps {
  event: TimelineEvent;
  onUpdate: (id: string, updates: Partial<TimelineEvent>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenFullEdit: (id: string) => void;
}

export function TimelineEventCard({ event, onUpdate, onDelete, onOpenFullEdit }: TimelineEventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* Main content */}
        <div className="flex-1">
          {/* Title - Inline editable */}
          <div className="flex items-center gap-2">
            <Badge variant="blue">{event.type}</Badge>
            <InlineEdit
              value={event.title || ''}
              onSave={(newTitle) => onUpdate(event.id, { title: newTitle })}
              placeholder="No title"
              className="text-lg font-medium"
            />
          </div>

          {/* Metadata */}
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              <span>{formatTimestamp(event.timestamp)}</span>
            </div>
            {event.namespace && (
              <div className="flex items-center gap-2">
                <FolderIcon className="w-4 h-4" />
                <InlineEdit
                  value={event.namespace}
                  onSave={(newNS) => onUpdate(event.id, { namespace: newNS })}
                  placeholder="No namespace"
                />
              </div>
            )}
          </div>

          {/* Expandable metadata */}
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              {isExpanded ? 'Hide' : 'Show'} metadata ({Object.keys(event.metadata).length} fields)
            </button>
          )}

          {isExpanded && (
            <div className="mt-2 p-2 bg-gray-50 rounded border">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <IconButton
            icon={<EditIcon />}
            onClick={() => onOpenFullEdit(event.id)}
            tooltip="Edit in full form"
          />
          <IconButton
            icon={<TrashIcon />}
            onClick={() => onDelete(event.id)}
            tooltip="Delete event"
            variant="danger"
          />
        </div>
      </div>
    </Card>
  );
}
```

### 5. Validation Schemas (Zod)

```typescript
// utils/validation.ts
import { z } from 'zod';

export const timelineEventSchema = z.object({
  timestamp: z.coerce.date().or(z.string().datetime()),
  type: z.string().min(1, 'Event type is required'),
  title: z.string().max(200, 'Title too long').optional(),
  namespace: z
    .string()
    .regex(/^[a-z0-9_-]+$/, 'Invalid namespace format')
    .optional(),
  metadata: z.record(z.any()).optional(),
});

export const kvMemorySchema = z.object({
  key: z
    .string()
    .min(1, 'Key is required')
    .regex(/^[a-zA-Z0-9:_-]+$/, 'Invalid key format'),
  value: z.any().refine(
    (val) => {
      try {
        JSON.stringify(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Value must be JSON serializable' }
  ),
  namespace: z
    .string()
    .regex(/^[a-z0-9_-]+$/, 'Invalid namespace format')
    .optional(),
  ttl: z.number().positive('TTL must be positive').int().optional(),
});

// Real-time validation helpers
export function validateJSON(str: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(str);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
```

### 6. Keyboard Shortcuts

```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Cmd/Ctrl + K: Open search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      focusSearch();
    }

    // Cmd/Ctrl + N: New event
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      openSlideOver('create', 'timeline');
    }

    // Esc: Close slide-over
    if (e.key === 'Escape' && slideOver.open) {
      closeSlideOver();
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [slideOver.open]);
```

### 7. Accessibility Features

```typescript
// ARIA labels
<button
  aria-label={`Edit ${event.title || 'timeline event'}`}
  aria-describedby={`event-${event.id}-description`}
  onClick={() => openFullEdit(event.id)}
>
  <EditIcon aria-hidden="true" />
</button>

// Focus management
const focusTrapRef = useFocusTrap(slideOver.open);

// Screen reader announcements
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {announcement}
</div>

// Keyboard navigation
<div role="region" aria-label="Timeline events">
  {events.map((event, index) => (
    <EventCard
      key={event.id}
      event={event}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') openFullEdit(event.id);
      }}
    />
  ))}
</div>
```

### 8. Mobile Responsiveness

```typescript
// Responsive slide-over
<SlideOver
  size={isMobile ? 'full' : 'md'}
  className={cn(
    isMobile && 'inset-0', // Full screen on mobile
    !isMobile && 'inset-y-0 right-0' // Side panel on desktop
  )}
>

// Responsive layout
<div className="hidden lg:block">
  <TimelineTable events={events} />
</div>

<div className="lg:hidden space-y-4">
  {events.map(event => (
    <TimelineEventCard key={event.id} event={event} />
  ))}
</div>

// Touch-friendly targets (WCAG 2.5.5)
<button className="min-w-[44px] min-h-[44px]">

// Swipe gestures
const bind = useSwipeable({
  onSwipedRight: () => closeSlideOver(),
  trackMouse: false,
});

<div {...bind}>
  {/* Slide-over content */}
</div>
```

---

## Success Metrics

### User Experience
- ✅ Time to create event: < 30 seconds
- ✅ Time to find and edit event: < 1 minute
- ✅ Error rate: < 5% of operations
- ✅ Mobile usability score: > 90 (Google Lighthouse)

### Performance
- ✅ Initial load: < 2 seconds
- ✅ Search response: < 300ms
- ✅ Form validation: Real-time (< 100ms)
- ✅ Optimistic updates: Instant UI feedback

### Accessibility
- ✅ WCAG 2.1 AA compliance: 100%
- ✅ Keyboard navigation: All actions accessible
- ✅ Screen reader: Proper ARIA labels
- ✅ Color contrast: Minimum 4.5:1

### Adoption
- ✅ Daily active users: 3+ within first week
- ✅ Weekly CRUD operations: 50+
- ✅ User satisfaction: Positive feedback
- ✅ Feature requests: < 3 critical gaps

---

## Risk Mitigation

### Technical Risks

**Risk:** Slide-over state conflicts with React Router
**Mitigation:**
- Use URL query params for slide-over state (`?edit=event-123`)
- Browser back button closes slide-over
- Deep linking works: `/memory?edit=event-123`

**Risk:** Optimistic updates cause data inconsistency
**Mitigation:**
- Store original data before optimistic update
- Implement rollback on MCP call failure
- Show visual indicator during save (loading spinner)
- Toast notifications for errors

**Risk:** Form validation too strict/lenient
**Mitigation:**
- Start lenient, add rules based on real errors
- Clear error messages with examples
- Validate on blur, not on every keystroke
- Allow saving invalid forms as drafts

**Risk:** Performance degradation with large datasets
**Mitigation:**
- Implement pagination (100 items/page)
- Virtual scrolling for 1000+ items
- Debounced search (300ms delay)
- Cache frequently accessed data

### UX Risks

**Risk:** Users don't discover inline editing
**Mitigation:**
- Subtle hover hint (border appears)
- Onboarding tooltip on first visit
- "Click to edit" placeholder text
- Help button with keyboard shortcuts

**Risk:** Accidental deletions
**Mitigation:**
- Confirmation modal for all deletes
- "Undo" option (30-second window)
- Bulk delete requires typing "DELETE" to confirm
- Soft deletes (can be recovered for 7 days)

**Risk:** Mobile UX feels cramped
**Mitigation:**
- Full-screen slide-over on mobile
- Larger touch targets (44px minimum)
- Bottom navigation for key actions
- Swipe gestures for common operations

### Integration Risks

**Risk:** MCP tool latency impacts UX
**Mitigation:**
- Optimistic updates for instant feedback
- Loading states for all async operations
- Timeout handling (10-second max)
- Retry logic with exponential backoff

**Risk:** Dashboard bundle size increases significantly
**Mitigation:**
- Code splitting for memory manager route
- Lazy load Monaco/CodeMirror JSON editor
- Tree-shake unused dependencies
- Monitor bundle size in CI/CD

---

## Implementation Roadmap

### Week 1: Foundation (Days 1-3)

#### Day 1: Component Structure
- [ ] Set up route at `/memory`
- [ ] Create base SlideOver component with Framer Motion
- [ ] Create InlineEdit component with focus management
- [ ] Set up Zustand store with initial state
- [ ] Add keyboard shortcut handler (Cmd+K, Cmd+N, Esc)

#### Day 2: Timeline Events
- [ ] Build TimelineEventCard with inline editing
- [ ] Build TimelineEventForm (full form in slide-over)
- [ ] Implement search/filter panel
- [ ] Add pagination (100 items/page)
- [ ] Connect to MCP tools (get_timeline, store_timeline_event)

#### Day 3: KV Memories
- [ ] Build KVMemoryCard with inline editing
- [ ] Build KVMemoryForm (full form in slide-over)
- [ ] Implement TTL picker component
- [ ] Add namespace grouping
- [ ] Connect to MCP tools (list_memories, store_memory)

### Week 2: Polish (Days 4-5)

#### Day 4: Validation & Error Handling
- [ ] Add Zod validation schemas
- [ ] Implement React Hook Form in forms
- [ ] Add JSON editor (Monaco or CodeMirror)
- [ ] Create error boundary component
- [ ] Add toast notifications for success/error

#### Day 5: Advanced Features
- [ ] Implement optimistic updates with rollback
- [ ] Add delete confirmation modal
- [ ] Create bulk operations bar
- [ ] Add export functionality (JSON, CSV)
- [ ] Implement undo/redo (optional)

### Week 3: Testing & Launch (Days 6-7)

#### Day 6: Testing & Accessibility
- [ ] User testing with real memory-shack data
- [ ] Fix bugs and edge cases
- [ ] Add ARIA labels and roles
- [ ] Test keyboard navigation
- [ ] Screen reader testing
- [ ] Mobile responsiveness testing

#### Day 7: Final Polish & Deploy
- [ ] Performance optimization (memoization, lazy loading)
- [ ] Add loading skeletons
- [ ] Create onboarding tooltips
- [ ] Write documentation
- [ ] Deploy to production
- [ ] Monitor error rates and performance

---

## Future Enhancements

### Phase 2 (Post-MVP)

**Batch Import/Export:**
- Upload CSV/JSON files
- Export to Notion, Google Sheets
- Template system for common events

**Advanced Relationships:**
- Link events to memories
- Visualize event chains
- Dependency graphs (Mermaid diagrams)

**Collaboration:**
- Share memory collections
- Comments on events
- Activity feed

**Automation:**
- Scheduled cleanups (expired memories)
- Auto-expiry rules
- Webhooks on create/update/delete

**Analytics:**
- Event trends over time
- Memory usage insights
- Custom dashboards

**Table View Toggle:**
- Optional spreadsheet-like view for power users
- Column sorting and filtering
- Bulk editing in table mode

---

## Alternative Considerations

### Contrarian View: "Tables Are Better"

**Argument:**
- Data-dense tables show more information at once
- Familiar to power users (Excel, Airtable)
- Sorting and filtering built-in
- Bulk operations easier

**Counter:**
- Tables don't adapt to mobile screens
- Inline editing in tables is clunky
- Visual hierarchy gets lost
- Accessibility challenges for screen readers

**Synthesis:**
Offer table view as **optional layout** (toggle in header). Default to cards for mobile-first approach, but allow power users to switch to table view for data-heavy workflows.

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-01-23 | Option 3: Hybrid Inline + Slide-over | Best balance of quick edits and detailed forms |
| 2025-01-23 | Optimistic updates for edits, pessimistic for deletes | Fast UX without risk of accidental data loss |
| 2025-01-23 | React Hook Form + Zod for validation | Industry standard, TypeScript-first, great DX |
| 2025-01-23 | Zustand for state management | Lightweight, already in tech stack, easy to use |
| 2025-01-23 | Framer Motion for slide-over animations | Consistent with existing dashboard animations |
| TBD | Add table view toggle | Based on power user feedback |
| TBD | Implement undo/redo | Based on accidental deletion rate |

---

## Confidence Levels

- **Overall Architecture (Option 3):** 90% - Proven pattern, well-suited to use case
- **Implementation Timeline:** 75% - Depends on complexity of edge cases
- **User Adoption:** 85% - Solves clear pain point, intuitive UX
- **Performance:** 80% - Optimistic updates may need tuning
- **Accessibility:** 90% - Standard patterns, WCAG compliance achievable
- **Mobile Experience:** 85% - Slide-over adapts well, touch targets sized properly

---

## Tech Stack Summary

**Core:**
- React 19 + TypeScript
- Tailwind CSS 4
- Framer Motion (animations)
- Zustand (state management)

**Forms & Validation:**
- React Hook Form
- Zod (schema validation)

**JSON Editing:**
- Monaco Editor or CodeMirror (lazy-loaded)

**MCP Integration:**
- memory-shack MCP server (21 tools)

**Additional Libraries:**
- date-fns (date formatting)
- react-hot-toast (notifications)
- @headlessui/react (accessible components)

---

## Next Steps

1. **Review & Approve** - Get stakeholder buy-in on Option 3
2. **Prototype** - Build clickable prototype for Day 1 components
3. **User Testing** - Test with 2-3 users before full implementation
4. **Implementation** - Follow 7-day roadmap
5. **Launch** - Deploy to production with monitoring
6. **Iterate** - Gather feedback and plan Phase 2 features

---

**Document Version:** 1.0
**Status:** Planning
**Next Review:** After prototype completion
**Owner:** Development Team
**Stakeholders:** Product, Design, Engineering
