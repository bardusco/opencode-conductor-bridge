# OpenCode Conductor Bridge

Bridge Gemini Conductor's Context-Driven Development (CDD) protocol to OpenCode.

## Overview

This project allows you to use the [Gemini Conductor](https://github.com/gemini-cli-extensions/conductor) methodology directly in OpenCode. It maps Conductor's commands and templates to OpenCode custom commands while maintaining a reference to the upstream repository.

## Installation

To install or update the bridge in your current project, run:

```bash
curl -sSL https://raw.githubusercontent.com/bardusco/opencode-conductor-bridge/main/install.sh | bash
```

### What this does:
1. Clones/Updates the bridge repository to `~/.opencode/conductor-bridge`.
2. Syncs the latest Conductor templates and commands.
3. Links the `/conductor.*` commands to your current project's `.opencode/commands` directory.

## Available Commands

Once installed, you can use the following commands in OpenCode:

- `/conductor.setup`: Initialize Conductor in your project.
- `/conductor.newTrack`: Start a new feature or bug fix track.
- `/conductor.implement`: Execute the current track's plan.
- `/conductor.status`: Check the progress of your tracks.
- `/conductor.revert`: Revert a track or task.
- `/conductor.bridge-update`: Update the bridge and its commands to the latest version.

## Maintenance

To update the bridge with the latest Conductor features, simply run:

```bash
npm run maintenance
```

Or via OpenCode:
- `/conductor.bridge-update`

## License

This bridge is distributed under the same license as Gemini Conductor (Apache-2.0). See [LICENSE](./LICENSE) and [NOTICE](./NOTICE) for details.

*Attribution: Based on the [Conductor](https://github.com/gemini-cli-extensions/conductor) project by Google.*
