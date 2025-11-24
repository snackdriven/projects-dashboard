/**
 * CompactList Component
 *
 * Main container component for the compact project list view.
 * Replaces the card-based grid with a single-column, information-dense layout.
 *
 * Features:
 * - Expansion state management (tracks which projects are expanded)
 * - Keyboard navigation (j/k for up/down, Enter for expand/launch)
 * - Focus management with visual indicators
 * - Accessibility (ARIA labels, screen reader support)
 * - Animations for list entrance and row interactions
 *
 * @module CompactList
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ghost } from 'lucide-react';
import type { ProjectMetadata, ProjectAction } from '@/types';
import { useListAnimation } from '@/animations/list-animations';
import { ProjectRow } from './ProjectRow';
import { cn } from '@/lib/utils';

/**
 * Props for the CompactList component
 */
interface CompactListProps {
  /** Array of project metadata to display */
  projects: ProjectMetadata[];
  /** Callback handler for all project actions */
  onProjectAction: (action: ProjectAction) => void;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * CompactList - Main container for the project list view
 *
 * Manages:
 * - Expansion state for each project
 * - Keyboard navigation focus
 * - List-level animations
 * - Empty state display
 *
 * @example
 * ```tsx
 * <CompactList
 *   projects={projects}
 *   onProjectAction={handleAction}
 *   className="my-4"
 * />
 * ```
 */
export function CompactList({ projects, onProjectAction, className }: CompactListProps) {
  // Track which projects are expanded (using Set for O(1) lookup)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Track which row currently has keyboard focus
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Reference to container element for focus management
  const containerRef = useRef<HTMLDivElement>(null);

  // Get animation props for list entrance
  const { containerProps, itemProps } = useListAnimation();

  /**
   * Toggle expansion state for a project
   * Uses functional update to ensure atomic state changes
   */
  const toggleExpansion = useCallback((projectName: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectName)) {
        next.delete(projectName);
      } else {
        next.add(projectName);
      }
      return next;
    });
  }, []);

  /**
   * Handle keyboard navigation and shortcuts
   *
   * Supported keys:
   * - j / ArrowDown: Move focus down
   * - k / ArrowUp: Move focus up
   * - Enter: Toggle expansion or perform default action
   * - x: Force close (if running)
   * - o: Open in browser (if running)
   * - /: Focus search (future feature)
   * - Escape: Collapse focused row if expanded
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const project = projects[focusedIndex];
    if (!project) return;

    const isExpanded = expandedProjects.has(project.name);

    // Navigation: j or Down Arrow
    if (e.key === 'j' || e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => Math.min(prev + 1, projects.length - 1));
      return;
    }

    // Navigation: k or Up Arrow
    if (e.key === 'k' || e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => Math.max(prev - 1, 0));
      return;
    }

    // Navigation: Home
    if (e.key === 'Home') {
      e.preventDefault();
      setFocusedIndex(0);
      return;
    }

    // Navigation: End
    if (e.key === 'End') {
      e.preventDefault();
      setFocusedIndex(projects.length - 1);
      return;
    }

    // Action: Enter key
    if (e.key === 'Enter') {
      e.preventDefault();

      // If collapsed and stopped, launch the project
      if (!isExpanded && project.status.state === 'stopped') {
        onProjectAction({ type: 'launch', projectName: project.name });
      }
      // If collapsed and running, open in browser
      else if (!isExpanded && project.status.state === 'running') {
        onProjectAction({ type: 'open', projectName: project.name });
      }
      // Otherwise, toggle expansion
      else {
        toggleExpansion(project.name);
      }
      return;
    }

    // Action: x = Force close (running projects only)
    if (e.key === 'x' || e.key === 'X') {
      if (project.status.state === 'running') {
        e.preventDefault();
        onProjectAction({ type: 'stop', projectName: project.name });
      }
      return;
    }

    // Action: o = Open in browser (running projects only)
    if (e.key === 'o' || e.key === 'O') {
      if (project.status.state === 'running') {
        e.preventDefault();
        onProjectAction({ type: 'open', projectName: project.name });
      }
      return;
    }

    // Action: c = Copy port (when expanded)
    if (e.key === 'c' || e.key === 'C') {
      if (isExpanded) {
        e.preventDefault();
        onProjectAction({ type: 'copyPort', projectName: project.name });
      }
      return;
    }

    // Action: r = Restart (running projects only)
    if (e.key === 'r' || e.key === 'R') {
      if (project.status.state === 'running') {
        e.preventDefault();
        onProjectAction({ type: 'restart', projectName: project.name });
      }
      return;
    }

    // Action: Escape = Collapse if expanded
    if (e.key === 'Escape') {
      if (isExpanded) {
        e.preventDefault();
        toggleExpansion(project.name);
      }
      return;
    }

    // Future: / = Focus search
    if (e.key === '/') {
      e.preventDefault();
      // TODO: Focus search input when search feature is implemented
      console.log('Search shortcut (/) - feature coming soon');
      return;
    }
  }, [projects, focusedIndex, expandedProjects, onProjectAction, toggleExpansion]);

  /**
   * Keep container focused for keyboard events
   * Focus is restored when component mounts or updates
   */
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  /**
   * Scroll focused row into view when focus changes
   * Ensures keyboard navigation doesn't go off-screen
   */
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < projects.length) {
      const rowElement = containerRef.current?.querySelector(
        `[data-row-index="${focusedIndex}"]`
      ) as HTMLElement;

      if (rowElement) {
        rowElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }, [focusedIndex, projects.length]);

  /**
   * Memoized action handler
   * Prevents unnecessary re-renders of child components
   */
  const handleAction = useCallback((action: ProjectAction) => {
    onProjectAction(action);
  }, [onProjectAction]);

  /**
   * Empty state - shown when no projects exist
   */
  if (projects.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "w-full max-w-4xl mx-auto px-4 sm:px-6",
          "flex flex-col items-center justify-center",
          "py-16 text-center",
          className
        )}
      >
        <Ghost className="w-12 h-12 mb-4 text-muted-foreground opacity-50" aria-hidden="true" />
        <h3 className="text-lg font-medium text-card-foreground mb-2">
          No projects found
        </h3>
        <p className="text-sm text-muted-foreground">
          Add projects to the dashboard to get started
        </p>
      </motion.div>
    );
  }

  /**
   * Main list view
   */
  return (
    <div
      ref={containerRef}
      role="list"
      aria-label="Project list"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "w-full max-w-4xl mx-auto px-4 sm:px-6",
        "focus:outline-none",
        className
      )}
    >
      <motion.div
        {...containerProps}
        className="space-y-1"
      >
        {projects.map((project, index) => (
          <motion.div
            key={project.name}
            {...itemProps}
            data-row-index={index}
          >
            <ProjectRow
              project={project}
              isExpanded={expandedProjects.has(project.name)}
              isFocused={index === focusedIndex}
              onToggleExpand={() => toggleExpansion(project.name)}
              onAction={handleAction}
              onFocus={() => setFocusedIndex(index)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Accessibility: Screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {focusedIndex >= 0 && projects[focusedIndex] && (
          `Focused on ${projects[focusedIndex].name}, ${
            projects[focusedIndex].status.state === 'running' ? 'running' : 'stopped'
          }`
        )}
      </div>
    </div>
  );
}
