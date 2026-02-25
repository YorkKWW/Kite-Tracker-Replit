#!/bin/bash
set -e

REPO="https://YorkKWW:${GITHUB_PAT}@github.com/YorkKWW/Kite-Tracker-Replit.git"

echo "=== Pushing to GitHub ==="
echo "Repository: github.com/YorkKWW/Kite-Tracker-Replit"
echo ""

BRANCH=$(git -C /home/runner/workspace rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
COMMIT=$(git -C /home/runner/workspace log --oneline -1 2>/dev/null)

echo "Branch : $BRANCH"
echo "Commit : $COMMIT"
echo ""

git -C /home/runner/workspace push "$REPO" "HEAD:main"

echo ""
echo "Done — https://github.com/YorkKWW/Kite-Tracker-Replit"
