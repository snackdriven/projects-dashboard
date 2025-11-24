/**
 * Component prop types for UI components
 *
 * This file defines the prop interfaces for all UI components
 * that will be built in Wave 2.
 */

import type { ProjectMetadata } from './project';
import type {
  ExpansionState,
  KeyboardNavState,
  FilterState,
  SortState,
} from './state';

/**
 * Action types that can be performed on projects
 *
 * Using discriminated unions ensures type-safe action handling
 * and makes it easy to add new actions in the future.
 */
export type ProjectAction =
  | { type: 'launch'; projectName: string }
  | { type: 'stop'; projectName: string }
  | { type: 'restart'; projectName: string }
  | { type: 'open'; projectName: string }
  | { type: 'openInEditor'; projectName: string; editor?: string }
  | { type: 'copyPort'; projectName: string }
  | { type: 'copyUrl'; projectName: string }
  | { type: 'viewLogs'; projectName: string };

/**
 * Action handler function type
 *
 * Can be async to support API calls. Should handle errors internally
 * and update UI state as needed.
 */
export type ProjectActionHandler = (action: ProjectAction) => void | Promise<void>;

/**
 * Props for the main CompactList component
 *
 * This is the top-level component that renders the entire project list.
 */
export interface CompactListProps {
  readonly projects: readonly ProjectMetadata[];
  readonly onProjectAction: ProjectActionHandler;
  readonly expansionState: ExpansionState;
  readonly keyboardNavState: KeyboardNavState;
  readonly filterState?: FilterState;
  readonly sortState?: SortState;
  readonly isLoading?: boolean;
  readonly error?: string;
  readonly className?: string;
}

/**
 * Props for individual ProjectRow components
 *
 * Each row represents a single project in the list.
 */
export interface ProjectRowProps {
  readonly project: ProjectMetadata;
  readonly isExpanded: boolean;
  readonly isFocused: boolean;
  readonly isSelected?: boolean;
  readonly onToggleExpand: () => void;
  readonly onAction: ProjectActionHandler;
  readonly onFocus?: () => void;
  readonly className?: string;
}

/**
 * Props for ProjectDetails component (expandable detail panel)
 *
 * Shows comprehensive project information when a row is expanded.
 */
export interface ProjectDetailsProps {
  readonly project: ProjectMetadata;
  readonly onAction: ProjectActionHandler;
  readonly isLoading?: boolean;
  readonly error?: string;
  readonly className?: string;
}

/**
 * Props for ProjectStatusBadge component
 *
 * Visual indicator of project state (running, stopped, error, etc.)
 */
export interface ProjectStatusBadgeProps {
  readonly status: ProjectMetadata['status'];
  readonly size?: 'sm' | 'md' | 'lg';
  readonly showLabel?: boolean;
  readonly animated?: boolean;
  readonly className?: string;
}

/**
 * Props for GitStatusIndicator component
 *
 * Shows git branch, uncommitted changes, sync status
 */
export interface GitStatusIndicatorProps {
  readonly git: ProjectMetadata['git'];
  readonly compact?: boolean;
  readonly showBranch?: boolean;
  readonly showCommits?: boolean;
  readonly className?: string;
}

/**
 * Props for MemoryUsageIndicator component
 *
 * Visual indicator of memory consumption
 */
export interface MemoryUsageIndicatorProps {
  readonly bytes: number;
  readonly showLabel?: boolean;
  readonly format?: 'compact' | 'detailed';
  readonly threshold?: {
    warning: number; // bytes
    critical: number; // bytes
  };
  readonly className?: string;
}

/**
 * Props for UptimeDisplay component
 *
 * Shows how long a project has been running
 */
export interface UptimeDisplayProps {
  readonly uptime: number; // seconds
  readonly format?: 'compact' | 'detailed';
  readonly showIcon?: boolean;
  readonly className?: string;
}

/**
 * Props for ProjectActionButton component
 *
 * Reusable action button (launch, stop, open, etc.)
 */
export interface ProjectActionButtonProps {
  readonly action: ProjectAction;
  readonly onAction: ProjectActionHandler;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly className?: string;
}

/**
 * Props for ProjectFilterBar component
 *
 * Filter and search controls above the project list
 */
export interface ProjectFilterBarProps {
  readonly filterState: FilterState;
  readonly totalCount: number;
  readonly filteredCount: number;
  readonly className?: string;
}

/**
 * Props for ProjectSortControls component
 *
 * Sort controls for the project list
 */
export interface ProjectSortControlsProps {
  readonly sortState: SortState;
  readonly className?: string;
}

/**
 * Props for ProjectListHeader component
 *
 * Column headers for the list view
 */
export interface ProjectListHeaderProps {
  readonly sortState?: SortState;
  readonly onSort?: (key: SortState['sortKey']) => void;
  readonly className?: string;
}

/**
 * Props for EmptyState component
 *
 * Shown when no projects match filters or list is empty
 */
export interface EmptyStateProps {
  readonly type: 'no-projects' | 'no-results' | 'error';
  readonly message?: string;
  readonly action?: {
    label: string;
    onClick: () => void;
  };
  readonly className?: string;
}

/**
 * Props for LoadingState component
 *
 * Skeleton/spinner shown while projects are loading
 */
export interface LoadingStateProps {
  readonly rowCount?: number; // number of skeleton rows to show
  readonly className?: string;
}

/**
 * Props for ProjectCard component (alternative to row view)
 *
 * Card-based layout option (future feature)
 */
export interface ProjectCardProps {
  readonly project: ProjectMetadata;
  readonly onAction: ProjectActionHandler;
  readonly isSelected?: boolean;
  readonly layout?: 'compact' | 'comfortable' | 'spacious';
  readonly className?: string;
}

/**
 * Props for ExpandButton component
 *
 * Chevron/arrow button to expand/collapse details
 */
export interface ExpandButtonProps {
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

/**
 * Props for KeyboardShortcutsHelp component
 *
 * Modal/popover showing available keyboard shortcuts
 */
export interface KeyboardShortcutsHelpProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

/**
 * Props for BulkActions component (future feature)
 *
 * Toolbar for performing actions on multiple selected projects
 */
export interface BulkActionsProps {
  readonly selectedProjects: readonly string[];
  readonly onAction: ProjectActionHandler;
  readonly className?: string;
}

/**
 * Common props pattern for all interactive components
 *
 * Use this to ensure consistent prop naming across components.
 */
export interface InteractiveComponentProps {
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly error?: string;
  readonly className?: string;
  readonly 'aria-label'?: string;
  readonly 'data-testid'?: string;
}

/**
 * Animation variants for Framer Motion components
 *
 * Reusable animation configurations for consistent transitions.
 */
export interface AnimationVariants {
  readonly initial: Record<string, unknown>;
  readonly animate: Record<string, unknown>;
  readonly exit: Record<string, unknown>;
  readonly transition?: Record<string, unknown>;
}

/**
 * Standard animation variants for project list
 */
export const projectListAnimations: AnimationVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2, ease: 'easeInOut' },
};

/**
 * Standard animation variants for expansion panels
 */
export const expansionAnimations: AnimationVariants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.3, ease: 'easeInOut' },
};

/**
 * Responsive breakpoint types for component sizing
 */
export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

/**
 * Layout configuration for responsive design
 */
export interface LayoutConfig {
  readonly breakpoint: Breakpoint;
  readonly compact: boolean;
  readonly showDetails: boolean;
  readonly columnsVisible: {
    readonly status: boolean;
    readonly memory: boolean;
    readonly git: boolean;
    readonly uptime: boolean;
    readonly actions: boolean;
  };
}
