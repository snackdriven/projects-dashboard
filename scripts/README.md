# Helper Scripts

Scripts to help manage multiple git repositories in the projects folder.

## Available Scripts

### check-all-status.sh / check-all-status.bat
Check git status of all projects at once.

**Usage:**
```bash
# Linux/Mac
./scripts/check-all-status.sh

# Windows
scripts\check-all-status.bat
```

**Output:**
- Shows branch name for each project
- Shows remote URL
- Shows uncommitted changes
- Shows if ahead of remote

### setup-new-project.sh
Create a new project with git and GitHub setup.

**Usage:**
```bash
./scripts/setup-new-project.sh PROJECT_NAME [--private]
```

**Example:**
```bash
./scripts/setup-new-project.sh my-new-project
./scripts/setup-new-project.sh private-project --private
```

**What it does:**
1. Creates project directory
2. Initializes git repo
3. Creates basic README
4. Makes initial commit
5. Creates GitHub repo
6. Pushes to GitHub

## Adding New Scripts

When adding new scripts:
- Create both `.sh` (Linux/Mac) and `.bat` (Windows) versions when possible
- Make scripts executable: `chmod +x script.sh`
- Document usage in this README
- Test on both platforms if possible

