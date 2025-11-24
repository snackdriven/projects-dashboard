/**
 * Core project types and state management
 *
 * This file defines the fundamental types for project representation,
 * including discriminated unions for type-safe state management.
 */

/**
 * Discriminated union for project runtime states
 *
 * Using discriminated unions allows TypeScript to narrow types based on the
 * 'state' property, enabling type-safe state handling and better autocomplete.
 */
export type ProjectState =
  | { state: 'stopped' }
  | { state: 'launching'; progress?: number }
  | { state: 'running'; since: Date; uptime: number }
  | { state: 'error'; message: string; code?: string };

/**
 * Git repository status information
 *
 * All fields are required to ensure consistent data handling.
 * If a project isn't a git repo, omit the entire GitStatus object.
 */
export interface GitStatus {
  readonly branch: string;
  readonly uncommittedChanges: number;
  readonly ahead: number;
  readonly behind: number;
  readonly lastCommit?: {
    readonly hash: string;
    readonly message: string;
    readonly timestamp: Date;
  };
}

/**
 * Comprehensive project metadata
 *
 * This is the primary data structure used throughout the application.
 * Memory is in bytes, ports are positive integers.
 */
export interface ProjectMetadata {
  readonly name: string;
  readonly path: string;
  readonly port: number;
  readonly status: ProjectState;
  readonly memory?: number; // bytes, undefined if not running
  readonly git?: GitStatus; // undefined if not a git repository
  readonly lastStarted?: Date; // undefined if never started
  readonly url: string; // computed: http://localhost:{port}
}

/**
 * Lightweight project reference (from API /api/projects)
 *
 * Used for initial project list loading before fetching full metadata.
 */
export interface Project {
  readonly name: string;
  readonly path: string;
}

/**
 * Type guard: Check if project is in running state
 *
 * When this returns true, TypeScript narrows the status type to include
 * 'since' and 'uptime' properties.
 *
 * @example
 * if (isRunning(project)) {
 *   console.log(project.status.since); // TypeScript knows this exists
 * }
 */
export function isRunning(
  project: ProjectMetadata
): project is ProjectMetadata & {
  status: { state: 'running'; since: Date; uptime: number };
} {
  return project.status.state === 'running';
}

/**
 * Type guard: Check if project is in error state
 */
export function isError(
  project: ProjectMetadata
): project is ProjectMetadata & {
  status: { state: 'error'; message: string; code?: string };
} {
  return project.status.state === 'error';
}

/**
 * Type guard: Check if project is launching
 */
export function isLaunching(
  project: ProjectMetadata
): project is ProjectMetadata & {
  status: { state: 'launching'; progress?: number };
} {
  return project.status.state === 'launching';
}

/**
 * Type guard: Check if project is stopped
 */
export function isStopped(
  project: ProjectMetadata
): project is ProjectMetadata & {
  status: { state: 'stopped' };
} {
  return project.status.state === 'stopped';
}

/**
 * Utility type: Extract only running projects
 *
 * Use this type when you need to work with a collection of running projects
 * and want TypeScript to guarantee access to runtime-specific properties.
 */
export type RunningProject = ProjectMetadata & {
  status: { state: 'running'; since: Date; uptime: number };
};

/**
 * Utility type: Extract projects with git information
 */
export type GitProject = ProjectMetadata & {
  git: GitStatus;
};

/**
 * Memory usage tiers for visual categorization
 */
export type MemoryTier = 'low' | 'medium' | 'high' | 'critical';

/**
 * Get memory tier based on bytes
 *
 * Thresholds:
 * - low: < 100MB
 * - medium: 100MB - 500MB
 * - high: 500MB - 1GB
 * - critical: > 1GB
 */
export function getMemoryTier(bytes: number): MemoryTier {
  const mb = bytes / (1024 * 1024);
  if (mb < 100) return 'low';
  if (mb < 500) return 'medium';
  if (mb < 1024) return 'high';
  return 'critical';
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Format uptime duration to human-readable string
 */
export function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}
