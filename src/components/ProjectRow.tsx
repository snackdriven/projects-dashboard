/**
 * ProjectRow Component
 *
 * Displays a single project as a collapsible row in the compact list view.
 * Handles collapsed (48px) and expanded states with animations.
 *
 * Wave 2 - Agent 6: Individual Row Component
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, X, ExternalLink, Loader2, ChevronDown } from 'lucide-react';
import type { ProjectMetadata, ProjectAction } from '@/types';
import {
  useExpandAnimation,
  useStatusAnimation,
  actionButtonVariants,
  chevronVariants,
} from '@/animations/list-animations';
import { ProjectDetails } from './ProjectDetails';
// Note: Using inline button for now to avoid workspace dependency issues during build
// import { Button } from '@projects-dashboard/ui';
import { cn } from '@/lib/utils';

/**
 * Inline Button component for ProjectRow
 * TODO: Replace with shared Button component once workspace imports are resolved
 */
function Button({
  size = 'md',
  variant = 'primary',
  onClick,
  className,
  children,
  ...props
}: {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  children: React.ReactNode;
  'aria-label'?: string;
}) {
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const variantStyles = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'rounded-lg font-medium transition-colors duration-200',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/**
 * Props interface for ProjectRow component
 */
export interface ProjectRowProps {
  readonly project: ProjectMetadata;
  readonly isExpanded: boolean;
  readonly isFocused: boolean;
  readonly onToggleExpand: () => void;
  readonly onAction: (action: ProjectAction) => void;
  readonly onFocus?: () => void;
  readonly className?: string;
}

/**
 * StatusIndicator - Visual status dot with animations
 *
 * Displays a colored dot with appropriate animations based on project state:
 * - Stopped: Gray, static
 * - Launching: Yellow, fast pulse
 * - Running: Green, slow pulse
 * - Error: Red, static
 */
function StatusIndicator({ status }: { status: ProjectMetadata['status']['state'] }) {
  const statusAnimationProps = useStatusAnimation(status);

  const colors = {
    stopped: 'bg-gray-400 dark:bg-gray-500',
    launching: 'bg-yellow-400 dark:bg-yellow-500',
    running: 'bg-green-500 dark:bg-green-400',
    error: 'bg-red-500 dark:bg-red-400',
  };

  return (
    <motion.div
      {...statusAnimationProps}
      className={cn('w-2 h-2 rounded-full flex-shrink-0', colors[status])}
      aria-label={`Status: ${status}`}
    />
  );
}

/**
 * ActionButtons - Shows contextual action buttons
 *
 * Fades in on hover/focus. Shows different buttons based on project state:
 * - Stopped: Launch button
 * - Launching: Loading spinner
 * - Running: Open in browser + Stop buttons
 *
 * Always shows chevron indicator for expand/collapse state.
 */
function ActionButtons({
  project,
  isVisible,
  isExpanded,
  onAction,
}: {
  project: ProjectMetadata;
  isVisible: boolean;
  isExpanded: boolean;
  onAction: (action: ProjectAction) => void;
}) {
  const { status } = project;
  const isRunning = status.state === 'running';
  const isLaunching = status.state === 'launching';

  return (
    <motion.div
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={actionButtonVariants}
      className="flex items-center gap-2"
    >
      {isRunning ? (
        <>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onAction({ type: 'open', projectName: project.name });
            }}
            aria-label={`Open ${project.name} in browser`}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              onAction({ type: 'stop', projectName: project.name });
            }}
            aria-label={`Stop ${project.name}`}
          >
            <X className="w-4 h-4" />
          </Button>
        </>
      ) : isLaunching ? (
        <Loader2 className="w-4 h-4 animate-spin text-yellow-500" aria-label="Launching..." />
      ) : (
        <Button
          size="sm"
          variant="primary"
          onClick={(e) => {
            e.stopPropagation();
            onAction({ type: 'launch', projectName: project.name });
          }}
          aria-label={`Launch ${project.name}`}
        >
          <Play className="w-4 h-4" />
        </Button>
      )}

      {/* Chevron indicator for expand/collapse */}
      <motion.div
        variants={chevronVariants}
        animate={isExpanded ? 'expanded' : 'collapsed'}
        className="ml-1"
      >
        <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
      </motion.div>
    </motion.div>
  );
}

