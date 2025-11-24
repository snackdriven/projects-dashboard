/**
 * API types and response/request interfaces
 *
 * This file defines all types for communicating with the backend API,
 * including request/response shapes and type converters.
 */

import type { Project, ProjectMetadata, GitStatus } from './project';

/**
 * GET /api/projects
 *
 * Returns list of all available projects
 */
export type ProjectsResponse = readonly Project[];

/**
 * GET /api/projects/:name/status
 *
 * Returns current running status of a project
 */
export interface ProjectStatusResponse {
  readonly running: boolean;
}

/**
 * GET /api/projects/:name/metadata
 *
 * Returns comprehensive metadata for a project including git status,
 * memory usage, uptime, etc.
 */
export interface ProjectMetadataResponse {
  readonly name: string;
  readonly path: string;
  readonly port: number;
  readonly status: {
    readonly state: 'stopped' | 'running' | 'launching' | 'error';
    readonly since?: string; // ISO 8601 timestamp
    readonly uptime?: number; // seconds
    readonly message?: string; // error message if state === 'error'
    readonly code?: string; // error code if state === 'error'
    readonly progress?: number; // 0-100 if state === 'launching'
  };
  readonly memory?: number; // bytes
  readonly git?: {
    readonly branch: string;
    readonly uncommittedChanges: number;
    readonly ahead: number;
    readonly behind: number;
    readonly lastCommit?: {
      readonly hash: string;
      readonly message: string;
      readonly timestamp: string; // ISO 8601 timestamp
    };
  };
  readonly lastStarted?: string; // ISO 8601 timestamp
  readonly url: string;
}

/**
 * POST /api/projects/:name/launch
 *
 * Launches a project
 */
export interface LaunchProjectRequest {
  // Currently no body params, but defined for future extensibility
  readonly background?: boolean; // future: launch without opening browser
}

export interface LaunchProjectResponse {
  readonly success: boolean;
  readonly message?: string;
  readonly port?: number;
  readonly url?: string;
}

/**
 * POST /api/projects/:name/stop
 *
 * Stops a running project
 */
export interface StopProjectRequest {
  readonly force?: boolean; // future: force kill vs graceful shutdown
}

export interface StopProjectResponse {
  readonly success: boolean;
  readonly message?: string;
}

/**
 * POST /api/projects/:name/restart
 *
 * Restarts a running project (future endpoint)
 */
export interface RestartProjectRequest {
  readonly preserveState?: boolean;
}

export interface RestartProjectResponse {
  readonly success: boolean;
  readonly message?: string;
}

/**
 * GET /api/projects/:name/logs
 *
 * Get recent logs for a project (future endpoint)
 */
export interface ProjectLogsResponse {
  readonly logs: readonly {
    readonly timestamp: string;
    readonly level: 'info' | 'warn' | 'error' | 'debug';
    readonly message: string;
  }[];
  readonly total: number;
  readonly hasMore: boolean;
}

/**
 * API Error response (standard error shape)
 */
export interface ApiErrorResponse {
  readonly error: string;
  readonly code?: string;
  readonly details?: unknown;
}

/**
 * Type guard: Check if response is an error
 */
export function isApiError(response: unknown): response is ApiErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as ApiErrorResponse).error === 'string'
  );
}

/**
 * Convert API response timestamp string to Date object
 *
 * Handles both ISO 8601 strings and invalid/missing dates gracefully.
 */
export function parseApiDate(timestamp: string | undefined): Date | undefined {
  if (!timestamp) return undefined;
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? undefined : date;
}

/**
 * Convert API ProjectMetadataResponse to internal ProjectMetadata type
 *
 * Transforms ISO timestamp strings to Date objects and ensures type safety.
 */
export function apiResponseToMetadata(
  response: ProjectMetadataResponse
): ProjectMetadata {
  const status = convertApiStatus(response.status);
  const git = response.git ? convertApiGitStatus(response.git) : undefined;

  return {
    name: response.name,
    path: response.path,
    port: response.port,
    status,
    memory: response.memory,
    git,
    lastStarted: parseApiDate(response.lastStarted),
    url: response.url,
  };
}

/**
 * Convert API status object to internal ProjectState discriminated union
 */
function convertApiStatus(
  status: ProjectMetadataResponse['status']
): ProjectMetadata['status'] {
  switch (status.state) {
    case 'stopped':
      return { state: 'stopped' };
    case 'launching':
      return { state: 'launching', progress: status.progress };
    case 'running': {
      const since = parseApiDate(status.since);
      return {
        state: 'running',
        since: since ?? new Date(), // fallback to now if missing
        uptime: status.uptime ?? 0,
      };
    }
    case 'error':
      return {
        state: 'error',
        message: status.message ?? 'Unknown error',
        code: status.code,
      };
    default: {
      // Exhaustiveness check - TypeScript will error if we missed a case
      const _exhaustive: never = status.state;
      throw new Error(`Unknown status state: ${_exhaustive}`);
    }
  }
}

/**
 * Convert API git status to internal GitStatus type
 */
function convertApiGitStatus(
  git: NonNullable<ProjectMetadataResponse['git']>
): GitStatus {
  return {
    branch: git.branch,
    uncommittedChanges: git.uncommittedChanges,
    ahead: git.ahead,
    behind: git.behind,
    lastCommit: git.lastCommit
      ? {
          hash: git.lastCommit.hash,
          message: git.lastCommit.message,
          timestamp: parseApiDate(git.lastCommit.timestamp) ?? new Date(),
        }
      : undefined,
  };
}

/**
 * Convert internal ProjectMetadata to API response format (for testing)
 */
export function metadataToApiResponse(
  metadata: ProjectMetadata
): ProjectMetadataResponse {
  const status = convertStatusToApi(metadata.status);
  const git = metadata.git ? convertGitStatusToApi(metadata.git) : undefined;

  return {
    name: metadata.name,
    path: metadata.path,
    port: metadata.port,
    status,
    memory: metadata.memory,
    git,
    lastStarted: metadata.lastStarted?.toISOString(),
    url: metadata.url,
  };
}

/**
 * Convert internal ProjectState to API format
 */
function convertStatusToApi(
  status: ProjectMetadata['status']
): ProjectMetadataResponse['status'] {
  switch (status.state) {
    case 'stopped':
      return { state: 'stopped' };
    case 'launching':
      return { state: 'launching', progress: status.progress };
    case 'running':
      return {
        state: 'running',
        since: status.since.toISOString(),
        uptime: status.uptime,
      };
    case 'error':
      return {
        state: 'error',
        message: status.message,
        code: status.code,
      };
  }
}

/**
 * Convert internal GitStatus to API format
 */
function convertGitStatusToApi(
  git: GitStatus
): NonNullable<ProjectMetadataResponse['git']> {
  return {
    branch: git.branch,
    uncommittedChanges: git.uncommittedChanges,
    ahead: git.ahead,
    behind: git.behind,
    lastCommit: git.lastCommit
      ? {
          hash: git.lastCommit.hash,
          message: git.lastCommit.message,
          timestamp: git.lastCommit.timestamp.toISOString(),
        }
      : undefined,
  };
}

/**
 * Fetch wrapper with type safety and error handling
 *
 * @example
 * const result = await apiFetch<ProjectsResponse>('/api/projects');
 * if (result.ok) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string }
> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      // Try to parse error response
      const errorData = await response.json().catch(() => null);
      if (isApiError(errorData)) {
        return {
          ok: false,
          error: errorData.error,
          code: errorData.code,
        };
      }
      return {
        ok: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
