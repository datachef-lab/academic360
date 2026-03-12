#!/bin/sh

# Get current version from package.json
CURRENT=$(node -p "require('./package.json').version")

# Parse parts
MAJOR=$(echo $CURRENT | cut -d. -f1)
MINOR=$(echo $CURRENT | cut -d. -f2)
PATCH=$(echo $CURRENT | cut -d. -f3 | cut -d- -f1)

# Calculate next versions
NEXT_PATCH="$MAJOR.$MINOR.$((PATCH + 1))"
NEXT_MINOR="$MAJOR.$((MINOR + 1)).0"
NEXT_MAJOR="$((MAJOR + 1)).0.0"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  academic360 — create release branch"
echo "  current version: v$CURRENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  [1] patch  →  v$NEXT_PATCH  (bug fixes)"
echo "  [2] minor  →  v$NEXT_MINOR  (new features)"
echo "  [3] major  →  v$NEXT_MAJOR  (breaking changes)"
echo ""
printf "  Your choice (1/2/3): "
read choice < /dev/tty

case "$choice" in
  1) VERSION=$NEXT_PATCH ;;
  2) VERSION=$NEXT_MINOR ;;
  3) VERSION=$NEXT_MAJOR ;;
  *) echo "  → Invalid choice. Exiting."; exit 1 ;;
esac

BRANCH="release/v$VERSION"

echo ""
echo "  Creating $BRANCH from main..."
git checkout main
git pull origin main
git checkout -b $BRANCH

echo ""
echo "  ✓ Done! You're now on $BRANCH"
echo ""
echo "  Next steps:"
echo "  1. git merge feature/your-feature"
echo "  2. Test + get Ruchi Ma'am approval"
echo "  3. pnpm release:minor  (or patch/major)"
echo "  4. git checkout main && git merge $BRANCH"
echo "  5. git checkout develop && git merge main"
echo ""