/**
 * ProjectDetails Component - Usage Examples
 *
 * This file demonstrates how to use the ProjectDetails component
 * in various scenarios.
 */

import React from 'react';
import { ProjectDetails } from './ProjectDetails';
import type { ProjectMetadata, ProjectAction } from '../types';

/**
 * Example 1: Running project with full metadata
 */
const runningProjectExample: ProjectMetadata = {
  name: 'jira-wrapper',
  path: '/mnt/c/Users/bette/Desktop/projects-dashboard/projects/jira-wrapper',
  port: 5174,
  url: 'http://localhost:5174',
  status: {
    state: 'running',
    since: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    uptime: 7200, // 2 hours in seconds
  },
  memory: 163577856, // ~156 MB
  git: {
    branch: 'main',
    uncommittedChanges: 3,
    ahead: 2,
    behind: 0,
  },
  lastStarted: new Date(Date.now() - 2 * 60 * 60 * 1000),
};

/**
 * Example 2: Stopped project with minimal metadata
 */
const stoppedProjectExample: ProjectMetadata = {
  name: 'google-calendar-clone',
  path: '/mnt/c/Users/bette/Desktop/projects-dashboard/projects/google-calendar-clone',
  port: 5173,
  url: 'http://localhost:5173',
  status: { state: 'stopped' },
  git: {
    branch: 'feature/compact-list',
    uncommittedChanges: 0,
    ahead: 0,
    behind: 1,
  },
  lastStarted: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
};

/**
 * Example 3: Running project without git info
 */
const noGitExample: ProjectMetadata = {
  name: 'task-manager',
  path: '/mnt/c/Users/bette/Desktop/projects-dashboard/projects/task-manager',
  port: 5178,
  url: 'http://localhost:5178',
  status: {
    state: 'running',
    since: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    uptime: 1800, // 30 minutes
  },
  memory: 52428800, // ~50 MB (low tier)
};

/**
 * Example action handler
 */
function handleProjectAction(action: ProjectAction) {
  console.log('Action received:', action);

  switch (action.type) {
    case 'launch':
      console.log(`Launching ${action.projectName}...`);
      // API call: POST /api/projects/:name/launch
      break;

    case 'stop':
      console.log(`Stopping ${action.projectName}...`);
      // API call: POST /api/projects/:name/stop
      break;

    case 'restart':
      console.log(`Restarting ${action.projectName}...`);
      // API call: POST /api/projects/:name/restart
      break;

    case 'copyPort':
      console.log(`Port ${action.projectName} copied to clipboard`);
      // Show toast notification
      break;

    case 'copyUrl':
      console.log(`URL for ${action.projectName} copied to clipboard`);
      // Show toast notification
      break;

    case 'viewLogs':
      console.log(`Viewing logs for ${action.projectName}`);
      // Navigate to logs view or open modal
      break;

    default:
      console.warn('Unknown action type:', action);
  }
}

/**
 * Example 4: Basic usage with running project
 */
export function Example1_RunningProject() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Running Project</h2>
      <div className="rounded-lg border border-border overflow-hidden">
        <ProjectDetails
          project={runningProjectExample}
          onAction={handleProjectAction}
        />
      </div>
    </div>
  );
}

/**
 * Example 5: Stopped project
 */
export function Example2_StoppedProject() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Stopped Project</h2>
      <div className="rounded-lg border border-border overflow-hidden">
        <ProjectDetails
          project={stoppedProjectExample}
          onAction={handleProjectAction}
        />
      </div>
    </div>
  );
}

/**
 * Example 6: Loading state
 */
export function Example3_LoadingState() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Loading Metadata</h2>
      <div className="rounded-lg border border-border overflow-hidden">
        <ProjectDetails
          project={runningProjectExample}
          onAction={handleProjectAction}
          isLoading={true}
        />
      </div>
    </div>
  );
}

/**
 * Example 7: Error state
 */
export function Example4_ErrorState() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Failed to Load Metadata</h2>
      <div className="rounded-lg border border-border overflow-hidden">
        <ProjectDetails
          project={runningProjectExample}
          onAction={handleProjectAction}
          error="Failed to fetch project metadata"
        />
      </div>
    </div>
  );
}

/**
 * Example 8: Project without git info
 */
export function Example5_NoGitInfo() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Project Without Git</h2>
      <div className="rounded-lg border border-border overflow-hidden">
        <ProjectDetails
          project={noGitExample}
          onAction={handleProjectAction}
        />
      </div>
    </div>
  );
}

/**
 * Example 9: All examples in a showcase
 */
export function ProjectDetailsShowcase() {
  return (
    <div className="space-y-8 p-8 bg-background">
      <Example1_RunningProject />
      <Example2_StoppedProject />
      <Example3_LoadingState />
      <Example4_ErrorState />
      <Example5_NoGitInfo />
    </div>
  );
}

/**
 * Example 10: Integration with expand/collapse
 */
export function Example6_IntegrationExample() {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Collapsed row header (Wave 3 will provide ProjectRow component) */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <div>
              <h3 className="font-medium">{runningProjectExample.name}</h3>
              <p className="text-xs text-muted-foreground">
                Port {runningProjectExample.port}
              </p>
            </div>
          </div>
          <button className="px-3 py-1 text-sm rounded-md bg-red-500/10 text-red-500">
            Stop
          </button>
        </div>

        {/* Expanded details panel */}
        {isExpanded && (
          <ProjectDetails
            project={runningProjectExample}
            onAction={handleProjectAction}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Example 11: Memory tier color coding demonstration
 */
export function Example7_MemoryTiers() {
  const lowMemoryProject: ProjectMetadata = {
    ...runningProjectExample,
    name: 'low-memory-app',
    memory: 50 * 1024 * 1024, // 50 MB - green
  };

  const mediumMemoryProject: ProjectMetadata = {
    ...runningProjectExample,
    name: 'medium-memory-app',
    memory: 250 * 1024 * 1024, // 250 MB - yellow
  };

  const highMemoryProject: ProjectMetadata = {
    ...runningProjectExample,
    name: 'high-memory-app',
    memory: 750 * 1024 * 1024, // 750 MB - orange
  };

  const criticalMemoryProject: ProjectMetadata = {
    ...runningProjectExample,
    name: 'critical-memory-app',
    memory: 1.5 * 1024 * 1024 * 1024, // 1.5 GB - red
  };

  return (
    <div className="space-y-4 p-8 bg-background">
      <h2 className="text-2xl font-bold mb-6">Memory Tier Color Coding</h2>

      <div className="space-y-4">
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="p-2 bg-muted/50 font-semibold text-sm">
            Low Memory (&lt; 100 MB) - Green
          </div>
          <ProjectDetails project={lowMemoryProject} onAction={handleProjectAction} />
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <div className="p-2 bg-muted/50 font-semibold text-sm">
            Medium Memory (100-500 MB) - Yellow
          </div>
          <ProjectDetails project={mediumMemoryProject} onAction={handleProjectAction} />
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <div className="p-2 bg-muted/50 font-semibold text-sm">
            High Memory (500 MB - 1 GB) - Orange
          </div>
          <ProjectDetails project={highMemoryProject} onAction={handleProjectAction} />
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <div className="p-2 bg-muted/50 font-semibold text-sm">
            Critical Memory (&gt; 1 GB) - Red
          </div>
          <ProjectDetails project={criticalMemoryProject} onAction={handleProjectAction} />
        </div>
      </div>
    </div>
  );
}
