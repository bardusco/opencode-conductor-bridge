#!/bin/bash
set -e

# Configuration
VERSION="1.1.8"
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

# 2. Clone the Bridge if it doesn't exist
if [ ! -d "$INSTALL_DIR" ]; then
    echo "     - Cloning bridge in $INSTALL_DIR..."
    git clone --recursive --branch "$BRIDGE_REF" "$REPO_URL" "$INSTALL_DIR" 2>/dev/null || \
    (git clone --recursive "$REPO_URL" "$INSTALL_DIR" && cd "$INSTALL_DIR" && git checkout "$BRIDGE_REF")
fi

# 3. Use the core installer (shared with Node version)
echo "     - Handing over to core installer..."
cd "$INSTALL_DIR"
export BRIDGE_REF="$BRIDGE_REF"
npx tsx scripts/install-core.ts "$TARGET_PROJECT"

echo ""
echo "✅ Ready! The /conductor.* commands are now available in this project."
echo "💡 To update in the future, simply run this script again or use /conductor.bridge-update"
