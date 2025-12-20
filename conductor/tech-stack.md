# Tech Stack: OpenCode Conductor Bridge

## Core Technologies
- **Language:** TypeScript
- **Runtime:** Node.js

## Development & Build Tooling
- **Execution:** `tsx` and `ts-node` for running scripts.
- **Transpilation/Fast Builds:** `esbuild` (via node_modules dependencies).
- **Automation:** Bash shell scripting for CLI interactions and bridge management.

## Project Structure
- **Bridge Logic:** Custom TypeScript scripts in `scripts/`.
- **Templates:** Markdown command templates in `templates/`.
- **Upstream:** Managed via `vendor/conductor` submodule.
