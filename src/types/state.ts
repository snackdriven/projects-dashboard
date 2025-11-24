/**
 * State management types for UI interactions
 *
 * This file defines types for managing UI state including expansion,
 * keyboard navigation, and focus management.
 */

import type { ProjectMetadata } from './project';

/**
 * Expansion state management for collapsible project rows
 *
 * Manages which project details panels are expanded/collapsed.
 * Uses Set for O(1) lookup performance.
 */
export interface ExpansionState {
  readonly expandedProjects: ReadonlySet<string>; // project names
  toggleExpansion: (projectName: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  isExpanded: (projectName: string) => boolean;
}

/**
 * Keyboard navigation state for list navigation
 *
 * Manages keyboard focus within the project list for accessibility
 * and power-user workflows (vim-style navigation).
 */
export interface KeyboardNavState {
  readonly focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  moveFocusUp: () => void;
  moveFocusDown: () => void;
  moveFocusToFirst: () => void;
  moveFocusToLast: () => void;
  selectFocused: () => void;
}

/**
 * Filter state for project list
 *
 * Allows filtering projects by name, status, or git state.
 */
export interface FilterState {
  readonly searchQuery: string;
  readonly showOnlyRunning: boolean;
  readonly showOnlyWithChanges: boolean; // git uncommitted changes
  setSearchQuery: (query: string) => void;
  setShowOnlyRunning: (show: boolean) => void;
  setShowOnlyWithChanges: (show: boolean) => void;
  clearFilters: () => void;
}

/**
 * Sort configuration for project list
 */
export type SortKey = 'name' | 'status' | 'uptime' | 'memory' | 'lastStarted';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  readonly sortKey: SortKey;
  readonly sortDirection: SortDirection;
  setSortKey: (key: SortKey) => void;
  toggleSortDirection: () => void;
}

/**
 * Complete project list store (Zustand store type)
 *
 * This is the root state object for the entire project list UI.
 * Can be used with Zustand, Context, or any state management solution.
 */
export interface ProjectListStore {
  // Data
  readonly projects: readonly ProjectMetadata[];
  readonly isLoading: boolean;
  readonly error: string | null;

  // UI State
  readonly expansionState: ExpansionState;
  readonly keyboardNavState: KeyboardNavState;
  readonly filterState: FilterState;
  readonly sortState: SortState;
  readonly selectedProject: string | null;

  // Actions
  setProjects: (projects: readonly ProjectMetadata[]) => void;
  updateProject: (projectName: string, updates: Partial<ProjectMetadata>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedProject: (projectName: string | null) => void;

  // Computed selectors (memoized in implementation)
  getFilteredProjects: () => readonly ProjectMetadata[];
  getSortedProjects: () => readonly ProjectMetadata[];
  getVisibleProjects: () => readonly ProjectMetadata[]; // filtered + sorted
}

/**
 * Expansion state hook return type (for React hooks)
 *
 * @example
 * const expansion = useExpansionState(['project-1', 'project-2']);
 */
export interface UseExpansionStateReturn {
  expandedProjects: ReadonlySet<string>;
  isExpanded: (projectName: string) => boolean;
  toggleExpansion: (projectName: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

/**
 * Keyboard navigation hook return type
 *
 * @example
 * const nav = useKeyboardNav(projects.length);
 */
export interface UseKeyboardNavReturn {
  focusedIndex: number;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  setFocusedIndex: (index: number) => void;
  moveFocusUp: () => void;
  moveFocusDown: () => void;
  moveFocusToFirst: () => void;
  moveFocusToLast: () => void;
}

/**
 * Selection state for multi-select operations (future feature)
 *
 * Currently single-select, but designed for extensibility.
 */
export interface SelectionState {
  readonly selectedProjects: ReadonlySet<string>;
  readonly isMultiSelect: boolean;
  selectProject: (projectName: string, multiSelect?: boolean) => void;
  deselectProject: (projectName: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  toggleSelection: (projectName: string) => void;
  isSelected: (projectName: string) => boolean;
}

/**
 * Animation state for list transitions
 *
 * Tracks which items are animating to prevent duplicate animations.
 */
export interface AnimationState {
  readonly animatingProjects: ReadonlySet<string>;
  startAnimation: (projectName: string) => void;
  endAnimation: (projectName: string) => void;
  isAnimating: (projectName: string) => boolean;
}

/**
 * Polling state for status updates
 *
 * Manages the status polling interval and error retry logic.
 */
export interface PollingState {
  readonly isPolling: boolean;
  readonly interval: number; // milliseconds
  readonly errorCount: number;
  readonly lastPollTime: Date | null;
  startPolling: () => void;
  stopPolling: () => void;
  setInterval: (ms: number) => void;
  incrementErrorCount: () => void;
  resetErrorCount: () => void;
}
