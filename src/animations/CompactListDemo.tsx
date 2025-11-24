/**
 * Compact List Demo Component
 *
 * This demo showcases how to use the list-animations system.
 * Wave 2 developers can reference this as a working example.
 *
 * @module CompactListDemo
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Play, Circle, ExternalLink } from 'lucide-react';
import {
  useStatusAnimation,
  useHoverAnimation,
  useFocusAnimation,
  useDetailsAnimation,
  useListAnimation,
  chevronVariants,
  rowHoverVariants,
  type ProjectStatus
} from './list-animations';

// Sample data
const sampleProjects = [
  {
    id: 1,
    name: 'google-calendar-clone',
    port: 5173,
    status: 'running' as ProjectStatus,
    lastModified: '2 hours ago',
    framework: 'React 19',
    dependencies: 24
  },
  {
    id: 2,
    name: 'jira-wrapper',
    port: 5174,
    status: 'stopped' as ProjectStatus,
    lastModified: '1 day ago',
    framework: 'React 19',
    dependencies: 18
  },
  {
    id: 3,
    name: 'lastfm-clone',
    port: 5175,
    status: 'launching' as ProjectStatus,
    lastModified: '3 hours ago',
    framework: 'React 19',
    dependencies: 32
  },
];

/**
 * Individual compact list row component
 * Demonstrates all animations in action
 */
function CompactProjectRow({
  project,
  isFocused,
  onFocus
}: {
  project: typeof sampleProjects[0];
  isFocused: boolean;
  onFocus: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Animation hooks
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
      className="relative rounded-lg border border-border overflow-hidden cursor-pointer"
      style={{ willChange: 'height' }}
      {...hoverProps}
    >
      {/* Main row (always visible) */}
      <div
        className="flex items-center justify-between px-4 h-12 gap-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Left: Status + Name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Status indicator */}
          <motion.div {...statusProps}>
            <Circle className="w-2 h-2 fill-current" />
          </motion.div>

          {/* Project name */}
          <span className="text-sm font-medium truncate">
            {project.name}
          </span>

          {/* Status badge */}
          <span className="text-xs text-muted-foreground">
            {project.status === 'running' && '✨ Running'}
            {project.status === 'launching' && '🚀 Launching'}
            {project.status === 'stopped' && '💤 Stopped'}
          </span>
        </div>

        {/* Right: Port + Actions */}
        <div className="flex items-center gap-3">
          {/* Port number */}
          <span className="text-xs text-muted-foreground font-mono">
            :{project.port}
          </span>

          {/* Action buttons (fade in on hover) */}
          <motion.button
            {...animationProps}
            className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Open project');
            }}
          >
            <ExternalLink className="w-4 h-4" />
          </motion.button>

          <motion.button
            {...animationProps}
            className="p-1.5 rounded hover:bg-primary/10 text-primary"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Launch project');
            }}
          >
            <Play className="w-4 h-4" />
          </motion.button>

          {/* Expand chevron */}
          <motion.div
            variants={chevronVariants}
            animate={isExpanded ? 'expanded' : 'collapsed'}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
      </div>

      {/* Expandable details section */}
      {isExpanded && (
        <motion.div
          {...containerProps}
          className="px-4 pb-4 border-t border-border bg-muted/20"
        >
          <div className="pt-3 grid grid-cols-3 gap-4">
            <motion.div {...itemProps}>
              <div className="text-xs text-muted-foreground">Last Modified</div>
              <div className="text-sm font-medium">{project.lastModified}</div>
            </motion.div>

            <motion.div {...itemProps}>
              <div className="text-xs text-muted-foreground">Framework</div>
              <div className="text-sm font-medium">{project.framework}</div>
            </motion.div>

            <motion.div {...itemProps}>
              <div className="text-xs text-muted-foreground">Dependencies</div>
              <div className="text-sm font-medium">{project.dependencies}</div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Focus ring indicator */}
      {isFocused && (
        <motion.div
          {...focusProps}
          className="absolute inset-0 rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background pointer-events-none"
        />
      )}
    </motion.div>
  );
}

/**
 * Main compact list demo component
 * Demonstrates list-level animations with stagger
 */
export function CompactListDemo() {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const { containerProps, itemProps } = useListAnimation();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Compact List Animation Demo</h2>
        <p className="text-muted-foreground text-sm">
          This demonstrates all animations from list-animations.ts
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Try hovering, clicking to expand, and using arrow keys to navigate
        </p>
      </div>

      {/* Animated list */}
      <motion.div
        {...containerProps}
        className="space-y-2"
      >
        {sampleProjects.map((project, index) => (
          <motion.div key={project.id} {...itemProps}>
            <CompactProjectRow
              project={project}
              isFocused={focusedIndex === index}
              onFocus={() => setFocusedIndex(index)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Usage instructions */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
        <h3 className="text-sm font-semibold mb-2">Animation Features:</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>✓ Smooth row expand/collapse (height: 48px → auto)</li>
          <li>✓ Status dot pulsing (running = slow, launching = fast)</li>
          <li>✓ Action buttons fade in on hover</li>
          <li>✓ Row background highlight on hover</li>
          <li>✓ Focus ring with spring animation</li>
          <li>✓ Staggered detail items reveal</li>
          <li>✓ Chevron rotation (0° → 180°)</li>
          <li>✓ List mount stagger animation</li>
          <li>✓ Respects prefers-reduced-motion</li>
        </ul>
      </div>
    </div>
  );
}

export default CompactListDemo;
