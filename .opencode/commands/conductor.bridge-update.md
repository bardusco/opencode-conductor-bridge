---
description: Updates the Conductor bridge by fetching upstream changes and re-syncing commands.
---

# Conductor Bridge: Update

This command automates the maintenance of the bridge. It performs the following steps:
1. Updates the Conductor submodule to the latest commit on remote.
2. Re-runs the synchronization script to update Markdown commands from TOML sources.
3. Re-installs the updated commands to the current project.

## Instructions

1. **Update Submodule**: Run `git submodule update --remote`.
2. **Run Sync**: Run `npm run sync`.
3. **Re-install**: Run `npx tsx scripts/setup-bridge.ts .`.

> [!TIP]
> You can also run `npm run maintenance` from the terminal for the same effect.
