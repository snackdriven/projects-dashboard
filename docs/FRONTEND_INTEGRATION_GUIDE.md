# Frontend Integration Guide - Metadata API

## Quick Start

The backend now provides a comprehensive metadata endpoint for each project:

```javascript
// Fetch metadata for a project
const response = await fetch('/api/projects/google-calendar-clone/metadata');
const metadata = await response.json();

console.log(metadata);
// {
//   name: "google-calendar-clone",
//   port: 5173,
//   status: { state: "running", since: "2025-01-23T10:30:00Z" },
//   uptime: 8640,
//   memory: 156000000,
//   url: "http://localhost:5173",
//   git: { branch: "main", uncommittedChanges: 9, ... }
// }
```

## Key Features

### 1. Caching

The endpoint is heavily cached (10s for metadata, 30s for git):
- **First request**: ~450ms
- **Cached requests**: ~5-10ms (90x faster!)
- No need to implement frontend caching

### 2. Conditional Fields

Not all fields are always present. Use optional chaining:

```javascript
// These fields might be undefined
metadata.uptime          // Only if running
metadata.memory          // Only if running
metadata.lastStarted     // Only if tracked
metadata.git             // Only if git repo
metadata.status.since    // Only if running
```

### 3. Data Types

```typescript
interface ProjectMetadata {
  name: string;
  path: string;
  port: number;
  status: {
    state: 'stopped' | 'running' | 'launching' | 'error';
    since?: string;  // ISO timestamp
  };
  url: string;
  uptime?: number;        // seconds
  memory?: number;        // bytes
  lastStarted?: string;   // ISO timestamp
  git?: {
    branch: string;
    uncommittedChanges: number;
    ahead: number;
    behind: number;
    lastCommit: {
      hash: string;       // 7 chars
      message: string;
      timestamp: string;  // ISO timestamp
    };
  };
}
```

## UI Component Example

```jsx
import { useState, useEffect } from 'react';

const ProjectCard = ({ projectName }) => {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await fetch(`/api/projects/${projectName}/metadata`);
        const data = await res.json();
        setMetadata(data);
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
    const interval = setInterval(fetchMetadata, 3000); // Poll every 3s

    return () => clearInterval(interval);
  }, [projectName]);

  if (loading) return <div>Loading...</div>;
  if (!metadata) return <div>Error loading project</div>;

  return (
    <div className="project-card">
      {/* Header */}
      <h3>{metadata.name}</h3>
      <StatusBadge state={metadata.status.state} />

      {/* Expandable Details */}
      <details>
        <summary>Details</summary>

        {/* Resource Usage (if running) */}
        {metadata.uptime && (
          <div>
            <strong>Uptime:</strong> {formatUptime(metadata.uptime)}
          </div>
        )}
        {metadata.memory && (
          <div>
            <strong>Memory:</strong> {formatMemory(metadata.memory)}
          </div>
        )}

        {/* Git Status */}
        {metadata.git && (
          <div className="git-status">
            <strong>Branch:</strong> {metadata.git.branch}
            {metadata.git.uncommittedChanges > 0 && (
              <span className="badge warning">
                {metadata.git.uncommittedChanges} uncommitted
              </span>
            )}
            {metadata.git.ahead > 0 && (
              <span className="badge success">↑ {metadata.git.ahead}</span>
            )}
            {metadata.git.behind > 0 && (
              <span className="badge danger">↓ {metadata.git.behind}</span>
            )}
          </div>
        )}

        {/* Last Commit */}
        {metadata.git?.lastCommit && (
          <div className="last-commit">
            <code>{metadata.git.lastCommit.hash}</code>
            <span>{metadata.git.lastCommit.message}</span>
            <time>{new Date(metadata.git.lastCommit.timestamp).toLocaleString()}</time>
          </div>
        )}

        {/* Metadata */}
        <div className="metadata">
          <div><strong>Port:</strong> {metadata.port}</div>
          <div><strong>URL:</strong> <a href={metadata.url}>{metadata.url}</a></div>
          <div><strong>Path:</strong> <code>{metadata.path}</code></div>
        </div>
      </details>
    </div>
  );
};

// Helper functions
const formatMemory = (bytes) => {
  const mb = bytes / (1024 * 1024);
  return mb < 1024 ? `${mb.toFixed(0)} MB` : `${(mb / 1024).toFixed(1)} GB`;
};

const formatUptime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const StatusBadge = ({ state }) => {
  const colors = {
    running: 'green',
    stopped: 'gray',
    launching: 'yellow',
    error: 'red'
  };

  return (
    <span className={`badge badge-${colors[state]}`}>
      {state}
    </span>
  );
};
```

