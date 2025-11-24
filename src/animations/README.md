# List Animation System

A comprehensive, reusable animation system for the compact project list view built with Framer Motion.

## Overview

This animation system provides ready-to-use animation variants and hooks for building performant, accessible list interfaces. All animations respect the user's `prefers-reduced-motion` accessibility setting.

## Files

- `list-animations.ts` - Core animation variants, hooks, and utilities
- `CompactListDemo.tsx` - Working demo component showing all animations

## Quick Start

### 1. Basic Row Expand/Collapse

```tsx
import { useExpandAnimation } from './animations/list-animations';
import { motion } from 'framer-motion';

function ProjectRow({ isExpanded }) {
  const expandProps = useExpandAnimation(isExpanded);

  return (
    <motion.div {...expandProps} style={{ overflow: 'hidden' }}>
      {/* Row content */}
    </motion.div>
  );
}
```

### 2. Status Indicator

```tsx
import { useStatusAnimation } from './animations/list-animations';
import { Circle } from 'lucide-react';

function StatusIndicator({ status }) {
  const statusProps = useStatusAnimation(status); // 'stopped' | 'running' | 'launching'

  return (
    <motion.div {...statusProps}>
      <Circle className="w-2 h-2 fill-current" />
    </motion.div>
  );
}
```

### 3. Hover Animations

```tsx
import { useHoverAnimation, rowHoverVariants } from './animations/list-animations';

function ProjectRow() {
  const { isHovered, hoverProps, animationProps } = useHoverAnimation();

  return (
    <motion.div
      variants={rowHoverVariants}
      animate={isHovered ? 'hover' : 'idle'}
      {...hoverProps}
    >
      <div>Always visible content</div>

      {/* Action buttons fade in on hover */}
      <motion.button {...animationProps}>
        Action
      </motion.button>
    </motion.div>
  );
}
```

### 4. Expandable Details

```tsx
import { useDetailsAnimation } from './animations/list-animations';

function ProjectRow({ isExpanded }) {
  const { containerProps, itemProps } = useDetailsAnimation(isExpanded);

  return (
    <div>
      <div>Main content</div>

      {isExpanded && (
        <motion.div {...containerProps}>
          <motion.div {...itemProps}>Detail 1</motion.div>
          <motion.div {...itemProps}>Detail 2</motion.div>
          <motion.div {...itemProps}>Detail 3</motion.div>
        </motion.div>
      )}
    </div>
  );
}
```

### 5. List Mount Animation

```tsx
import { useListAnimation } from './animations/list-animations';

function ProjectList({ projects }) {
  const { containerProps, itemProps } = useListAnimation();

  return (
    <motion.div {...containerProps}>
      {projects.map(project => (
        <motion.div key={project.id} {...itemProps}>
          <ProjectRow project={project} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### 6. Focus Ring (Keyboard Navigation)

```tsx
import { useFocusAnimation } from './animations/list-animations';

