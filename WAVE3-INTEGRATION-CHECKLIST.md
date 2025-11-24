# Wave 3 Integration Checklist - CompactList

Quick reference for integrating the CompactList component into the dashboard.

---

## Pre-Integration Checklist

### 1. Install Dependencies

```bash
cd /mnt/c/Users/bette/Desktop/projects-dashboard
pnpm add clsx tailwind-merge lucide-react
```

**Verify installation:**
```bash
pnpm list | grep -E "clsx|tailwind-merge|lucide-react"
```

### 2. Verify TypeScript Configuration

**Check `tsconfig.json` has path aliases:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Check `vite.config.ts` has path aliases:**
```typescript
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 3. Verify Type Check Passes

```bash
pnpm type-check
# Should output: No errors
```

---

## Integration Steps

### Step 1: Import Component in App.tsx

```typescript
import { CompactList } from '@/components/CompactList';
import type { ProjectAction } from '@/types';
```

### Step 2: Create Action Handler

```typescript
const handleProjectAction = async (action: ProjectAction) => {
  try {
    switch (action.type) {
      case 'launch':
        await launchProject(action.projectName);
        break;
      case 'stop':
        await stopProject(action.projectName);
        break;
      case 'restart':
        await restartProject(action.projectName);
        break;
      case 'open':
        openInBrowser(action.projectName);
        break;
      case 'copyPort':
        await copyPortToClipboard(action.projectName);
        break;
      case 'copyUrl':
        await copyUrlToClipboard(action.projectName);
        break;
      case 'viewLogs':
        showLogs(action.projectName);
        break;
      case 'openInEditor':
        openInEditor(action.projectName, action.editor);
        break;
    }
  } catch (error) {
    console.error('Action failed:', error);
    // TODO: Show error toast
  }
};
```

### Step 3: Replace Existing Project List

**Before:**
```tsx
<div className="grid grid-cols-3 gap-4">
  {projects.map(project => (
    <ProjectCard key={project.name} project={project} />
  ))}
</div>
```

**After:**
```tsx
<CompactList
  projects={projects}
  onProjectAction={handleProjectAction}
/>
```

---

## Post-Integration Testing

### Manual Tests (Required)

Run through each of these tests in the browser:

#### 1. Keyboard Navigation
- [ ] Press `j` - focus moves down
- [ ] Press `k` - focus moves up
- [ ] Press `Home` - focus moves to first row
- [ ] Press `End` - focus moves to last row
- [ ] Press `Tab` - focus moves to next interactive element
- [ ] Focus ring is visible (2px primary color ring)

#### 2. Expansion
- [ ] Click any row - row expands
- [ ] Click expanded row - row collapses
- [ ] Press `Enter` on focused row - row toggles
- [ ] Multiple rows can be expanded simultaneously
- [ ] Chevron icon rotates when expanding/collapsing

#### 3. Actions - Stopped Projects
- [ ] Press `Enter` on stopped project - launches
- [ ] Click "Launch" button - launches
- [ ] Loading spinner shows during launch

#### 4. Actions - Running Projects
- [ ] Press `Enter` on running project - opens in browser
- [ ] Press `x` - stops project
- [ ] Press `o` - opens in browser
- [ ] Click "Stop" button - stops project
- [ ] Click "Open" button - opens in browser

#### 5. Actions - Expanded State
- [ ] Press `c` on expanded row - copies port
- [ ] Press `r` on running project - restarts
- [ ] Press `Esc` on expanded row - collapses
- [ ] Action buttons work correctly

#### 6. Visual States
- [ ] Hover shows action buttons (fade in)
- [ ] Running projects have green gradient background
- [ ] Stopped projects have default background
- [ ] Launching projects have yellow gradient
- [ ] Expanded rows have primary border and shadow

#### 7. Empty State
- [ ] Set `projects = []`
- [ ] Ghost icon displays
- [ ] Message shows "No projects found"

#### 8. Accessibility
- [ ] Keyboard navigation works without mouse
- [ ] Screen reader announces focus changes (test with NVDA/JAWS)
- [ ] All interactive elements are keyboard accessible
- [ ] Color contrast meets WCAG AA (use browser devtools)

#### 9. Animations
- [ ] List fades in on mount
- [ ] Items stagger in on mount
- [ ] Expand/collapse is smooth
- [ ] Action buttons fade in/out on hover
- [ ] Respects `prefers-reduced-motion` (test in browser settings)

#### 10. Performance
- [ ] No lag with 8+ projects
- [ ] Smooth 60fps animations
- [ ] No memory leaks (check devtools Memory tab)

---

## Automated Tests (Optional)

### Type Check
```bash
pnpm type-check
```

### Build Test
```bash
pnpm build
```

### Lint
```bash
pnpm lint
```

---

## Common Issues & Solutions

### Issue: TypeScript errors about `@/types`
**Solution:** Verify path aliases in `tsconfig.json` and `vite.config.ts`

### Issue: "Cannot find module 'clsx'"
**Solution:** Run `pnpm install` from project root

### Issue: Keyboard navigation doesn't work
**Solution:** Check that container receives focus on mount

### Issue: Focus ring not visible
**Solution:** Check that ProjectRow applies focus styles when `isFocused={true}`

### Issue: Animations not smooth
**Solution:** Check browser devtools Performance tab, ensure GPU acceleration

### Issue: Screen reader doesn't announce focus
**Solution:** Verify `.sr-only` class exists in CSS and ARIA live region renders

---

## Rollback Plan

If integration causes issues, revert with:

```bash
git checkout HEAD -- src/App.tsx
```

Or manually restore previous project list code.

---

## Success Criteria

Integration is complete when:
- ✅ All manual tests pass
- ✅ TypeScript builds without errors
- ✅ Keyboard navigation works
- ✅ Actions execute correctly
- ✅ Accessibility verified
- ✅ Animations smooth
- ✅ No console errors
- ✅ No memory leaks

---

## Next Steps After Integration

1. Add search/filter functionality
2. Add view toggle (list/grid)
3. Add loading skeleton UI
4. Add error handling UI
5. Add toast notifications
6. Persist expansion state to localStorage
7. Add keyboard shortcuts modal
8. Optimize for 50+ projects (virtualization)

---

**Quick Start:**
```bash
# 1. Install deps
pnpm add clsx tailwind-merge lucide-react

# 2. Type check
pnpm type-check

# 3. Import in App.tsx
import { CompactList } from '@/components/CompactList';

# 4. Replace project list
<CompactList projects={projects} onProjectAction={handleAction} />

# 5. Test
pnpm dev
```

**Questions?** Check `/mnt/c/Users/bette/Desktop/projects-dashboard/WAVE2-COMPACTLIST-SUMMARY.md`