## Formatting Utilities

Here are recommended utility functions for formatting the data:

```javascript
// utils/format.js

export const formatMemory = (bytes) => {
  if (!bytes) return 'N/A';
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) {
    return `${mb.toFixed(0)} MB`;
  }
  return `${(mb / 1024).toFixed(1)} GB`;
};

export const formatUptime = (seconds) => {
  if (!seconds) return 'N/A';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const formatTimestamp = (isoString) => {
  if (!isoString) return 'N/A';

  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  // Show relative time for recent activity
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffMins < 1440) {
    return `${Math.floor(diffMins / 60)}h ago`;
  }

  // Show absolute time for older activity
  return date.toLocaleString();
};

export const formatGitStatus = (git) => {
  if (!git) return null;

  const badges = [];

  if (git.uncommittedChanges > 0) {
    badges.push({
      text: `${git.uncommittedChanges} uncommitted`,
      variant: 'warning'
    });
  }

  if (git.ahead > 0) {
    badges.push({
      text: `↑ ${git.ahead} ahead`,
      variant: 'success'
    });
  }

  if (git.behind > 0) {
    badges.push({
      text: `↓ ${git.behind} behind`,
      variant: 'danger'
    });
  }

  return badges;
};
```

## TypeScript Types

If using TypeScript, add these types:

```typescript
// types/api.ts

export type ProjectState = 'stopped' | 'running' | 'launching' | 'error';

export interface ProjectMetadata {
  name: string;
  path: string;
  port: number;
  status: {
    state: ProjectState;
    since?: string;
  };
  url: string;
  uptime?: number;
  memory?: number;
  lastStarted?: string;
  git?: GitInfo;
}

export interface GitInfo {
  branch: string;
  uncommittedChanges: number;
  ahead: number;
  behind: number;
  lastCommit: {
    hash: string;
    message: string;
    timestamp: string;
  };
}

export interface ProjectStatus {
  running: boolean;
}

export interface ApiError {
  error: string;
}
```

## Error Handling

```javascript
const fetchMetadata = async (projectName) => {
  try {
    const response = await fetch(`/api/projects/${projectName}/metadata`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch metadata');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching metadata:', error);
    // Show error state in UI
    return null;
  }
};
```

## Performance Tips

1. **Use the caching**: Don't worry about polling every 3 seconds - the backend handles it
2. **Stagger requests**: If fetching metadata for multiple projects, add a small delay between requests
3. **Debounce rapid changes**: If user rapidly toggles expanded state, debounce the fetch

```javascript
// Stagger requests for multiple projects
const fetchAllMetadata = async (projectNames) => {
  const results = [];

  for (let i = 0; i < projectNames.length; i++) {
    const metadata = await fetchMetadata(projectNames[i]);
    results.push(metadata);

    // Small delay to avoid overwhelming the server
    if (i < projectNames.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  return results;
};
```

## Migration from Old API

If you're currently using `/api/projects/:name/status`, you can gradually migrate:

**Old approach (simple status check):**
```javascript
const response = await fetch('/api/projects/google-calendar-clone/status');
const { running } = await response.json();
// { running: true }
```

**New approach (comprehensive metadata):**
```javascript
const response = await fetch('/api/projects/google-calendar-clone/metadata');
const metadata = await response.json();
const running = metadata.status.state === 'running';
// Plus all the additional metadata!
```

Both endpoints remain available, so you can migrate incrementally.

## Full Working Example

See the complete implementation in `/test-metadata-api.sh` for a working example of all features.

## Questions?

- Full API documentation: `/docs/API_METADATA_ENDPOINT.md`
- Test the API: `./test-metadata-api.sh`
- Server code: `/server/index.js` (lines 113-315)
