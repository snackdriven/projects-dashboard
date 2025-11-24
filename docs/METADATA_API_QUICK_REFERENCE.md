# Metadata API - Quick Reference Card

## Endpoint

```
GET /api/projects/:name/metadata
```

## Example Request

```bash
curl http://localhost:3001/api/projects/google-calendar-clone/metadata
```

## Example Response

```json
{
  "name": "google-calendar-clone",
  "path": "/path/to/projects/google-calendar-clone",
  "port": 5173,
  "status": {
    "state": "running",
    "since": "2025-01-23T10:30:00.000Z"
  },
  "uptime": 8640,
  "memory": 156000000,
  "url": "http://localhost:5173",
  "lastStarted": "2025-01-23T10:30:00.000Z",
  "git": {
    "branch": "main",
    "uncommittedChanges": 9,
    "ahead": 2,
    "behind": 0,
    "lastCommit": {
      "hash": "de277be",
      "message": "Add GitHub setup guide",
      "timestamp": "2025-11-16T21:24:58.000Z"
    }
  }
}
```

## Field Reference

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `name` | string | No | Project name |
| `path` | string | No | Absolute path to project |
| `port` | number | No | Port number |
| `status.state` | string | No | "stopped", "running", "launching", "error" |
| `status.since` | string | Yes | ISO timestamp when state started |
| `url` | string | No | Full URL (http://localhost:port) |
| `uptime` | number | Yes | Uptime in seconds |
| `memory` | number | Yes | Memory usage in bytes |
| `lastStarted` | string | Yes | ISO timestamp of last start |
| `git` | object | Yes | Git repository info |
| `git.branch` | string | Yes | Current branch |
| `git.uncommittedChanges` | number | Yes | Count of uncommitted files |
| `git.ahead` | number | Yes | Commits ahead of remote |
| `git.behind` | number | Yes | Commits behind remote |
| `git.lastCommit` | object | Yes | Last commit info |

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Invalid project name |
| 404 | Project not found |
| 500 | Server error |

## React Component

```jsx
const ProjectMetadata = ({ projectName }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const res = await fetch(`/api/projects/${projectName}/metadata`);
      setData(await res.json());
    };
    fetch();
    const timer = setInterval(fetch, 3000);
    return () => clearInterval(timer);
  }, [projectName]);

  return (
    <div>
      <h3>{data?.name}</h3>
      <p>Status: {data?.status.state}</p>
      {data?.git && (
        <p>Branch: {data.git.branch} ({data.git.uncommittedChanges} uncommitted)</p>
      )}
      {data?.uptime && <p>Uptime: {formatUptime(data.uptime)}</p>}
    </div>
  );
};
```

## Formatting Helpers

```javascript
// Memory: bytes → MB/GB
const formatMemory = (bytes) => {
  const mb = bytes / (1024 * 1024);
  return mb < 1024 ? `${mb.toFixed(0)} MB` : `${(mb / 1024).toFixed(1)} GB`;
};

// Uptime: seconds → human readable
const formatUptime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

// Timestamp: ISO → relative time
const formatTimestamp = (iso) => {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  return mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
};
```

## TypeScript Types

```typescript
type ProjectState = 'stopped' | 'running' | 'launching' | 'error';

interface ProjectMetadata {
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
  git?: {
    branch: string;
    uncommittedChanges: number;
    ahead: number;
    behind: number;
    lastCommit: {
      hash: string;
      message: string;
      timestamp: string;
    };
  };
}
```

## Performance

- **Cached**: ~5-10ms (within 10s)
- **Uncached**: ~50-450ms (git operations)
- **Git Cache**: 30s TTL (separate)

## Error Handling

```javascript
try {
  const res = await fetch(`/api/projects/${name}/metadata`);
  if (!res.ok) throw new Error('Failed to fetch');
  const data = await res.json();
  // Handle success
} catch (error) {
  // Handle error
}
```

## Testing

```bash
# Test endpoint
./test-metadata-api.sh

# Test specific project
curl http://localhost:3001/api/projects/task-manager/metadata | python3 -m json.tool

# Test caching
time curl http://localhost:3001/api/projects/jira-wrapper/metadata > /dev/null
time curl http://localhost:3001/api/projects/jira-wrapper/metadata > /dev/null
```

## Common Patterns

### Check if running
```javascript
const isRunning = metadata.status.state === 'running';
```

### Show git status badge
```javascript
{metadata.git?.uncommittedChanges > 0 && (
  <Badge variant="warning">{metadata.git.uncommittedChanges} uncommitted</Badge>
)}
```

### Show uptime (if running)
```javascript
{metadata.uptime && (
  <div>Uptime: {formatUptime(metadata.uptime)}</div>
)}
```

### Safe access to optional fields
```javascript
const branch = metadata.git?.branch || 'N/A';
const memory = metadata.memory ? formatMemory(metadata.memory) : 'N/A';
```

## Documentation Links

- Full API Docs: `/docs/API_METADATA_ENDPOINT.md`
- Frontend Guide: `/docs/FRONTEND_INTEGRATION_GUIDE.md`
- Architecture: `/docs/METADATA_API_ARCHITECTURE.md`
- Server Code: `/server/index.js` (lines 16-315)

## Quick Tips

1. Always use optional chaining for optional fields
2. Format bytes/seconds before displaying
3. Handle both running and stopped states
4. Test with various project types (git/non-git)
5. Cache is automatic - don't implement frontend caching

---

**Version**: 1.0.0
**Updated**: 2025-01-23
**Maintained by**: Backend Team
