# Port Assignments for Projects Dashboard

This document defines the port assignments for all projects in the dashboard. Each project has been assigned a unique port to prevent conflicts when launching multiple projects simultaneously.

## Dashboard Ports

- **Dashboard Backend**: `3001`
- **Dashboard Frontend**: `5180`

## Project Port Assignments

Most projects use sequential ports in the 5173-5179 range (standard Vite development server range). Backend API servers use the 3xxx range.

| Project Name | Port | Type | URL |
|--------------|------|------|-----|
| google-calendar-clone | 5173 | Vite Frontend | http://localhost:5173 |
| jira-wrapper | 5174 | Vite Frontend | http://localhost:5174 |
| lastfm-clone | 5175 | Vite Frontend | http://localhost:5175 |
| livejournal-clone | 5176 | Vite Frontend | http://localhost:5176 |
| react-ts-templates | 5177 | Vite Frontend | http://localhost:5177 |
| task-manager | 5178 | Vite Frontend | http://localhost:5178 |
| quantified-life | 5179 | Vite Frontend | http://localhost:5179 |
| chronicle | 3002 | Backend API | http://localhost:3002/api/* |

## Configuration Files

Port assignments are configured in:

1. **Individual Projects**: Each project's `vite.config.ts` contains its assigned port in the `server.port` setting
2. **Dashboard Server**: The `server/index.js` file contains the `PROJECT_PORTS` mapping for status checking

## Adding New Projects

When adding a new project to the dashboard:

1. Assign the next available port in sequence (5179, 5180, etc.)
2. Update the project's `vite.config.ts`:
   ```typescript
   export default defineConfig({
     plugins: [react()],
     server: {
       port: XXXX, // Your assigned port
     },
   })
   ```
3. Update `server/index.js` to add the project to the `PROJECT_PORTS` object:
   ```javascript
   const PROJECT_PORTS = {
     // ... existing projects
     'your-project-name': XXXX,
   };
   ```
4. Update this documentation file

## Benefits

- **No Port Conflicts**: All projects can run simultaneously without port conflicts
- **Predictable URLs**: Easy to remember sequential port numbers
- **Proper Status Checking**: Dashboard can accurately check if each project is running
- **Easy Maintenance**: Clear documentation makes it simple to manage ports

## Port Range Strategy

- **Ports 5173-5179**: Vite frontend development servers
- **Port 5180**: Dashboard frontend (avoiding conflict with projects)
- **Port 3001**: Dashboard backend API
- **Port 3002**: Chronicle backend API

This keeps all frontend development ports in the 5xxx range and separates backend APIs to the 3xxx range.
