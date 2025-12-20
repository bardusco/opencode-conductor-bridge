#!/bin/bash
set -e

# Configuration
REPO_URL="https://github.com/bardusco/opencode-conductor-bridge.git"
INSTALL_DIR="$HOME/.opencode/conductor-bridge"
TARGET_PROJECT=$(pwd)

echo "🚀 Installing OpenCode Conductor Bridge..."

# 1. Ensure the base directory exists
mkdir -p "$HOME/.opencode"

# 2. Clone or Update the Bridge
if [ -d "$INSTALL_DIR" ]; then
    echo "     - Updating existing bridge in $INSTALL_DIR..."
    cd "$INSTALL_DIR"
    # Force reset to remote state to avoid pull conflicts with local generated files
    git fetch origin main
    git reset --hard origin/main
    git clean -fd
    git submodule update --init --recursive
else
    echo "     - Cloning bridge in $INSTALL_DIR..."
    git clone --recursive "$REPO_URL" "$INSTALL_DIR"
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
