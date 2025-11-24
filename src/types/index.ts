/**
 * Barrel export for all types
 *
 * Import all types from this single entry point:
 *
 * @example
 * import type { ProjectMetadata, ProjectAction, ExpansionState } from '@/types';
 */

// Project types
export type {
  Project,
  ProjectState,
  ProjectMetadata,
  GitStatus,
  RunningProject,
  GitProject,
  MemoryTier,
} from './project';

export {
  isRunning,
  isError,
  isLaunching,
  isStopped,
  getMemoryTier,
  formatBytes,
  formatUptime,
} from './project';

// State management types
export type {
  ExpansionState,
  KeyboardNavState,
  FilterState,
  SortState,
  ProjectListStore,
  UseExpansionStateReturn,
  UseKeyboardNavReturn,
  SelectionState,
  AnimationState,
  PollingState,
  SortKey,
  SortDirection,
} from './state';

// API types
export type {
  ProjectsResponse,
  ProjectStatusResponse,
  ProjectMetadataResponse,
  LaunchProjectRequest,
  LaunchProjectResponse,
  StopProjectRequest,
  StopProjectResponse,
  RestartProjectRequest,
  RestartProjectResponse,
  ProjectLogsResponse,
  ApiErrorResponse,
} from './api';

export {
  isApiError,
  parseApiDate,
  apiResponseToMetadata,
  metadataToApiResponse,
  apiFetch,
} from './api';

// Component types
export type {
  ProjectAction,
  ProjectActionHandler,
  CompactListProps,
  ProjectRowProps,
  ProjectDetailsProps,
  ProjectStatusBadgeProps,
  GitStatusIndicatorProps,
  MemoryUsageIndicatorProps,
  UptimeDisplayProps,
  ProjectActionButtonProps,
  ProjectFilterBarProps,
  ProjectSortControlsProps,
  ProjectListHeaderProps,
  EmptyStateProps,
  LoadingStateProps,
  ProjectCardProps,
  ExpandButtonProps,
  KeyboardShortcutsHelpProps,
  BulkActionsProps,
  InteractiveComponentProps,
  AnimationVariants,
  Breakpoint,
  LayoutConfig,
} from './components';

export {
  projectListAnimations,
  expansionAnimations,
} from './components';

// Memory types
export type {
  TimelineEvent,
  TimelineEventInput,
  TimelineEventUpdate,
  TimelineResponse,
  KVMemory,
  KVMemoryInput,
  MemoryMetadata,
  MCPSuccessResponse,
  MCPErrorResponse,
  MCPResponse,
  TableMeta,
  MemoryTab,
  ExportFormat,
  ExportDataType,
  ExportOptions,
  BulkDeleteResult,
} from './memory';
