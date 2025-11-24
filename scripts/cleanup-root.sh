#!/bin/bash
# Cleanup unnecessary files from monorepo root

set -e

echo "🧹 Cleaning up monorepo root..."

# Files to delete
FILES_TO_DELETE=(
  "package-lock.json"
  "install-all.bat"
  "install-all.sh"
  "pull-jira-from-1password.sh"
)

# Count deleted files
DELETED=0

for file in "${FILES_TO_DELETE[@]}"; do
  if [ -f "$file" ]; then
    echo "  ❌ Deleting: $file"
    rm "$file"
    DELETED=$((DELETED + 1))
  else
    echo "  ⏭️  Skipping: $file (not found)"
  fi
done

echo ""
echo "✅ Cleanup complete! Deleted $DELETED files."
echo ""
echo "📝 Git status shows these files were already deleted:"
echo "   - CODE_REVIEW_NOTES.md"
echo "   - GITHUB_SETUP.md"
echo "   - GIT_SETUP_SUMMARY.md"
echo "   - GIT_STANDARDIZATION_COMPLETE.md"
echo "   - GIT_STRUCTURE.md"
echo "   - NON_CRITICAL_ITEMS_STATUS.md"
echo "   - QA_REVIEW.md"
echo ""
echo "Next steps:"
echo "  1. Review changes: git status"
echo "  2. Commit deletions: git add -A && git commit -m 'chore: cleanup monorepo root'"