function ProjectRow({ isFocused }) {
  const focusProps = useFocusAnimation(isFocused);

  return (
    <div className="relative">
      <div>Row content</div>

      {isFocused && (
        <motion.div
          {...focusProps}
          className="absolute inset-0 ring-2 ring-primary rounded pointer-events-none"
        />
      )}
    </div>
  );
}
```

## Available Hooks

### `useExpandAnimation(isExpanded: boolean)`
Returns animation props for row expand/collapse (48px ↔ auto).

### `useStatusAnimation(status: 'stopped' | 'running' | 'launching')`
Returns pulsing animation props based on project status.

### `useHoverAnimation()`
Returns hover state and animation props for buttons/actions.

### `useFocusAnimation(isFocused: boolean)`
Returns spring-based animation props for focus indicator.

### `useDetailsAnimation(isExpanded: boolean)`
Returns stagger animation props for expandable content.

### `useListAnimation()`
Returns stagger animation props for initial list mount.

### `useReducedMotion()`
Detects user's reduced motion preference. Auto-applied by all hooks.

## Available Variants

All variants can be used directly with Framer Motion's `variants` prop:

- `rowVariants` - Row expand/collapse
- `statusDotVariants` - Status indicator pulsing
- `actionButtonVariants` - Button fade in/out
- `rowHoverVariants` - Row background highlight
- `focusRingVariants` - Focus indicator
- `detailsContainerVariants` - Details container
- `detailsItemVariants` - Individual detail items
- `shimmerVariants` - Loading skeleton shimmer
- `listContainerVariants` - List container
- `listItemVariants` - Individual list items
- `chevronVariants` - Chevron icon rotation

## Utility Functions

### `getAnimationConfig(reducedMotion: boolean, defaultDuration: number)`
Returns transition config respecting reduced motion.

### `getSpringConfig(reducedMotion: boolean)`
Returns spring transition config.

### `getStaggerConfig(reducedMotion: boolean, staggerDelay: number)`
Returns stagger transition config.

### `shouldElementAnimate(element: HTMLElement | null)`
Performance check - only animate elements in viewport.

## Performance Best Practices

### 1. Use CSS Transforms
```tsx
// Good - uses transforms (GPU accelerated)
<motion.div animate={{ x: 100, scale: 1.2 }} />

// Avoid - triggers layout recalculation
<motion.div animate={{ width: 200, marginLeft: 50 }} />
```

### 2. Add `will-change` for Height Animations
```tsx
<motion.div
  {...expandProps}
  style={{ overflow: 'hidden', willChange: 'height' }}
/>
```

### 3. Use `overflow: hidden` During Transitions
```tsx
<motion.div
  {...expandProps}
  style={{ overflow: isExpanded ? 'visible' : 'hidden' }}
/>
```

### 4. Limit Simultaneous Animations
```tsx
// Don't animate all 8 rows at once
// Use conditional rendering or viewport checks
{visibleProjects.map(project => (
  <AnimatedRow key={project.id} />
))}
```

### 5. Memoize Heavy Components
```tsx
import { memo } from 'react';

const ProjectRow = memo(function ProjectRow({ project, isExpanded }) {
  // Component logic
});
```

## Accessibility

All animations automatically respect the user's `prefers-reduced-motion` setting:

```css
/* User has this setting enabled */
@media (prefers-reduced-motion: reduce) {
  /* All animations have duration: 0 */
}
```

The `useReducedMotion()` hook is automatically applied by all animation hooks. No extra work needed!

## Animation Timings

| Animation | Duration | Easing | Notes |
|-----------|----------|--------|-------|
| Row expand/collapse | 0.3s | easeOut | Height transition |
| Status pulse (running) | 2s | easeInOut | Infinite loop |
| Status pulse (launching) | 1.5s | easeInOut | Infinite loop |
| Action button fade | 0.2s | default | On hover |
| Row hover background | 0.2s | default | Subtle |
| Focus ring | spring | 300/20 | Stiffness/damping |
| Details stagger | 0.05s | default | Between children |
| List mount stagger | 0.05s | default | Between items |
| Chevron rotation | 0.3s | easeOut | 0° ↔ 180° |

## Common Patterns

### Pattern: Expandable Row with All Features
```tsx
function FullFeaturedRow({ project, isFocused, onFocus }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const expandProps = useExpandAnimation(isExpanded);
  const statusProps = useStatusAnimation(project.status);
  const { isHovered, hoverProps, animationProps } = useHoverAnimation();
  const focusProps = useFocusAnimation(isFocused);
  const { containerProps, itemProps } = useDetailsAnimation(isExpanded);

  return (
    <motion.div
      variants={rowHoverVariants}
      animate={isHovered ? 'hover' : 'idle'}
      onFocus={onFocus}
      tabIndex={0}
      {...hoverProps}
    >
      {/* Main row */}
      <div onClick={() => setIsExpanded(!isExpanded)}>
        <motion.div {...statusProps}>
          <Circle className="w-2 h-2" />
        </motion.div>

        <span>{project.name}</span>

        <motion.button {...animationProps}>
          Action
        </motion.button>

        <motion.div
          variants={chevronVariants}
          animate={isExpanded ? 'expanded' : 'collapsed'}
        >
          <ChevronDown />
        </motion.div>
      </div>

      {/* Expandable details */}
      {isExpanded && (
        <motion.div {...containerProps}>
          <motion.div {...itemProps}>Detail 1</motion.div>
          <motion.div {...itemProps}>Detail 2</motion.div>
        </motion.div>
      )}

      {/* Focus ring */}
      {isFocused && (
        <motion.div
          {...focusProps}
          className="absolute inset-0 ring-2 ring-primary"
        />
      )}
    </motion.div>
  );
}
```

### Pattern: Loading Skeleton
```tsx
import { shimmerVariants } from './animations/list-animations';

