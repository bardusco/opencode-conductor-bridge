#!/bin/bash
set -e

# Configuration
VERSION="1.1.2"
REPO_URL="https://github.com/bardusco/opencode-conductor-bridge.git"
INSTALL_DIR="$HOME/.opencode/conductor-bridge"
TARGET_PROJECT=$(pwd)

# 0. Check for Git
if ! command -v git &> /dev/null; then
    echo "❌ Error: 'git' is not installed. This bridge requires git to function."
    echo "Please install git and try again."
    exit 1
fi

# Allow pinning to a specific version/tag/sha
# If not provided, we will try to find the latest stable tag, or fallback to main
if [ -z "$BRIDGE_REF" ]; then
    # Try to get latest stable tag (vX.Y.Z), if fails or no tags, use main
    LATEST_TAG=$(git ls-remote --tags --sort="v:refname" "$REPO_URL" | grep -E 'refs/tags/v[0-9]+\.[0-9]+\.[0-9]+$' | tail -n1 | sed 's/.*\///')
    BRIDGE_REF=${LATEST_TAG:-main}
fi

echo "🚀 Installing OpenCode Conductor Bridge (v$VERSION)..."
echo "     - Ref: $BRIDGE_REF"

# 1. Ensure the base directory exists
mkdir -p "$HOME/.opencode"

# 2. Clone or Update the Bridge
if [ -d "$INSTALL_DIR" ]; then
    echo "     - Updating existing bridge in $INSTALL_DIR..."
    cd "$INSTALL_DIR"
    # Ensure we are in a clean state before doing anything
    git am --abort > /dev/null 2>&1 || true
    git merge --abort > /dev/null 2>&1 || true
    git reset --hard HEAD > /dev/null 2>&1 || true
    git clean -fd > /dev/null 2>&1 || true
    
    # Force reset to the specified ref
    git fetch origin "$BRIDGE_REF"
    git checkout "$BRIDGE_REF"
    git reset --hard "origin/$BRIDGE_REF" 2>/dev/null || git reset --hard "$BRIDGE_REF"
    git clean -fd
    git submodule update --init --recursive
else
    echo "     - Cloning bridge in $INSTALL_DIR..."
    git clone --recursive --branch "$BRIDGE_REF" "$REPO_URL" "$INSTALL_DIR" 2>/dev/null || \
    (git clone --recursive "$REPO_URL" "$INSTALL_DIR" && cd "$INSTALL_DIR" && git checkout "$BRIDGE_REF")
    cd "$INSTALL_DIR"
fi

# 3. Install dependencies and Sync
echo "     - Installing dependencies..."
npm install --quiet
echo "     - Syncing commands..."
npm run sync

# 4. Link to the current project
echo "     - Linking commands to the project in $TARGET_PROJECT..."
npx tsx scripts/setup-bridge.ts "$TARGET_PROJECT"

echo ""
echo "✅ Ready! The /conductor.* commands are now available in this project."
echo "💡 To update in the future, simply run this script again or use /conductor.bridge-update"