/**
 * ProjectRow - Main component
 *
 * The core building block of the compact list view. Each row displays:
 *
 * **Collapsed State (48px):**
 * - Status indicator (pulsing dot)
 * - Project name (truncated if too long)
 * - Port number
 * - Action buttons (on hover/focus)
 * - Chevron icon (expand indicator)
 *
 * **Expanded State (auto height):**
 * - Same top row as collapsed
 * - ProjectDetails component below (built by Agent 7)
 *
 * **Visual States:**
 * - Default: Light background, subtle border
 * - Hover: Slightly darker background, actions visible
 * - Focus: Primary color ring (keyboard navigation)
 * - Running: Green accent gradient + left border
 * - Launching: Yellow accent gradient
 * - Error: Red accent gradient + left border
 *
 * **Interactions:**
 * - Click anywhere to expand/collapse
 * - Hover to show action buttons
 * - Keyboard focus for navigation
 * - Actions stop propagation (don't trigger expand)
 *
 * @example
 * ```tsx
 * <ProjectRow
 *   project={projectData}
 *   isExpanded={expandedSet.has(projectData.name)}
 *   isFocused={focusedIndex === index}
 *   onToggleExpand={() => toggleExpand(projectData.name)}
 *   onAction={handleAction}
 *   onFocus={() => setFocusedIndex(index)}
 * />
 * ```
 */
export const ProjectRow = React.memo(function ProjectRow({
  project,
  isExpanded,
  isFocused,
  onToggleExpand,
  onAction,
  onFocus,
  className,
}: ProjectRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Animations from Wave 1
  const expandAnimationProps = useExpandAnimation(isExpanded);

  // Memoized state checks for performance
  const isRunning = useMemo(() => project.status.state === 'running', [project.status.state]);
  const isLaunching = useMemo(() => project.status.state === 'launching', [project.status.state]);
  const isError = useMemo(() => project.status.state === 'error', [project.status.state]);

  // Event handlers with useCallback to prevent unnecessary re-renders
  const handleClick = useCallback(() => {
    onToggleExpand();
  }, [onToggleExpand]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleFocus = useCallback(() => {
    if (onFocus) {
      onFocus();
    }
  }, [onFocus]);

  // Dynamic CSS classes based on component state
  const baseClasses = 'relative cursor-pointer border-b border-border transition-all duration-200';

  const stateClasses = cn(
    baseClasses,
    // Hover state - subtle background highlight
    'hover:bg-muted/50',
    // Focus state - primary ring for keyboard navigation
    isFocused && 'ring-2 ring-primary ring-offset-2 ring-offset-background z-10',
    // Running state - green gradient with left accent border
    isRunning && 'bg-gradient-to-r from-green-500/5 to-transparent border-l-2 border-l-green-500',
    // Launching state - yellow gradient
    isLaunching && 'bg-gradient-to-r from-yellow-500/5 to-transparent',
    // Error state - red gradient with left accent border
    isError && 'bg-gradient-to-r from-red-500/5 to-transparent border-l-2 border-l-red-500',
    // Expanded state - primary border and shadow
    isExpanded && 'border-primary/40 shadow-md shadow-primary/10',
    // Custom className override
    className
  );

  return (
    <motion.div
      {...expandAnimationProps}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      role="listitem"
      aria-expanded={isExpanded}
      aria-label={`${project.name}, ${project.status.state}, port ${project.port}`}
      tabIndex={isFocused ? 0 : -1}
      className={stateClasses}
      style={{ overflow: 'hidden' }}
    >
      {/* Collapsed content (always visible) - 48px height */}
      <div className="flex items-center justify-between h-12 px-4">
        {/* Left side: Status + Name + Port */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <StatusIndicator status={project.status.state} />
          <span className="font-medium text-base truncate">{project.name}</span>
          <span className="text-xs text-muted-foreground">:{project.port}</span>
        </div>

        {/* Right side: Actions (fade in on hover/focus) */}
        <ActionButtons
          project={project}
          isVisible={isHovered || isFocused}
          isExpanded={isExpanded}
          onAction={onAction}
        />
      </div>

      {/* Expanded content (conditionally rendered) */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="border-t border-border"
        >
          <ProjectDetails project={project} onAction={onAction} />
        </motion.div>
      )}
    </motion.div>
  );
});
