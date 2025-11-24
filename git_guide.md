# Git Structure & Management Guide

## Overview

This monorepo uses a **multi-repo structure** where:
- **Dashboard repo**: Manages the main dashboard application
- **Project repos**: Each project in `projects/` has its own independent git repository

```
projects-dashboard/          # Main repo (GitHub: snackdriven/projects-dashboard)
├── .git/                    # Main dashboard repo
├── projects/                # Gitignored - contains independent repos
│   ├── google-calendar-clone/  # Independent git repo
│   ├── jira-wrapper/           # Independent git repo
│   ├── lastfm-clone/           # Independent git repo
│   ├── livejournal-clone/      # Independent git repo
│   ├── react-ts-templates/     # Independent git repo
│   └── task-manager/           # Independent git repo
└── ...
```

## ✅ Current Status

All projects are standardized and connected to GitHub:

| Project | Branch | GitHub | Status |
|---------|--------|--------|--------|
| google-calendar-clone | main | [Link](https://github.com/snackdriven/google-calendar-clone) | ✅ |
| jira-wrapper | main | [Link](https://github.com/snackdriven/jira-wrapper) | ✅ |
| lastfm-clone | main | [Link](https://github.com/snackdriven/lastfm-clone) | ✅ |
| livejournal-clone | main | [Link](https://github.com/snackdriven/livejournal-clone) | ✅ |
| react-ts-templates | main | [Link](https://github.com/snackdriven/react-ts-templates) | ✅ |
| task-manager | main | [Link](https://github.com/snackdriven/task-manager) | ✅ |

**All projects use `main` as the default branch** (GitHub standard).

## Why This Structure?

### ✅ Advantages

- **Independent version control** - Each project has its own history
- **Separate GitHub repos** - Easy to share individual projects
- **Clear separation** - Dashboard code separate from project code
- **Flexible development** - Work on projects independently
- **Portfolio-friendly** - Each project can be showcased separately

### ⚠️ Considerations

- Multiple git repos to manage
- Commands must be run in correct directory
- LLMs/AI assistants need proper context

## Working with Projects

### Check Status of All Projects

```bash
cd projects
for dir in */; do
  echo "=== ${dir%/} ==="
  cd "$dir"
  echo "Branch: $(git branch --show-current)"
  git status --short
  cd ..
done
```

### Commit Changes to a Project

```bash
# Navigate to project
cd projects/PROJECT_NAME

# Check status
git status

# Stage changes
git add .

# Commit
git commit -m "Your descriptive message"

# Push to GitHub
git push
```

### Pull Latest Changes

```bash
# Single project
cd projects/PROJECT_NAME
git pull

# All projects
cd projects
for dir in */; do
  echo "=== Updating ${dir%/} ==="
  cd "$dir" && git pull && cd ..
done
```

### Create New Project with Git

```bash
# 1. Create project folder
cd projects
mkdir new-project-name
cd new-project-name

# 2. Initialize git
git init
git branch -M main

# 3. Create initial commit
git add .
git commit -m "Initial commit"

# 4. Create GitHub repo and push
gh repo create new-project-name --public --source=. --push

# Or manually add remote:
git remote add origin https://github.com/USERNAME/new-project-name.git
git push -u origin main
```

## Best Practices

### For Developers

1. **Always specify project** when asking for help
   - ✅ "Update the README in task-manager"
   - ❌ "Update the README" (which one?)

2. **Commit in the right directory**
   - Dashboard changes: Commit in root
   - Project changes: Commit in `projects/PROJECT_NAME/`

3. **Use descriptive commit messages**
   ```bash
   # Good
   git commit -m "feat: add user authentication"
   git commit -m "fix: resolve memory leak in status checker"
   git commit -m "docs: update installation instructions"

   # Bad
   git commit -m "update"
   git commit -m "fixes"
   ```

### For AI Assistants (LLMs)

1. **Check current directory** before running git commands
   ```bash
   pwd  # Verify location
   ```

2. **Navigate to correct project** before making changes
   ```bash
   cd /mnt/c/Users/bette/Desktop/projects-dashboard/projects/PROJECT_NAME
   ```

3. **Verify git status** before committing
   ```bash
   git status
   git diff  # Review changes
   ```

4. **Use relative paths** from project root
   - ✅ Good: `src/App.tsx`
   - ❌ Bad: `/mnt/c/Users/bette/Desktop/...`

5. **Specify which project** in responses
   - "Updated App.tsx in task-manager: src/App.tsx:42"

## Common Operations

### Check All Remote URLs

```bash
cd projects
for dir in */; do
  echo "=== ${dir%/} ==="
  cd "$dir" && git remote -v && cd ..
done
```

### Verify All Projects on Main Branch

```bash
cd projects
for dir in */; do
  cd "$dir"
  branch=$(git branch --show-current)
  if [ "$branch" != "main" ]; then
    echo "⚠️  ${dir%/} is on '$branch' (not main)"
  else
    echo "✅ ${dir%/} is on main"
  fi
  cd ..
done
```

### Check for Uncommitted Changes

```bash
cd projects
for dir in */; do
  cd "$dir"
  if [[ -n $(git status --short) ]]; then
    echo "⚠️  ${dir%/} has uncommitted changes:"
    git status --short
  fi
  cd ..
done
```

## Troubleshooting

### "Not a git repository" Error

**Problem:** Running git commands in wrong directory

**Solution:**
```bash
pwd  # Check where you are
cd projects/PROJECT_NAME  # Navigate to project
git status  # Now it should work
```

### Can't Push to GitHub

**Problem:** Authentication or remote issues

**Solution:**
```bash
# Check remote
git remote -v

# Fix remote URL if needed
git remote set-url origin https://github.com/USERNAME/REPO.git

# Check authentication
gh auth status
gh auth login  # If needed
```

### Merge Conflicts

**Problem:** Changes conflict with remote

**Solution:**
```bash
# Pull with rebase
git pull --rebase

# Fix conflicts in editor
# Then:
git add .
git rebase --continue
git push
```

### Accidentally Committed to Wrong Repo

**Problem:** Made changes in wrong directory

**Solution:**
```bash
# If not pushed yet:
git reset HEAD~1  # Undo commit, keep changes
# Move to correct directory and commit there

# If already pushed:
# Revert in wrong repo, commit in correct repo
```

## What NOT to Do

❌ **Don't commit projects/ folder to dashboard repo**
- Projects are gitignored for good reason
- Each project manages its own version control

❌ **Don't use git submodules**
- Current structure is simpler
- Submodules add unnecessary complexity

❌ **Don't merge all projects into one repo**
- Loses ability to share projects independently
- Makes version control history messy

❌ **Don't skip commit messages**
```bash
# Bad
git commit -m "update"

# Good
git commit -m "feat(task-manager): add due date filtering"
```

## Integration with Monorepo Tools

Since you're using **pnpm workspaces** and **Turborepo**:

### Build All Projects
```bash
# From root
pnpm build:all
```

### Lint All Projects
```bash
pnpm lint:all
```

### Commit After Bulk Changes
```bash
# If you updated dependencies across all projects
cd projects
for dir in */; do
  cd "$dir"
  git add package.json pnpm-lock.yaml
  git commit -m "chore: update dependencies"
  git push
  cd ..
done
```

## Quick Commands Cheatsheet

```bash
# Status of all projects
cd projects && for d in */; do echo "=== $d ===" && cd "$d" && git status -s && cd ..; done

# Pull all projects
cd projects && for d in */; do cd "$d" && git pull && cd ..; done

# Push all projects (use carefully!)
cd projects && for d in */; do cd "$d" && git push && cd ..; done

# Check branches
cd projects && for d in */; do cd "$d" && echo "$d: $(git branch --show-current)" && cd ..; done

# Check for uncommitted changes
cd projects && for d in */; do cd "$d" && [[ -n $(git status -s) ]] && echo "⚠️  $d" && cd ..; done
```

## Related Documentation

- **ADDING_PROJECTS.md** - How to add new projects to the monorepo
- **DEPENDENCY_MANAGEMENT.md** - How to update dependencies
- **PORT_ASSIGNMENTS.md** - Port assignments for each project

---

**Last Updated:** 2025
**All projects standardized on `main` branch and connected to GitHub** ✅
