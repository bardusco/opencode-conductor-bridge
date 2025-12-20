---
description: Removes all Conductor bridge commands from the current project.
---

# Conductor Bridge: Uninstall

This command will remove all Conductor bridge commands (files starting with `conductor.`) from your project's `.opencode/command` directory.

## Instructions

1. **Run Uninstall**: Run `npm run uninstall -- .` if you are in the bridge directory, or more simply, execute the following bash command:
   ```bash
   npx tsx {{BRIDGE_ROOT}}/scripts/uninstall-bridge.ts .
   ```

> [!WARNING]
> This will remove the bridge commands. To remove the actual project state (the `conductor/` directory), you must do so manually.
