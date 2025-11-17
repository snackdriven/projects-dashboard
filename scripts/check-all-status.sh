#!/bin/bash

# Check git status of all projects
# Usage: ./scripts/check-all-status.sh

cd "$(dirname "$0")/../projects" || exit

echo "🔍 Checking git status of all projects..."
echo ""

for dir in */; do
  project_name="${dir%/}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📁 $project_name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  cd "$project_name" || continue
  
  # Check if it's a git repo
  if [ -d ".git" ]; then
    # Get branch name
    branch=$(git branch --show-current 2>/dev/null || echo "no branch")
    
    # Get remote
    remote=$(git remote get-url origin 2>/dev/null || echo "no remote")
    
    # Get status
    status=$(git status --porcelain 2>/dev/null)
    ahead=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
    
    echo "Branch: $branch"
    echo "Remote: $remote"
    
    if [ -n "$status" ]; then
      echo "Status: ⚠️  Has uncommitted changes"
      echo "$status" | head -5
      [ $(echo "$status" | wc -l) -gt 5 ] && echo "... and more"
    elif [ "$ahead" != "0" ] && [ "$ahead" != "" ]; then
      echo "Status: ⬆️  $ahead commit(s) ahead of remote"
    else
      echo "Status: ✅ Clean"
    fi
  else
    echo "Status: ❌ Not a git repository"
  fi
  
  echo ""
  cd ..
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Status check complete"

