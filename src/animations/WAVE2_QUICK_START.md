# Wave 2 Quick Start Guide

Welcome Wave 2 developers! This guide will get you building animated compact list components in under 5 minutes.

## What You Get

A complete animation system with:
- ✅ All animations pre-built and tested
- ✅ TypeScript types included
- ✅ Accessibility (reduced motion) handled automatically
- ✅ Performance optimized
- ✅ Zero animation code needed (just use the hooks!)

## The 3 Core Hooks You'll Use

### 1. `useExpandAnimation(isExpanded)`
For row expand/collapse (48px → auto height)

```tsx
const expandProps = useExpandAnimation(isExpanded);
return <motion.div {...expandProps}>Content</motion.div>;
```

### 2. `useStatusAnimation(status)`
For pulsing status dots

```tsx
const statusProps = useStatusAnimation('running'); // or 'stopped' | 'launching'
return <motion.div {...statusProps}><Circle /></motion.div>;
```

### 3. `useHoverAnimation()`
For action buttons that fade in on hover

```tsx
const { isHovered, hoverProps, animationProps } = useHoverAnimation();
return (
  <motion.div {...hoverProps}>
    <motion.button {...animationProps}>Action</motion.button>
  </motion.div>
);
```

## Copy-Paste Template

Here's a complete compact row component you can customize:

```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Circle, ChevronDown, Play } from 'lucide-react';
import {
  useExpandAnimation,
  useStatusAnimation,
  useHoverAnimation,
  rowHoverVariants,
  chevronVariants
} from './animations/list-animations';

interface Project {
  name: string;
  port: number;
  status: 'stopped' | 'running' | 'launching';
}

function CompactRow({ project }: { project: Project }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get animation props
  const expandProps = useExpandAnimation(isExpanded);
  const statusProps = useStatusAnimation(project.status);
  const { isHovered, hoverProps, animationProps } = useHoverAnimation();

  return (
    <motion.div
      variants={rowHoverVariants}
      animate={isHovered ? 'hover' : 'idle'}
      className="border rounded-lg"
      style={{ overflow: 'hidden', willChange: 'height' }}
      {...hoverProps}
    >
      {/* Main row (48px height) */}
      <div
        className="flex items-center justify-between px-4 h-12"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Status + Name */}
        <div className="flex items-center gap-3">
          <motion.div {...statusProps}>
            <Circle className="w-2 h-2 fill-current" />
          </motion.div>
          <span className="font-medium">{project.name}</span>
        </div>

        {/* Actions + Chevron */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">:{project.port}</span>

          <motion.button {...animationProps} className="p-1.5">
            <Play className="w-4 h-4" />
          </motion.button>

          <motion.div
            variants={chevronVariants}
            animate={isExpanded ? 'expanded' : 'collapsed'}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </div>

      {/* Expandable details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t">
          <p className="text-sm text-muted-foreground mt-3">
            Additional project details here
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default CompactRow;
```

## Component Checklist

When building your compact row component, include these elements:

### Must Have
- [ ] Status indicator with pulsing animation
- [ ] Project name/title
- [ ] Port number display
- [ ] Action button(s) that fade in on hover
- [ ] Expand/collapse chevron with rotation
- [ ] 48px collapsed height
- [ ] Row hover background effect

### Should Have
- [ ] Expandable details section with metadata
- [ ] Focus ring for keyboard navigation
- [ ] Click to expand/collapse functionality
- [ ] `overflow: hidden` on expandable container
- [ ] `willChange: height` for performance

### Nice to Have
- [ ] Loading skeleton state
- [ ] Empty state handling
- [ ] Keyboard shortcuts (Enter to expand)
- [ ] Transition callbacks (onExpandComplete)

## File Structure

```
src/
├── animations/
│   ├── list-animations.ts         ← Import hooks from here
│   ├── CompactListDemo.tsx        ← Reference implementation
│   ├── README.md                  ← Full documentation
│   └── WAVE2_QUICK_START.md       ← This file
└── components/
    └── CompactProjectRow.tsx      ← Your component goes here
```

