# Adding a New Project to the Monorepo

This guide explains how to add a new project to both the dashboard UI and the monorepo workspace.

## Step 1: Create the Project

Create a new project folder in the `projects/` directory:

```bash
cd /mnt/c/Users/bette/Desktop/projects-dashboard/projects
npm create vite@latest my-new-project -- --template react-ts
# OR
pnpm create vite my-new-project --template react-ts
```

## Step 2: Update package.json

Update the project's `package.json` to match monorepo standards:

```json
{
  "name": "my-new-project",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "lucide-react": "^0.553.0",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "@types/react": "^19.2.2",
    "@types/react-dom": "^19.2.2",
    "@vitejs/plugin-react": "^5.1.0",
    "typescript": "~5.9.3",
    "vite": "npm:rolldown-vite@7.2.2"
  }
}
```

## Step 3: Install Dependencies

From the **root** of the monorepo:

```bash
cd /mnt/c/Users/bette/Desktop/projects-dashboard
pnpm install
```

**Note:** pnpm workspaces will automatically detect the new project!

## Step 4: Add to Dashboard UI

Update `/src/App.tsx` in the dashboard root project:

### 4a. Add Project Icon Import

```typescript
import {
  Folder,
  Calendar,
  ListTodo,
  Music,
  BookOpen,
  Ticket,
  YourNewIcon  // Add your icon here
} from 'lucide-react';
```

### 4b. Add Project to Projects Array

```typescript
const projects = [
  {
    id: 'my-new-project',
    name: 'My New Project',
    description: 'Brief description of what this project does',
    path: './projects/my-new-project',
    port: 5010,  // Pick an unused port (see PORT_ASSIGNMENTS.md)
    icon: YourNewIcon,
    color: 'blue',  // Choose: blue, purple, green, orange, pink, indigo
    status: 'active' as const,  // or 'development', 'archived'
  },
  // ... existing projects
];
```

### 4c. Update PORT_ASSIGNMENTS.md

Add your port assignment:

```markdown
| Port | Project | Status |
|------|---------|--------|
| 5010 | my-new-project | In Use |
```

## Step 5: Configure Vite Port

In `projects/my-new-project/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5010,  // Match the port from Step 4b
    strictPort: true,
  },
})
```

## Step 6: Test the Project

### 6a. Build Test

```bash
pnpm build:all
```

This should build all projects including your new one.

### 6b. Run Individually

```bash
cd projects/my-new-project
pnpm dev
```

### 6c. View in Dashboard

```bash
cd /mnt/c/Users/bette/Desktop/projects-dashboard
pnpm dev
```

Navigate to http://localhost:5173 and your project should appear!

## Step 7: Add Git Tracking (Optional)

If this project should be its own git repository:

```bash
cd projects/my-new-project
git init
git remote add origin <your-remote-url>
```

Update `.gitmodules` in the root (see `GIT_STRUCTURE.md` for details).

## Common Issues

### Issue: "Module not found" errors

**Solution:** Run `pnpm install` from the root.

### Issue: Port already in use

**Solution:** Check `PORT_ASSIGNMENTS.md` and choose a different port.

### Issue: TypeScript errors about React types

**Solution:** Make sure you're using React 19 and matching type versions:
```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@types/react": "^19.2.2",
    "@types/react-dom": "^19.2.2"
  }
}
```

### Issue: Turborepo not detecting new project

**Solution:** Turborepo automatically detects workspaces defined in `pnpm-workspace.yaml`. As long as your project is in `projects/*`, it will be detected. Try:
```bash
pnpm exec turbo build --filter=my-new-project
```

## Quick Checklist

- [ ] Created project in `projects/` folder
- [ ] Updated package.json with correct dependencies
- [ ] Ran `pnpm install` from root
- [ ] Added project to dashboard `src/App.tsx`
- [ ] Assigned unique port
- [ ] Updated `PORT_ASSIGNMENTS.md`
- [ ] Configured Vite port
- [ ] Tested build (`pnpm build:all`)
- [ ] Tested dev server
- [ ] Verified project appears in dashboard

## Next Steps

- Add shared components: Create packages in `/packages` (see monorepo guide)
- Configure linting: Projects inherit from root ESLint config
- Add tests: Use Vitest for testing
- CI/CD: GitHub Actions will automatically build/test changed projects

## Example Projects

Look at existing projects for reference:
- `projects/task-manager` - Modern setup with React 19
- `projects/google-calendar-clone` - Complex UI example
- `projects/jira-wrapper` - API integration example
