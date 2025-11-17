# Git Repository Structure Guide

## Current Setup

You have a **monorepo-like structure** with:
- **Main repo**: `projects-dashboard` (manages the dashboard itself)
- **Sub-repos**: Each project in `projects/` has its own independent git repository

```
projects-dashboard/          # Main repo (on GitHub)
├── .git/                    # Main dashboard repo
├── projects/                # Gitignored - contains sub-repos
│   ├── google-calendar-clone/  # Independent git repo
│   ├── jira-wrapper/           # Independent git repo (on GitHub)
│   ├── lastfm-clone/           # Independent git repo (on GitHub)
│   ├── livejournal-clone/      # Independent git repo (on GitHub)
│   ├── react-ts-templates/      # Independent git repo (on GitHub)
│   └── task-manager/           # Independent git repo (on GitHub)
└── ...
```

## Why This Structure?

✅ **Pros:**
- Each project can be version controlled independently
- Projects can have different commit histories
- Easy to share individual projects
- Projects can be cloned separately if needed
- Clear separation of concerns

⚠️ **Considerations:**
- Need to manage multiple git repos
- LLMs need to understand the structure
- Commands need to be run in the right directory

## Current Status

| Project | Git Repo | GitHub Remote | Status |
|---------|----------|---------------|--------|
| google-calendar-clone | ✅ Yes | ❓ Unknown | Check needed |
| jira-wrapper | ✅ Yes | ✅ Yes | Connected |
| lastfm-clone | ✅ Yes | ✅ Yes | Connected |
| livejournal-clone | ✅ Yes | ✅ Yes | Connected |
| react-ts-templates | ✅ Yes | ✅ Yes | Connected |
| task-manager | ✅ Yes | ✅ Yes | Connected |

## Best Practices for LLM Assistance

### 1. **Always Specify Context**
When asking an LLM to work on a project, specify:
- Which project you're working on
- The full path if needed
- Example: "In `projects/task-manager`, update the README"

### 2. **Working Directory Awareness**
- Main dashboard work: `projects-dashboard/`
- Project work: `projects-dashboard/projects/PROJECT_NAME/`
- LLMs should `cd` to the correct directory before running commands

### 3. **Git Operations**
Each project has its own git repo, so:
- Commits are project-specific
- Pushes go to that project's GitHub repo
- Status checks are per-project

### 4. **File Paths in Conversations**
Use relative paths from the project root:
- ✅ Good: `src/App.tsx` (when in a project)
- ✅ Good: `projects/task-manager/src/App.tsx` (when in dashboard)
- ❌ Bad: `C:\Users\bette\Desktop\...` (too specific)

## Common Operations

### Check Status of All Projects
```bash
cd projects-dashboard/projects
for dir in */; do
  echo "=== $dir ==="
  cd "$dir" && git status --short && cd ..
done
```

### Commit Changes in a Project
```bash
cd projects-dashboard/projects/PROJECT_NAME
git add .
git commit -m "Your message"
git push
```

### Create New Project
1. Create folder: `projects-dashboard/projects/new-project/`
2. Initialize git: `cd projects-dashboard/projects/new-project && git init`
3. Create GitHub repo: `gh repo create new-project --public --source=. --push`

### Update All Projects
```bash
cd projects-dashboard/projects
for dir in */; do
  echo "=== Updating $dir ==="
  cd "$dir" && git pull && cd ..
done
```

## Helper Scripts

See `scripts/` folder for automated helpers (if created).

## LLM-Specific Guidelines

### For AI Assistants:
1. **Always check current directory** before running git commands
2. **Use relative paths** from the workspace root
3. **Specify which project** when making changes
4. **Check git status** before committing
5. **Verify remotes** before pushing

### Example LLM Workflow:
```bash
# 1. Navigate to project
cd projects-dashboard/projects/task-manager

# 2. Check status
git status

# 3. Make changes (via file edits)

# 4. Stage and commit
git add .
git commit -m "Description of changes"

# 5. Push
git push
```

## Troubleshooting

### "Not a git repository" error
- You're probably in the wrong directory
- Check: `pwd` or `cd` to the project folder

### Changes not showing in git status
- Make sure you're in the project's root directory
- Check `.gitignore` isn't excluding your files

### Can't push to GitHub
- Verify remote: `git remote -v`
- Check authentication: `gh auth status`
- Ensure branch exists: `git branch -a`

## Recommendations for Ease of Development

1. ✅ **Current structure is good** - keeps projects independent
2. ✅ **Projects folder is gitignored** - prevents nested repo issues
3. 💡 **Consider**: Helper scripts for common operations
4. 💡 **Consider**: README in each project explaining its purpose
5. 💡 **Consider**: Standardized branch naming (main/master)

---

**Last Updated**: 2025  
**Maintained By**: Development Team

