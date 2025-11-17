#!/bin/bash

# Setup a new project with git and GitHub
# Usage: ./scripts/setup-new-project.sh PROJECT_NAME [--private]

PROJECT_NAME=$1
PRIVATE_FLAG=$2

if [ -z "$PROJECT_NAME" ]; then
  echo "Usage: ./scripts/setup-new-project.sh PROJECT_NAME [--private]"
  exit 1
fi

PROJECT_DIR="../projects/$PROJECT_NAME"

if [ -d "$PROJECT_DIR" ]; then
  echo "❌ Project directory already exists: $PROJECT_DIR"
  exit 1
fi

echo "🚀 Setting up new project: $PROJECT_NAME"
echo ""

# Create directory
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR" || exit 1

# Initialize git
echo "📦 Initializing git repository..."
git init

# Create basic files if they don't exist
if [ ! -f "README.md" ]; then
  echo "# $PROJECT_NAME" > README.md
  echo "" >> README.md
  echo "Project description goes here." >> README.md
fi

# Initial commit
git add .
git commit -m "Initial commit"

# Create GitHub repo
echo ""
echo "🌐 Creating GitHub repository..."

if [ "$PRIVATE_FLAG" = "--private" ]; then
  gh repo create "$PROJECT_NAME" --private --source=. --remote=origin --push
else
  gh repo create "$PROJECT_NAME" --public --source=. --remote=origin --push
fi

echo ""
echo "✅ Project setup complete!"
echo "📍 Location: $PROJECT_DIR"
echo "🔗 GitHub: https://github.com/snackdriven/$PROJECT_NAME"