function LoadingSkeleton() {
  return (
    <motion.div
      variants={shimmerVariants}
      animate="animate"
      className="h-12 rounded bg-gradient-to-r from-muted via-muted-foreground/20 to-muted"
      style={{
        backgroundSize: '200% 100%',
        willChange: 'background-position'
      }}
    />
  );
}
```

### Pattern: Keyboard Navigation List
```tsx
function ProjectList({ projects }) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const { containerProps, itemProps } = useListAnimation();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => Math.min(prev + 1, projects.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => Math.max(prev - 1, 0));
    }
  };

  return (
    <motion.div
      {...containerProps}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {projects.map((project, index) => (
        <motion.div key={project.id} {...itemProps}>
          <ProjectRow
            project={project}
            isFocused={focusedIndex === index}
            onFocus={() => setFocusedIndex(index)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

## Testing Animations

### View the Demo
```bash
# Add to src/App.tsx temporarily:
import { CompactListDemo } from './animations/CompactListDemo';

function App() {
  return <CompactListDemo />;
}
```

### Test Reduced Motion
```javascript
// In browser DevTools Console:
// Enable reduced motion
document.body.style.setProperty('prefers-reduced-motion', 'reduce');
```

### Performance Monitoring
```tsx
import { Profiler } from 'react';

<Profiler id="ProjectList" onRender={(id, phase, actualDuration) => {
  console.log(`${id} ${phase} took ${actualDuration}ms`);
}}>
  <ProjectList />
</Profiler>
```

## Troubleshooting

### Animation feels janky
1. Add `overflow: hidden` during transition
2. Add `will-change: height` or `will-change: transform`
3. Reduce number of simultaneous animations
4. Check if element is doing layout recalculation (use DevTools Performance tab)

### Height animation not smooth
```tsx
// Ensure parent has overflow hidden
<motion.div
  {...expandProps}
  style={{
    overflow: 'hidden',
    willChange: 'height'
  }}
/>
```

### Stagger not working
```tsx
// Make sure parent has variants and animate
<motion.div variants={containerVariants} animate="visible">
  {/* Children need variants too */}
  <motion.div variants={itemVariants}>Child</motion.div>
</motion.div>
```

### Focus ring not showing
```tsx
// Element must be focusable
<div tabIndex={0} onFocus={...}>
```

## Migration from Current App

Current app uses these animation patterns:
```tsx
// Old pattern
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
/>

// New pattern (with animation system)
const { itemProps } = useListAnimation();
<motion.div {...itemProps} />
```

Benefits:
- Consistent timing across all components
- Automatic reduced motion support
- Less code duplication
- Better performance (memoized variants)

## Future Enhancements

Potential additions for future waves:
- `useSwipeAnimation()` for mobile swipe-to-delete
- `useDragAnimation()` for drag-and-drop reordering
- `useSharedTransition()` for page transitions
- `useScrollAnimation()` for scroll-triggered reveals

## Questions?

Check the demo component (`CompactListDemo.tsx`) for a complete working example of all animations in action.
