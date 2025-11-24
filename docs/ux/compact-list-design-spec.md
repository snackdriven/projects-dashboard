# Compact List View - Design Specification

**Version:** 1.0
**Last Updated:** 2025-11-23
**Status:** Design Review
**Target:** Projects Dashboard - Main View Replacement

---

## Table of Contents

1. [Overview](#overview)
2. [Design Philosophy](#design-philosophy)
3. [Visual Hierarchy](#visual-hierarchy)
4. [Layout Specifications](#layout-specifications)
5. [Component States](#component-states)
6. [Color Palette](#color-palette)
7. [Typography](#typography)
8. [Spacing System](#spacing-system)
9. [Interaction Patterns](#interaction-patterns)
10. [Animation Specifications](#animation-specifications)
11. [Accessibility](#accessibility)
12. [Responsive Behavior](#responsive-behavior)
13. [Edge Cases](#edge-cases)
14. [Component State Matrix](#component-state-matrix)
15. [Implementation Notes](#implementation-notes)

---

## Overview

The Compact List View replaces the current 3-column card grid with a single-column, information-dense list that prioritizes developer workflow efficiency. Each project is represented as a collapsible row that expands to reveal rich metadata and additional actions.

### Design Goals

1. **Information Density:** Display more projects on screen simultaneously
2. **Progressive Disclosure:** Show essential info by default, details on demand
3. **Keyboard-First:** Full keyboard navigation and shortcuts
4. **Developer-Centric:** Show technical metadata (memory, uptime, git status)
5. **Maintain Brand:** Preserve the "spooky cozy" aesthetic with purple/pink/cyan palette

### User Benefits

- **Faster Scanning:** See all 8+ projects without scrolling
- **Quick Actions:** Launch/stop/open with 1-2 clicks or keystrokes
- **Status at a Glance:** Visual indicators show running state immediately
- **Rich Context:** Git status, uptime, and memory usage when needed

---

## Design Philosophy

### Progressive Disclosure
Information is revealed in layers:
- **Layer 1 (Collapsed):** Status + Name + Port + Quick Actions
- **Layer 2 (Expanded):** Runtime metrics + Git status + Extended actions
- **Layer 3 (Future):** Logs, environment variables, config

### Developer Mental Model
The design mirrors common developer tools:
- **List layout:** Like VS Code file explorer or terminal output
- **Expandable rows:** Like GitHub PR diffs or terminal error traces
- **Status indicators:** Like CI/CD pipeline status
- **Keyboard shortcuts:** Like vim/tmux navigation (j/k movement)

### Visual Balance
- **Minimal by default:** Clean, scannable rows
- **Rich when needed:** Expanded state shows comprehensive data
- **Consistent rhythm:** Uniform row height maintains visual stability
- **Playful accents:** Subtle animations and the "spooky" theme preserved

---

## Visual Hierarchy

### Collapsed Row (Default State)

```
┌─────────────────────────────────────────────────────────────────┐
│ [●] project-name                          Port 5173  [Actions] │
│     └─ small muted text                                         │
└─────────────────────────────────────────────────────────────────┘
     ↑          ↑                               ↑           ↑
  Status    Primary Info                    Secondary    Actions
  (8px)     (font-medium)                    (text-xs)   (hover)
```

**Visual Priority (left to right):**
1. Status indicator (immediate recognition)
2. Project name (primary identifier)
3. Port number (technical reference)
4. Action buttons (on hover, contextual)

### Expanded Row (Active State)

```
┌─────────────────────────────────────────────────────────────────┐
│ [●] project-name                          Port 5173  [Actions] │
│     └─ small muted text                                         │
│                                                                  │
│  ┌────────────────┬────────────────┬────────────────────────┐  │
│  │ Running 2h 34m │ Memory 156 MB  │ main • 3 uncommitted   │  │
│  └────────────────┴────────────────┴────────────────────────┘  │
│                                                                  │
│  Full Path: /mnt/c/Users/bette/Desktop/projects/project-name    │
│  URL: http://localhost:5173                                     │
│                                                                  │
│  [Restart] [Copy Port] [View Logs] [Force Close]               │
└─────────────────────────────────────────────────────────────────┘
```

**Information Architecture:**
- **Top row:** Same as collapsed (maintains spatial consistency)
- **Metadata grid:** 3-column layout for key metrics
- **System info:** Full paths and URLs for copy/paste
- **Action toolbar:** Extended actions in horizontal layout

---

## Layout Specifications

### Container

```
Property             Value                    Reasoning
─────────────────────────────────────────────────────────────────
Max Width            896px (max-w-4xl)        Optimal reading width, centered focus
Horizontal Padding   16px (px-4)              Breathing room on narrow viewports
Vertical Padding     32px (py-8)              Separation from header/footer
Container            Single column            Information scannability
Background           bg-background            Inherits theme (light/dark)
```

### Row Dimensions

```
State        Height    Padding      Border Radius    Spacing Between
─────────────────────────────────────────────────────────────────────
Collapsed    48px      12px (py-3)  8px (rounded-lg)  8px (space-y-2)
Expanded     Auto      16px (py-4)  8px (rounded-lg)  8px (space-y-2)
             (min 120px,
              max 180px)
```

### Internal Grid (Collapsed Row)

```
┌─[8px]─[Name + Port Area]─────────────────[Actions Area]─[12px]─┐
│        ↑                                   ↑                     │
│        flex-1 (grow)                       flex-shrink-0         │
│        gap-3 between status & name         gap-2 between btns    │
└────────────────────────────────────────────────────────────────-─┘
```

**CSS Structure:**
```
.row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 16px;
}

.row-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0; /* Allow text truncation */
}

.row-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
```

### Internal Layout (Expanded Row)

```
┌─[16px]──────────────────────────────────────────────────────[16px]─┐
│ [Top Row - Same as Collapsed]                                       │
│                                                                      │
│ [12px vertical gap]                                                 │
│                                                                      │
│ [Metadata Grid - 3 columns, gap-4]                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐             │
│  │ Metric 1    │ │ Metric 2    │ │ Metric 3         │             │
│  └─────────────┘ └─────────────┘ └──────────────────┘             │
│                                                                      │
│ [8px vertical gap]                                                  │
│                                                                      │
│ [Path Info - 2 rows, gap-1]                                         │
│  Full Path: /path/to/project                                        │
│  URL: http://localhost:5173                                         │
│                                                                      │
│ [12px vertical gap]                                                 │
│                                                                      │
│ [Action Toolbar - horizontal flex, gap-2]                           │
│  [Btn] [Btn] [Btn] [Btn]                                           │
└──────────────────────────────────────────────────────────────────---┘
```

**CSS Structure:**
```
.expanded-content {
  padding-top: 12px;
  border-top: 1px solid hsl(var(--border));
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.path-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.75rem; /* text-xs */
}

.action-toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
```

---

## Component States

### 1. Default (Collapsed, Stopped)

**Visual Characteristics:**
- Background: `bg-card` (base card color)
- Border: `1px solid hsl(var(--border))` (subtle)
- Status Dot: `8px circle, fill: hsl(var(--muted-foreground)), opacity: 0.5`
- Text: Default card-foreground
- Actions: Hidden (opacity: 0)

**Trigger:** Default state when project is not running

### 2. Default (Collapsed, Running)

**Visual Characteristics:**
- Background: `bg-card with 5% primary tint overlay`
- Border: `1px solid hsl(var(--primary)), opacity: 0.3`
- Status Dot: `8px circle, fill: hsl(var(--primary)), pulsing animation`
- Glow Effect: `box-shadow: 0 0 0 0 hsl(var(--primary) / 0.2)` (subtle)
- Text: Same as stopped
- Actions: Hidden (opacity: 0)

**Trigger:** Project status returns `running: true`

### 3. Hover (Any State)

**Visual Characteristics:**
- Background: `bg-muted/50` (subtle highlight)
- Border: Unchanged from current state
- Actions: Visible (opacity: 1, fade-in 200ms)
- Cursor: `cursor-pointer`

**Trigger:** Mouse enters row bounds

**CSS:**
```css
.row:hover {
  background-color: hsl(var(--muted) / 0.5);
}

.row:hover .actions {
  opacity: 1;
}
```

### 4. Focus (Keyboard Navigation)

**Visual Characteristics:**
- Ring: `2px solid hsl(var(--primary)), offset 2px`
- Background: Same as hover
- Actions: Visible
- Z-index: Elevated (z-10)

**Trigger:** Keyboard navigation (j/k arrows) or Tab key

**CSS:**
```css
.row:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px hsl(var(--background)),
    0 0 0 4px hsl(var(--primary));
  z-index: 10;
}
```

### 5. Expanded (Active)

**Visual Characteristics:**
- Height: Animated from 48px to auto (120-180px)
- Background: `bg-card` (same as collapsed)
- Border: `1px solid hsl(var(--primary)), opacity: 0.4`
- Shadow: `0 4px 12px -4px hsl(var(--primary) / 0.15)`
- Content: Expanded section visible with fade-in
- Icon Rotation: Chevron rotates 180deg (if using expand icon)

**Trigger:** Click on row or Enter key when focused

**CSS:**
```css
.row.expanded {
  border-color: hsl(var(--primary) / 0.4);
  box-shadow: 0 4px 12px -4px hsl(var(--primary) / 0.15);
}

.expanded-content {
  animation: expand-fade-in 300ms ease-out;
}

@keyframes expand-fade-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 6. Launching (Intermediate State)

**Visual Characteristics:**
- Status Dot: `8px circle, fill: hsl(45 90% 60%), pulsing faster (1s)`
- Border: `1px solid hsl(45 90% 60% / 0.3)` (yellow tint)
- Actions: Launch button replaced with spinner
- Cursor: `cursor-wait`

**Trigger:** Launch request sent, awaiting server response

### 7. Error (Failed State)

**Visual Characteristics:**
- Status Dot: `8px circle, fill: hsl(0 70% 60%)` (red, no pulse)
- Border: `1px solid hsl(0 70% 60% / 0.3)`
- Background: `bg-card with 3% red tint`
- Error Text: Displayed in expanded section (auto-expands on error)

**Trigger:** Server returns error or health check fails

---

## Color Palette

### Status Indicators

```
State       Color Variable                    Hex (Dark)    Tailwind      Usage
──────────────────────────────────────────────────────────────────────────────
Running     hsl(var(--primary))               #c084fc       purple-400    Dot fill, border, glow
Stopped     hsl(var(--muted-foreground))      #94949c       zinc-400      Dot fill (50% opacity)
Launching   hsl(45 90% 60%)                   #f5c845       yellow-400    Dot fill, border
Error       hsl(0 70% 60%)                    #e57373       red-400       Dot fill, border, bg tint
Success     hsl(142 70% 50%)                  #10b981       green-500     Future: successful action feedback
```

### Background & Surfaces

```
Element              Light Mode                  Dark Mode                    Tailwind Class
─────────────────────────────────────────────────────────────────────────────────────────────
Container BG         hsl(0 0% 100%)              hsl(270 30% 6%)              bg-background
Row Default          hsl(0 0% 100%)              hsl(270 25% 10%)             bg-card
Row Hover            hsl(210 40% 96.1% / 0.5)    hsl(270 20% 12% / 0.5)       bg-muted/50
Row Running          card + primary tint 5%      card + primary tint 5%       Custom gradient
Row Expanded         Same as default             Same as default              bg-card
Metadata Card        hsl(210 40% 96.1%)          hsl(270 20% 12%)             bg-muted
```

### Borders

```
Element              Light Mode                  Dark Mode                    Tailwind Class
─────────────────────────────────────────────────────────────────────────────────────────────
Default Border       hsl(214.3 31.8% 91.4%)      hsl(270 25% 18%)             border-border
Running Border       primary with 30% opacity    primary with 30% opacity     border-primary/30
Expanded Border      primary with 40% opacity    primary with 40% opacity     border-primary/40
Focus Ring           hsl(var(--primary))         hsl(var(--primary))          ring-primary
Divider (internal)   hsl(var(--border))          hsl(var(--border))           border-border
```

### Text

```
Element              Light Mode                  Dark Mode                    Tailwind Class
─────────────────────────────────────────────────────────────────────────────────────────────
Primary Text         hsl(222.2 84% 4.9%)         hsl(300 100% 95%)            text-card-foreground
Secondary Text       hsl(215.4 16.3% 46.9%)      hsl(270 20% 70%)             text-muted-foreground
Port Label           hsl(215.4 16.3% 46.9%)      hsl(270 20% 70%)             text-xs text-muted-foreground
Metadata Label       hsl(215.4 16.3% 46.9%)      hsl(270 20% 70%)             text-xs text-muted-foreground
Metadata Value       hsl(222.2 84% 4.9%)         hsl(300 100% 95%)            text-sm font-medium
URL/Path             hsl(215.4 16.3% 46.9%)      hsl(270 20% 70%)             text-xs font-mono
```

### Action Buttons

```
Type                 BG Color                    Text Color                   Border
──────────────────────────────────────────────────────────────────────────────────────────
Primary              hsl(var(--primary))         hsl(var(--primary-fg))       None
Secondary            transparent                 hsl(var(--card-fg))          1px border
Destructive          hsl(0 70% 60% / 0.1)        hsl(0 70% 60%)               hsl(0 70% 60% / 0.2)
Ghost (default)      transparent                 hsl(var(--muted-fg))         None
```

### Shadows & Glows

```
Context              Shadow Definition                                          Usage
──────────────────────────────────────────────────────────────────────────────────────────────
Running Glow         0 0 0 0 hsl(var(--primary) / 0.2)                          Subtle pulse around running projects
Expanded Shadow      0 4px 12px -4px hsl(var(--primary) / 0.15)                 Elevation for expanded rows
Focus Ring Shadow    0 0 0 2px bg, 0 0 0 4px primary                            Keyboard focus indicator
Button Hover         0 2px 8px -2px hsl(var(--primary) / 0.3)                   Hover state for action buttons
```

---

## Typography

### Font Stack
```css
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  Roboto,
  "Helvetica Neue",
  Arial,
  sans-serif;
```

### Type Scale

```
Element                  Size      Weight    Line Height    Letter Spacing    Tailwind
────────────────────────────────────────────────────────────────────────────────────────
Project Name             16px      500       24px           -0.01em           text-base font-medium
Port Number              12px      400       16px           0                 text-xs
Metadata Label           12px      400       16px           0.02em            text-xs
Metadata Value           14px      500       20px           0                 text-sm font-medium
Path/URL                 12px      400       16px           0                 text-xs font-mono
Button Label             14px      500       20px           0.01em            text-sm font-medium
Section Heading          14px      600       20px           0.02em            text-sm font-semibold
Status Badge Text        12px      500       16px           0.02em            text-xs font-medium
```

### Font Features
```css
body {
  font-feature-settings: "rlig" 1, "calt" 1; /* Ligatures for code */
}

.mono {
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace;
  font-feature-settings: "liga" 0; /* Disable ligatures for paths */
}
```

---

## Spacing System

### Base Unit: 4px

```
Token    Pixels    Rem       Tailwind    Usage
─────────────────────────────────────────────────────────────────────────
xs       4px       0.25rem   1           Tight gaps (between icon & text)
sm       8px       0.5rem    2           Small gaps (between buttons)
md       12px      0.75rem   3           Medium gaps (row vertical padding)
lg       16px      1rem      4           Large gaps (section spacing)
xl       24px      1.5rem    6           Extra large (header to content)
2xl      32px      2rem      8           Section breaks
```

### Spacing Application

```
Context                        Spacing Value    Token    Reasoning
─────────────────────────────────────────────────────────────────────────────────────
Between rows                   8px              sm       Scannable density
Row horizontal padding         16px             lg       Touch-friendly hit area
Row vertical padding           12px             md       Balanced height
Status dot to name             12px             md       Visual grouping
Name to port                   auto (flex)      -        Natural separation
Buttons gap                    8px              sm       Distinct clickable areas
Expanded content top padding   12px             md       Section separation
Metadata grid gap              16px             lg       Readable columns
Metadata cards internal        12px             md       Comfortable reading
Action toolbar gap             8px              sm       Button grouping
Container to edge              16px             lg       Breathing room
```

### Vertical Rhythm

```
Element Stack (Expanded Row):
┌─────────────────────────────────┐
│ Top Row (48px)                  │  ← Collapsed height maintained
├─────────────────────────────────┤
│ 12px gap                        │  ← Visual separator
├─────────────────────────────────┤
│ Metadata Grid (auto)            │  ← Information layer
├─────────────────────────────────┤
│ 8px gap                         │  ← Tighter stacking
├─────────────────────────────────┤
│ Path Info (2 rows × 16px)       │  ← System details
├─────────────────────────────────┤
│ 12px gap                        │  ← Emphasis separator
├─────────────────────────────────┤
│ Action Toolbar (36px buttons)   │  ← Interaction zone
└─────────────────────────────────┘
```

---

## Interaction Patterns

### Mouse Interactions

#### 1. Click Row (Collapsed)
```
Trigger: Click anywhere on row area
Action:  Expand row to show metadata
Visual:
  - Height animates from 48px to auto (300ms ease-out)
  - Border color transitions to primary/40
  - Shadow appears (fade-in 200ms)
  - Content fades in (opacity 0 → 1, 300ms)
  - Chevron icon rotates 180deg (if present)
State:   row.expanded = true
```

#### 2. Click Row (Expanded)
```
Trigger: Click on top row area (not action buttons)
Action:  Collapse row
Visual:
  - Height animates to 48px (300ms ease-out)
  - Border returns to default
  - Shadow fades out (200ms)
  - Content fades out then height collapse
State:   row.expanded = false
```

#### 3. Hover Row
```
Trigger: Mouse enters row bounds
Action:  Show quick actions
Visual:
  - Background transitions to muted/50 (200ms)
  - Action buttons fade in (opacity 0 → 1, 200ms)
  - Cursor changes to pointer
Delay:   None (immediate response)
```

#### 4. Click Action Button (Launch)
```
Trigger: Click "Launch" button
Action:  Send launch request to server
Visual:
  - Button disabled (opacity 0.6, cursor: not-allowed)
  - Spinner icon replaces Play icon
  - Status dot changes to yellow pulsing
  - Border tints yellow
State:   launching[projectName] = true
Timeout: 2000ms before re-enabling if no response
```

#### 5. Click Action Button (Force Close)
```
Trigger: Click "Force Close" button (destructive)
Action:  Confirm then send close request
Visual:
  - Button shows loading spinner
  - Status dot stops pulsing
  - Row border fades to default
State:   closing[projectName] = true
Feedback: Toast notification on success/failure
```

#### 6. Click "Copy Port" Button
```
Trigger: Click copy button in expanded row
Action:  Copy port number to clipboard
Visual:
  - Button flashes green (100ms)
  - Icon changes to checkmark (1000ms)
  - Tooltip shows "Copied!" (2000ms fade-out)
State:   Temporary UI state only
```

### Keyboard Interactions

#### Navigation
```
Key         Action                           Visual Feedback
─────────────────────────────────────────────────────────────────────────────
j or ↓      Move focus to next row           Focus ring moves down
k or ↑      Move focus to previous row       Focus ring moves up
Home        Focus first row                  Jump to top
End         Focus last row                   Jump to bottom
Tab         Focus next interactive element   Standard browser focus
Shift+Tab   Focus previous element           Standard browser focus
```

#### Actions
```
Key         Context              Action                        Visual Feedback
──────────────────────────────────────────────────────────────────────────────────
Enter       Row focused          Toggle expand/collapse        Height animation
Enter       Stopped project      Launch project                Status changes
Space       Row focused          Toggle selection (future)     Checkbox appears
x           Running project      Force close project           Confirmation prompt
o           Running project      Open in new tab               New tab opens
c           Expanded row         Copy port to clipboard        Copy confirmation
r           Running project      Restart project               Status cycle
/           Anywhere            Focus search field (future)   Input focused
Escape      Expanded row         Collapse row                  Return to collapsed
Escape      Any modal            Close modal                   Modal dismissed
```

#### Keyboard Shortcuts Legend
```
Show with: Shift + ?

┌──────────────────────────────────────────────────┐
│ Keyboard Shortcuts                               │
├──────────────────────────────────────────────────┤
│ j / ↓        Navigate down                       │
│ k / ↑        Navigate up                         │
│ Enter        Expand / Launch                     │
│ x            Force close (running projects)      │
│ o            Open in browser                     │
│ c            Copy port                           │
│ r            Restart                             │
│ Esc          Collapse / Close                    │
└──────────────────────────────────────────────────┘
```

### Touch Interactions (Mobile)

```
Gesture         Action                    Notes
────────────────────────────────────────────────────────────────────────────
Tap             Expand/collapse row       Same as click
Long press      Show context menu         Future: Quick actions menu
Swipe right     Launch project            Future: Gesture shortcuts
Swipe left      Force close               Future: Gesture shortcuts
```

### Focus Management

```
Context                     Focus Behavior
─────────────────────────────────────────────────────────────────────────────
Page load                   First row receives focus (auto-focus)
Row expansion               Focus remains on row (not child elements)
Action button click         Focus returns to row after action completes
Modal open                  Focus trapped in modal
Modal close                 Focus returns to row that opened it
Search filter active        Filter input receives focus on "/"
Keyboard nav (j/k)          Focus follows selection, scrolls into view
```

---

## Animation Specifications

### Timing Functions
```css
/* Predefined easing curves */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* Smooth deceleration */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);    /* Balanced motion */
--spring: cubic-bezier(0.34, 1.56, 0.64, 1);    /* Bouncy spring */
--sharp: cubic-bezier(0.4, 0, 0.6, 1);          /* Quick, decisive */
```

### Animation Catalog

#### 1. Row Expand/Collapse
```css
@keyframes expand-row {
  from {
    height: 48px;
    opacity: 1;
  }
  to {
    height: var(--expanded-height); /* Calculated dynamically */
    opacity: 1;
  }
}

.row.expanding {
  animation: expand-row 300ms var(--ease-out) forwards;
}

.row.collapsing {
  animation: expand-row 300ms var(--ease-out) reverse forwards;
}
```

**Duration:** 300ms
**Easing:** ease-out
**Trigger:** Click row or Enter key
**Properties:** height (transform avoided for performance)

#### 2. Content Fade-In (Expanded Section)
```css
@keyframes fade-slide-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.expanded-content {
  animation: fade-slide-in 300ms var(--ease-out) 50ms forwards;
}
```

**Duration:** 300ms
**Delay:** 50ms (after row starts expanding)
**Easing:** ease-out
**Properties:** opacity, transform (GPU-accelerated)

#### 3. Status Dot Pulse (Running)
```css
@keyframes pulse-glow {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.15);
  }
}

.status-dot.running {
  animation: pulse-glow 2s var(--ease-in-out) infinite;
}
```

**Duration:** 2s (slow, calming)
**Easing:** ease-in-out
**Iteration:** infinite
**Properties:** opacity, scale

#### 4. Status Dot Pulse (Launching)
```css
.status-dot.launching {
  animation: pulse-glow 1s var(--ease-in-out) infinite;
}
```

**Duration:** 1s (faster, indicates active process)
**Other:** Same as running pulse

#### 5. Action Buttons Fade-In (Hover)
```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.row:hover .actions {
  animation: fade-in 200ms var(--ease-out) forwards;
}
```

**Duration:** 200ms
**Easing:** ease-out
**Trigger:** Mouse enter row

#### 6. Focus Ring Spring
```css
.row:focus-visible {
  transition: box-shadow 150ms var(--spring);
}
```

**Duration:** 150ms
**Easing:** spring (bouncy feel)
**Properties:** box-shadow (ring appearance)

#### 7. Button Hover Lift
```css
.button {
  transition: transform 200ms var(--ease-out),
              box-shadow 200ms var(--ease-out);
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px -2px hsl(var(--primary) / 0.3);
}
```

**Duration:** 200ms
**Properties:** transform (GPU), box-shadow

#### 8. Spinner Rotation (Loading States)
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 600ms linear infinite;
}
```

**Duration:** 600ms per rotation
**Easing:** linear (constant speed)
**Iteration:** infinite

#### 9. Success Flash (Copy Confirmation)
```css
@keyframes success-flash {
  0%, 100% {
    background-color: transparent;
  }
  50% {
    background-color: hsl(142 70% 50% / 0.2);
  }
}

.button.success-flash {
  animation: success-flash 400ms var(--ease-in-out);
}
```

**Duration:** 400ms
**Trigger:** Successful action (e.g., copy)

### Performance Considerations

**GPU-Accelerated Properties:**
- `transform` (translate, scale, rotate)
- `opacity`
- `filter` (blur, brightness)

**Avoid animating:**
- `height` (use only for critical transitions, will-change)
- `width`
- `top/left/right/bottom`
- `margin/padding`

**Optimization Strategy:**
```css
.row.expanding,
.row.collapsing {
  will-change: height; /* Only during animation */
}

.row.expanding::after,
.row.collapsing::after {
  will-change: auto; /* Reset after animation */
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .status-dot {
    animation: none !important; /* No pulsing */
  }
}
```

---

## Accessibility

### ARIA Labels & Roles

#### Row Element
```html
<div
  role="button"
  aria-label="Project google-calendar-clone, running, port 5173"
  aria-expanded="false"
  tabindex="0"
  class="row"
>
  <!-- Row content -->
</div>
```

**Attributes:**
- `role="button"` - Indicates clickable/interactive
- `aria-label` - Descriptive label for screen readers
- `aria-expanded` - Toggles between "true"/"false"
- `tabindex="0"` - Keyboard focusable

#### Status Indicator
```html
<div
  role="status"
  aria-label="Running"
  class="status-dot running"
>
  <span class="sr-only">Project is running</span>
</div>
```

**Attributes:**
- `role="status"` - Live region for dynamic updates
- `aria-label` - Status description
- `.sr-only` - Screen reader only text

#### Action Buttons
```html
<button
  aria-label="Launch google-calendar-clone on port 5173"
  class="action-button"
>
  <PlayIcon aria-hidden="true" />
  <span>Launch</span>
</button>
```

**Attributes:**
- `aria-label` - Descriptive action
- `aria-hidden="true"` on icons - Icons decorative
- Visible text label always present

#### Expanded Content
```html
<div
  role="region"
  aria-labelledby="project-name-id"
  class="expanded-content"
>
  <!-- Metadata content -->
</div>
```

### Keyboard Navigation

#### Focus Order
```
1. Row 1 (tabindex="0")
   ├─ [When expanded] Action buttons (native focus)
2. Row 2 (tabindex="0")
3. Row 3 (tabindex="0")
...
```

#### Focus Indicators
- **Visual:** 2px solid ring with 2px offset
- **Color:** Primary color (high contrast)
- **Animation:** 150ms spring transition
- **Required:** Never use `outline: none` without replacement

#### Screen Reader Announcements
```javascript
// On status change
announceToScreenReader(`${projectName} is now ${status}`)

// On expansion
announceToScreenReader(`Expanded details for ${projectName}`)

// On action
announceToScreenReader(`Launching ${projectName}`)

// Implementation
function announceToScreenReader(message) {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', 'polite')
  announcement.className = 'sr-only'
  announcement.textContent = message
  document.body.appendChild(announcement)
  setTimeout(() => announcement.remove(), 1000)
}
```

### Color Contrast

#### WCAG AA Compliance (4.5:1 minimum)

```
Element                  Foreground              Background          Ratio    Pass
─────────────────────────────────────────────────────────────────────────────────────
Project Name (dark)      hsl(300 100% 95%)       hsl(270 25% 10%)    12.5:1   AAA
Port Text (dark)         hsl(270 20% 70%)        hsl(270 25% 10%)    7.8:1    AAA
Running Status           hsl(280 80% 70%)        hsl(270 25% 10%)    6.2:1    AA
Stopped Status           hsl(270 20% 70%)        hsl(270 25% 10%)    7.8:1    AAA
Button Text              hsl(270 30% 6%)         hsl(280 80% 70%)    7.1:1    AAA
Border (focus)           hsl(280 80% 70%)        hsl(270 25% 10%)    6.2:1    AA
```

### Color Blindness Support

#### Status Indicators (Shape + Color)
```
Running:   ● Green circle with pulsing animation
Stopped:   ○ Gray circle (hollow)
Launching: ◐ Yellow half-circle spinner
Error:     ✕ Red X icon
```

**Reasoning:** Users with deuteranopia/protanopia can distinguish by:
1. Shape variation (filled, hollow, spinner, X)
2. Animation (pulsing vs static)
3. Position consistency

#### High Contrast Mode
```css
@media (prefers-contrast: high) {
  .row {
    border-width: 2px;
  }

  .status-dot {
    border: 2px solid currentColor;
  }

  .button {
    border-width: 2px;
  }
}
```

### Focus Management Strategies

#### 1. Roving tabindex (j/k navigation)
```javascript
// Only one row has tabindex="0" at a time
function updateFocusableRow(newIndex) {
  rows.forEach((row, index) => {
    row.setAttribute('tabindex', index === newIndex ? '0' : '-1')
  })
  rows[newIndex].focus()
}
```

#### 2. Focus trapping in modals
```javascript
// Trap focus within confirmation dialogs
const focusableElements = modal.querySelectorAll(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
)
const firstElement = focusableElements[0]
const lastElement = focusableElements[focusableElements.length - 1]

// Cycle focus on Tab
```

#### 3. Scroll into view
```javascript
// Ensure focused row is visible
function scrollRowIntoView(row) {
  row.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'nearest'
  })
}
```

### Screen Reader Testing Checklist

- [ ] All interactive elements have accessible names
- [ ] Status changes are announced
- [ ] Expanded/collapsed state is conveyed
- [ ] Button purposes are clear from labels alone
- [ ] Navigation order is logical (top to bottom)
- [ ] Dynamic content updates are announced
- [ ] Error states are communicated
- [ ] Loading states are announced
- [ ] Icons are decorative (aria-hidden) or have labels
- [ ] Forms (future) have associated labels

### Alternative Text Requirements

```html
<!-- Status icons -->
<div aria-label="Running" role="status">
  <Circle aria-hidden="true" />
</div>

<!-- Action icons -->
<button aria-label="Launch project">
  <Play aria-hidden="true" />
  <span>Launch</span> <!-- Visible text preferred -->
</button>

<!-- Decorative elements -->
<div aria-hidden="true" class="gradient-overlay"></div>
```

---

## Responsive Behavior

### Breakpoint Strategy

```
Breakpoint    Min Width    Layout Changes
──────────────────────────────────────────────────────────────────────
xs            0px          Mobile: Stack all elements
sm            640px        Tablet: Increase touch targets
md            768px        Tablet: Show partial metadata
lg            1024px       Desktop: Full layout
xl            1280px       Wide: Increased max-width
```

### Layout Transformations

#### Desktop (≥1024px) - Full Layout
```
┌─[●]─project-name──────────────Port 5173──[Actions]─┐
│                                                      │
│  ┌──────────┬──────────┬───────────────┐            │
│  │ Metric 1 │ Metric 2 │ Metric 3      │            │
│  └──────────┴──────────┴───────────────┘            │
│                                                      │
│  Full Path: /path/to/project                        │
│  URL: http://localhost:5173                         │
│                                                      │
│  [Restart] [Copy] [Logs] [Close]                    │
└──────────────────────────────────────────────────────┘
```

#### Tablet (768-1023px) - Priority Metadata
```
┌─[●]─project-name──────────────Port 5173──[Actions]─┐
│                                                      │
│  ┌──────────┬──────────┐                            │
│  │ Running  │ Memory   │  (Git status hidden)       │
│  └──────────┴──────────┘                            │
│                                                      │
│  URL: http://localhost:5173                         │
│  (Path hidden, URL prioritized)                     │
│                                                      │
│  [Restart] [Copy] [Close]  (Logs hidden)            │
└──────────────────────────────────────────────────────┘
```

#### Mobile (<768px) - Stacked Layout
```
┌───────────────────────────────────┐
│ [●] project-name                  │
│     Port 5173                     │
│                                   │
│ [Launch ─────────────────────]    │
│                                   │
│ ─── Expanded ───                  │
│                                   │
│ Running: 2h 34m                   │
│ Memory: 156 MB                    │
│                                   │
│ http://localhost:5173             │
│                                   │
│ [Restart ──────]  [Close ──────]  │
└───────────────────────────────────┘
```

### CSS Implementation

```css
/* Mobile-first base styles */
.row {
  flex-direction: column;
  gap: 12px;
}

.row-left,
.row-right {
  width: 100%;
}

.metadata-grid {
  grid-template-columns: 1fr; /* Single column */
  gap: 12px;
}

.action-toolbar {
  flex-direction: column;
  gap: 8px;
}

/* Tablet (md) */
@media (min-width: 768px) {
  .row {
    flex-direction: row;
    align-items: center;
  }

  .row-left {
    width: auto;
    flex: 1;
  }

  .row-right {
    width: auto;
  }

  .metadata-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .action-toolbar {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .metadata-item:nth-child(3) {
    display: none; /* Hide git status on tablet */
  }
}

/* Desktop (lg) */
@media (min-width: 1024px) {
  .metadata-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .metadata-item:nth-child(3) {
    display: block; /* Show git status */
  }

  .path-full {
    display: block; /* Show full path */
  }
}
```

### Touch Target Sizing

```
Element              Mobile    Tablet    Desktop    Notes
────────────────────────────────────────────────────────────────────────
Row height           56px      52px      48px       Larger on mobile
Button min-height    44px      40px      36px       iOS guidelines: 44px
Button min-width     44px      40px      auto       Square on mobile
Icon size            20px      18px      16px       Proportional scaling
Status dot           10px      9px       8px        Visible but not huge
```

**iOS Human Interface Guidelines:** Minimum 44×44pt
**Android Material:** Minimum 48×48dp
**Our mobile target:** 44px (safe for both platforms)

### Responsive Typography

```css
/* Mobile */
.project-name {
  font-size: 15px;
  line-height: 20px;
}

.port-label {
  font-size: 13px;
}

/* Tablet and up */
@media (min-width: 768px) {
  .project-name {
    font-size: 16px;
    line-height: 24px;
  }

  .port-label {
    font-size: 12px;
  }
}
```

### Container Adaptation

```css
.container {
  max-width: 100%;
  padding: 16px;
}

@media (min-width: 640px) {
  .container {
    padding: 20px;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 896px; /* 4xl */
    margin: 0 auto;
    padding: 32px;
  }
}
```

### Orientation Changes

```css
@media (orientation: landscape) and (max-height: 600px) {
  /* Reduce vertical spacing on short landscape screens */
  .row {
    padding: 8px 12px;
  }

  .expanded-content {
    max-height: 300px;
    overflow-y: auto;
  }
}
```

---

## Edge Cases

### 1. Very Long Project Names

**Problem:** Names like "my-extremely-long-project-name-with-many-words" break layout

**Solution:**
```css
.project-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px; /* Adjust based on container */
}

/* Show full name on hover */
.project-name:hover {
  overflow: visible;
  white-space: normal;
  z-index: 10;
  background: hsl(var(--card));
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px hsl(0 0% 0% / 0.1);
}
```

**Visual:**
```
Default:  [●] my-extremely-long-pro...     Port 5173
Hover:    [●] my-extremely-long-project-
          name-with-many-words
                                           Port 5173
```

### 2. Missing or Unknown Metadata

**Problem:** Git status, uptime, or memory data unavailable

**Solution:**
```html
<!-- Show placeholder text -->
<div class="metadata-item">
  <span class="label">Uptime</span>
  <span class="value text-muted-foreground">N/A</span>
</div>

<!-- Or hide section entirely -->
{gitStatus ? (
  <div class="metadata-item">
    <GitIcon />
    <span>{gitStatus}</span>
  </div>
) : null}
```

**Visual Treatment:**
- Use muted text color (text-muted-foreground)
- Italic styling (font-style: italic)
- Reduced opacity (opacity: 0.6)
- Consider showing "—" instead of "N/A"

### 3. API Errors / Server Unreachable

**Problem:** Status check fails, can't determine if project is running

**Solution:**
```html
<div class="row error-state" role="alert">
  <div class="status-dot error" aria-label="Error">
    <XIcon />
  </div>
  <div class="row-content">
    <h3>project-name</h3>
    <p class="error-message">Unable to check status</p>
  </div>
  <button aria-label="Retry">Retry</button>
</div>
```

**Visual:**
- Red X icon instead of status dot
- Error message below project name (text-xs, red)
- Retry button in actions area
- Optional: Auto-expand to show error details

### 4. Simultaneous Multiple Expansions

**Problem:** Should multiple rows be expandable at once?

**Decision:** Allow multiple expanded rows (better UX for comparison)

**Alternative:** Accordion behavior (expand one = collapse others)

**Implementation:**
```javascript
// Option A: Multiple expansions (recommended)
const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

function toggleRow(projectName) {
  setExpandedRows(prev => {
    const next = new Set(prev)
    if (next.has(projectName)) {
      next.delete(projectName)
    } else {
      next.add(projectName)
    }
    return next
  })
}

// Option B: Accordion (single expansion)
const [expandedRow, setExpandedRow] = useState<string | null>(null)

function toggleRow(projectName) {
  setExpandedRow(prev => prev === projectName ? null : projectName)
}
```

### 5. Extremely High Memory Usage

**Problem:** Memory display "12,345 MB" takes up too much space

**Solution:**
```javascript
function formatMemory(mb) {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`
  }
  return `${mb} MB`
}

// Examples:
// 156 MB → "156 MB"
// 1024 MB → "1.0 GB"
// 1500 MB → "1.5 GB"
```

### 6. No Projects Available

**Problem:** Empty state when no projects exist

**Solution:**
```html
<div class="empty-state">
  <GhostIcon class="icon-large opacity-20" />
  <h3>No projects found</h3>
  <p>Add projects to the dashboard to get started</p>
  <button>Add Project</button>
</div>
```

**Visual:**
- Centered vertically and horizontally
- Large decorative icon (ghost, keeping theme)
- Clear call-to-action button
- Helpful instructional text

### 7. Very Long Uptime

**Problem:** "Running for 45 days 12 hours 34 minutes" is too verbose

**Solution:**
```javascript
function formatUptime(milliseconds) {
  const hours = Math.floor(milliseconds / 3600000)
  const minutes = Math.floor((milliseconds % 3600000) / 60000)

  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// Examples:
// 0-59 min → "34m"
// 1-23 hrs → "2h 15m"
// 24+ hrs  → "3d 12h"
```

### 8. Port Conflicts / Multiple Projects Same Port

**Problem:** Two projects configured with same port (shouldn't happen, but...)

**Solution:**
```html
<!-- Show warning badge -->
<div class="port-label warning">
  Port 5173
  <WarningIcon class="inline-icon" />
  <Tooltip>Port conflict detected</Tooltip>
</div>
```

**Visual:**
- Yellow/orange warning icon
- Tooltip on hover explaining issue
- Prevent launching if conflict exists

### 9. Keyboard Navigation Past List Bounds

**Problem:** Pressing "j" on last row or "k" on first row

**Solution:**
```javascript
function handleKeyDown(e) {
  if (e.key === 'j' || e.key === 'ArrowDown') {
    e.preventDefault()
    setFocusedIndex(prev => Math.min(prev + 1, projects.length - 1))
    // Stops at last row, doesn't wrap
  }

  if (e.key === 'k' || e.key === 'ArrowUp') {
    e.preventDefault()
    setFocusedIndex(prev => Math.max(prev - 1, 0))
    // Stops at first row, doesn't wrap
  }
}

// Alternative: Wrap around
function handleKeyDownWrap(e) {
  if (e.key === 'j') {
    setFocusedIndex(prev => (prev + 1) % projects.length)
  }
  if (e.key === 'k') {
    setFocusedIndex(prev => (prev - 1 + projects.length) % projects.length)
  }
}
```

**Decision:** Hard stop at bounds (no wrap) - more predictable

### 10. Slow Network / Delayed Status Updates

**Problem:** Status polling takes >3 seconds, shows stale data

**Solution:**
```html
<!-- Show loading skeleton in row -->
<div class="status-dot">
  <Loader2 class="animate-spin" />
</div>

<!-- Or show "Checking..." text -->
<div class="metadata-item">
  <span class="label">Status</span>
  <span class="value loading">Checking...</span>
</div>
```

**Timeout Strategy:**
- Show loading state after 500ms
- Timeout request after 5000ms
- Cache last known status
- Show stale indicator: "Last checked 2m ago"

---

## Component State Matrix

### State Combinations

| Running | Launching | Closing | Expanded | Hovered | Focused | Display                           |
|---------|-----------|---------|----------|---------|---------|-----------------------------------|
| false   | false     | false   | false    | false   | false   | Default collapsed, stopped        |
| false   | false     | false   | false    | true    | false   | Hover with actions visible        |
| false   | false     | false   | false    | false   | true    | Keyboard focused, stopped         |
| false   | false     | false   | true     | false   | false   | Expanded, stopped, metadata shown |
| false   | true      | false   | false    | false   | false   | Launching spinner, yellow dot     |
| true    | false     | false   | false    | false   | false   | Running, green pulsing dot        |
| true    | false     | false   | true     | false   | false   | Running, expanded, metrics shown  |
| true    | false     | true    | false    | false   | false   | Closing spinner, dot stops pulse  |
| false   | false     | false   | true     | true    | false   | Expanded + hover actions visible  |
| true    | false     | false   | false    | false   | true    | Running + keyboard focus          |

### State Priority (Rendering Logic)

```javascript
// Determine status indicator
function getStatusIndicator(project) {
  if (closing[project.name]) {
    return <Spinner className="status-dot" aria-label="Closing" />
  }
  if (launching[project.name]) {
    return <StatusDot color="yellow" pulse aria-label="Launching" />
  }
  if (statuses[project.name]?.running) {
    return <StatusDot color="green" pulse aria-label="Running" />
  }
  if (errors[project.name]) {
    return <StatusDot color="red" icon={XIcon} aria-label="Error" />
  }
  return <StatusDot color="gray" aria-label="Stopped" />
}

// Determine primary action
function getPrimaryAction(project) {
  if (closing[project.name]) {
    return <Button disabled>Closing...</Button>
  }
  if (launching[project.name]) {
    return <Button disabled>Launching...</Button>
  }
  if (statuses[project.name]?.running) {
    return <Button variant="destructive" onClick={handleClose}>Force Close</Button>
  }
  return <Button variant="primary" onClick={handleLaunch}>Launch</Button>
}
```

### CSS Class Combinations

```css
/* Base class always present */
.row { ... }

/* State modifiers (can be combined) */
.row.running { ... }
.row.launching { ... }
.row.closing { ... }
.row.expanded { ... }
.row.error { ... }

/* Pseudo-classes */
.row:hover { ... }
.row:focus-visible { ... }

/* Example combinations */
.row.running.expanded { ... }
.row.launching:hover { ... }
.row.error.expanded { ... }
```

---

## Implementation Notes

### Component Architecture

```
ProjectListView (Container)
│
├─ ProjectRow (Collapsed/Expanded)
│  │
│  ├─ StatusIndicator (Dot with pulse)
│  │
│  ├─ ProjectInfo
│  │  ├─ ProjectName
│  │  └─ PortLabel
│  │
│  ├─ QuickActions (hover visible)
│  │  └─ ActionButton[]
│  │
│  └─ ExpandedContent (conditional)
│     ├─ MetadataGrid
│     │  ├─ MetadataCard (Uptime)
│     │  ├─ MetadataCard (Memory)
│     │  └─ MetadataCard (Git)
│     │
│     ├─ PathInfo
│     │  ├─ FullPath
│     │  └─ URLLink
│     │
│     └─ ActionToolbar
│        └─ ActionButton[]
│
└─ EmptyState (conditional)
```

### State Management

```typescript
// Component state
interface ProjectListState {
  projects: Project[]
  statuses: Record<string, ProjectStatus>
  expandedRows: Set<string>
  launching: Record<string, boolean>
  closing: Record<string, boolean>
  focusedIndex: number
  errors: Record<string, string | null>
}

// Actions
type Action =
  | { type: 'SET_PROJECTS'; projects: Project[] }
  | { type: 'UPDATE_STATUS'; projectName: string; status: ProjectStatus }
  | { type: 'TOGGLE_EXPANSION'; projectName: string }
  | { type: 'SET_LAUNCHING'; projectName: string; launching: boolean }
  | { type: 'SET_CLOSING'; projectName: string; closing: boolean }
  | { type: 'SET_FOCUSED_INDEX'; index: number }
  | { type: 'SET_ERROR'; projectName: string; error: string | null }
```

### Data Flow

```
User Action → Event Handler → State Update → Re-render
                                    ↓
                                API Call
                                    ↓
                            Status Update → Re-render
```

### Performance Optimizations

1. **Virtualization (Future):** For 50+ projects, use `react-window`
2. **Memoization:** Memoize row components
3. **Debounced Status Checks:** Batch status requests
4. **CSS Containment:** `contain: layout style`
5. **Will-change:** Only during animations

```css
.row {
  contain: layout style;
}

.row.animating {
  will-change: height;
}
```

### Testing Checklist

- [ ] Expand/collapse animation smooth
- [ ] Status updates reflect accurately
- [ ] Keyboard navigation works (j/k/Enter)
- [ ] Focus ring visible and high contrast
- [ ] Hover actions appear/disappear correctly
- [ ] Multiple expansions work simultaneously
- [ ] Loading states show appropriately
- [ ] Error states display with retry option
- [ ] Long project names truncate properly
- [ ] Responsive layout adapts on mobile
- [ ] Touch targets meet 44px minimum
- [ ] Screen reader announces status changes
- [ ] Reduced motion preference respected
- [ ] High contrast mode styles apply
- [ ] Copy to clipboard provides feedback

### Browser Support

```
Chrome/Edge:   ✓ 90+
Firefox:       ✓ 88+
Safari:        ✓ 14+
Mobile Safari: ✓ 14+
Chrome Mobile: ✓ 90+
```

**Fallbacks:**
- CSS Grid → Flexbox (auto via PostCSS)
- CSS Container Queries → Media queries
- `:focus-visible` → `:focus` polyfill

### Migration Strategy

**Phase 1: Parallel Implementation**
- Build compact list view alongside existing cards
- Add view toggle in header (grid/list icons)
- Store preference in localStorage

**Phase 2: User Testing**
- A/B test with small user group
- Collect feedback on usability
- Iterate on metadata priority

**Phase 3: Default Switch**
- Make list view default
- Keep cards accessible via toggle
- Monitor usage analytics

**Phase 4: Deprecation**
- Remove card view if list adoption >90%
- Or keep both views permanently

---

## Wireframes

### ASCII Wireframe - Collapsed State

```
╔════════════════════════════════════════════════════════════════════╗
║  Projects Dashboard                         ⚪ 2 Running / 8 Total  ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ ⚪ google-calendar-clone               Port 5173    [▶ Launch]│ ║
║  │    projects/google-calendar-clone                            │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ 🟢 jira-wrapper                        Port 5174    [⊗ Close]│ ║
║  │    projects/jira-wrapper                                     │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ ⚪ lastfm-clone                         Port 5175    [▶ Launch]│ ║
║  │    projects/lastfm-clone                                     │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ 🟡 task-manager                        Port 5178    [⏳ Wait] │ ║
║  │    projects/task-manager                                     │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

### ASCII Wireframe - Expanded State

```
╔════════════════════════════════════════════════════════════════════╗
║  Projects Dashboard                         ⚪ 2 Running / 8 Total  ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ 🟢 jira-wrapper                        Port 5174    [⊗ Close]│ ║
║  │    projects/jira-wrapper                                     │ ║
║  ├──────────────────────────────────────────────────────────────┤ ║
║  │                                                              │ ║
║  │  ┌────────────┬─────────────┬──────────────────────────┐    │ ║
║  │  │ ⏱ Uptime   │ 💾 Memory   │ 🔀 Git Status            │    │ ║
║  │  │ 2h 34m     │ 156 MB      │ main • 3 uncommitted     │    │ ║
║  │  └────────────┴─────────────┴──────────────────────────┘    │ ║
║  │                                                              │ ║
║  │  📁 Full Path: /mnt/c/Users/.../projects/jira-wrapper       │ ║
║  │  🔗 URL: http://localhost:5174                              │ ║
║  │                                                              │ ║
║  │  [🔄 Restart] [📋 Copy Port] [📄 Logs] [⊗ Force Close]      │ ║
║  │                                                              │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ ⚪ lastfm-clone                         Port 5175    [▶ Launch]│ ║
║  │    projects/lastfm-clone                                     │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

### Mobile Wireframe

```
┌───────────────────────┐
│ ☰  Projects    ⚪ 2/8 │
├───────────────────────┤
│                       │
│ ┌───────────────────┐ │
│ │ ⚪ google-cal...  │ │
│ │ Port 5173         │ │
│ │                   │ │
│ │ [Launch ────────] │ │
│ └───────────────────┘ │
│                       │
│ ┌───────────────────┐ │
│ │ 🟢 jira-wrapper   │ │
│ │ Port 5174         │ │
│ │                   │ │
│ │ ── Expanded ──    │ │
│ │                   │ │
│ │ ⏱ Running: 2h 34m │ │
│ │ 💾 Memory: 156 MB │ │
│ │ 🔀 main • 3 mods  │ │
│ │                   │ │
│ │ localhost:5174    │ │
│ │                   │ │
│ │ [Restart][Close]  │ │
│ └───────────────────┘ │
│                       │
│ ┌───────────────────┐ │
│ │ ⚪ lastfm-clone   │ │
│ │ Port 5175         │ │
│ │ [Launch ────────] │ │
│ └───────────────────┘ │
│                       │
└───────────────────────┘
```

---

## Design Rationale

### Why Single Column List?

1. **Cognitive Load:** Scanning vertically is faster than grid scanning
2. **Information Density:** More projects visible without scrolling
3. **Consistency:** Mirrors common developer tools (VS Code, terminal)
4. **Responsive:** Single column adapts to any screen width
5. **Expandability:** Horizontal space for rich metadata

### Why Progressive Disclosure?

1. **Default Simplicity:** Most users just need to see running status
2. **Advanced Details:** Power users can access git/memory data
3. **Performance:** Reduced DOM nodes (expanded content conditionally rendered)
4. **Focus:** Less visual clutter = faster decision making

### Why 48px Row Height?

1. **Density vs Accessibility:** Balance between compact and touch-friendly
2. **Standard:** Common in design systems (Material: 48dp, iOS: 44pt)
3. **Rhythm:** Divisible by 8px (grid alignment)
4. **Content Fit:** Accommodates two lines of text (name + path)

### Why Allow Multiple Expansions?

1. **Comparison:** Developers often compare running processes
2. **Flexibility:** Don't force accordion behavior
3. **Power User:** Advanced users keep multiple rows open
4. **No Harm:** Expanded rows scroll naturally

### Why Pulse Animation on Status?

1. **Attention:** Draws eye to running projects
2. **Alive:** Conveys active process (not static)
3. **Familiar:** Common pattern in dashboards/UIs
4. **Subtle:** Slow 2s animation, not distracting

---

## Future Enhancements

### Phase 2 Features

1. **Search/Filter**
   - Filter by status (running/stopped)
   - Search by project name
   - Filter by port number

2. **Bulk Actions**
   - Select multiple rows (checkboxes)
   - Launch all / Stop all
   - Restart selected

3. **Sorting**
   - Sort by name (A-Z, Z-A)
   - Sort by status (running first)
   - Sort by port number
   - Sort by uptime

4. **View Logs**
   - Inline log viewer in expanded section
   - Stream real-time logs
   - Download logs button

5. **Custom Metadata**
   - Allow users to add custom fields
   - Display environment variables
   - Show build/deploy status

6. **Drag to Reorder**
   - Persist custom order in localStorage
   - Visual drag handles
   - Smooth reordering animation

---

**Document Version:** 1.0
**Created:** 2025-11-23
**Author:** UI/UX Design Specification
**Next Review:** After developer implementation feedback
**Status:** Ready for Development

---

## Appendix: Design Tokens

```json
{
  "spacing": {
    "row-height-collapsed": "48px",
    "row-height-expanded-min": "120px",
    "row-height-expanded-max": "180px",
    "row-padding-x": "16px",
    "row-padding-y": "12px",
    "row-gap": "8px",
    "metadata-grid-gap": "16px",
    "action-buttons-gap": "8px"
  },
  "colors": {
    "status-running": "hsl(280 80% 70%)",
    "status-stopped": "hsl(270 20% 70%)",
    "status-launching": "hsl(45 90% 60%)",
    "status-error": "hsl(0 70% 60%)"
  },
  "animations": {
    "expand-duration": "300ms",
    "fade-duration": "200ms",
    "pulse-duration": "2000ms",
    "pulse-fast-duration": "1000ms",
    "spring-easing": "cubic-bezier(0.34, 1.56, 0.64, 1)"
  },
  "typography": {
    "project-name-size": "16px",
    "project-name-weight": "500",
    "port-label-size": "12px",
    "metadata-value-size": "14px"
  }
}
```

---

This specification should provide all necessary details for implementation without ambiguity. Developers can reference specific sections (colors, spacing, animations) during coding, and designers can validate the implementation against these specifications.