## Import What You Need

```tsx
// Core hooks (you'll use these)
import {
  useExpandAnimation,
  useStatusAnimation,
  useHoverAnimation,
  useFocusAnimation,
  useDetailsAnimation,
  useListAnimation,
} from './animations/list-animations';

// Variants (for custom animations)
import {
  rowHoverVariants,
  chevronVariants,
  actionButtonVariants,
} from './animations/list-animations';

// Types (for TypeScript)
import type { ProjectStatus } from './animations/list-animations';
```

## Common Mistakes to Avoid

### ❌ Forgetting overflow: hidden
```tsx
// Wrong - details will overflow during animation
<motion.div {...expandProps}>
```

```tsx
// Right - clean animation
<motion.div {...expandProps} style={{ overflow: 'hidden' }}>
```

### ❌ Not spreading props correctly
```tsx
// Wrong - missing spread operator
<motion.div expandProps>
```

```tsx
// Right - spread the props
<motion.div {...expandProps}>
```

### ❌ Using wrong status type
```tsx
// Wrong - status must be specific string
const statusProps = useStatusAnimation('online'); // Type error!
```

```tsx
// Right - use correct type
const statusProps = useStatusAnimation('running'); // ✓
```

### ❌ Animating layout properties
```tsx
// Wrong - causes jank
<motion.div animate={{ width: 200, marginLeft: 50 }} />
```

```tsx
// Right - use transforms
<motion.div animate={{ x: 50, scale: 1.2 }} />
```

## Testing Your Component

### 1. View the Demo First
```tsx
// Add to App.tsx temporarily
import { CompactListDemo } from './animations/CompactListDemo';

function App() {
  return <CompactListDemo />;
}
```

### 2. Test All States
- [ ] Stopped state (gray dot, no pulse)
- [ ] Running state (green dot, slow pulse)
- [ ] Launching state (yellow dot, fast pulse)
- [ ] Hover state (background changes, buttons appear)
- [ ] Expanded state (details slide down)
- [ ] Focus state (keyboard navigation)

### 3. Test Accessibility
Open DevTools Console and run:
```javascript
// Simulate reduced motion preference
window.matchMedia = () => ({ matches: true });
```
All animations should be instant (no duration).

## Performance Tips

1. **Add willChange for height animations**
   ```tsx
   style={{ willChange: 'height' }}
   ```

2. **Use overflow: hidden during transitions**
   ```tsx
   style={{ overflow: isExpanded ? 'visible' : 'hidden' }}
   ```

3. **Don't animate 8+ rows at once**
   - Stagger mount animations (handled automatically)
   - Use virtualization for 50+ items

4. **Memoize heavy components**
   ```tsx
   const CompactRow = memo(function CompactRow({ project }) {
     // ...
   });
   ```

## Need Help?

1. **Check the demo**: `src/animations/CompactListDemo.tsx` - Complete working example
2. **Read the docs**: `src/animations/README.md` - Full API documentation
3. **View the types**: `src/animations/list-animations.ts` - All TypeScript definitions

## Next Steps

1. Copy the template above into your component file
2. Customize the UI (keep the animation props!)
3. Add your project-specific logic
4. Test all states (stopped, running, launching, expanded)
5. Test keyboard navigation
6. Ship it! 🚀

## Example: Minimal Working Component

The absolute minimum to get started:

```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useExpandAnimation } from './animations/list-animations';

function MinimalRow({ project }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const expandProps = useExpandAnimation(isExpanded);

  return (
    <motion.div {...expandProps} style={{ overflow: 'hidden' }}>
      <div
        className="h-12 px-4 border"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {project.name}
      </div>
      {isExpanded && <div className="p-4">Details</div>}
    </motion.div>
  );
}
```

That's it! Add more animations as needed by importing more hooks.

---

**Remember**: The animation system handles all the complexity. You just spread the props and focus on your component logic! ✨
