# GitHub Repository Setup

## Create a New Repository on GitHub

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name it `projects-dashboard` (or your preferred name)
5. Choose whether to make it public or private
6. **Do NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Connect Local Repository to GitHub

After creating the repository on GitHub, run these commands:

```bash
cd C:\Users\bette\Desktop\projects-dashboard

# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/projects-dashboard.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Alternative: Using SSH

If you prefer SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/projects-dashboard.git
git branch -M main
git push -u origin main
```

## Future Updates

To push future changes:

```bash
git add .
git commit -m "Your commit message"
git push
```

