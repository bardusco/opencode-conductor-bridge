# OpenCode Conductor Bridge

Bridge Gemini Conductor's Context-Driven Development (CDD) protocol to OpenCode.

## Overview

This project allows you to use the [Gemini Conductor](https://github.com/gemini-cli-extensions/conductor) methodology directly in OpenCode. It maps Conductor's commands and templates to OpenCode custom commands while maintaining a reference to the upstream repository.

## Installation

1. Clone this repository to your local machine:
   ```bash
   git clone --recursive https://github.com/your-username/opencode-conductor-bridge.git ~/opencode-conductor-bridge
   ```

2. Navigate to the bridge directory and install dependencies:
   ```bash
   cd ~/opencode-conductor-bridge
   npm install
   ```

3. "Install" the bridge into your target project:
   ```bash
   npx tsx scripts/setup-bridge.ts /path/to/your/project
   ```

This will copy the bridged commands to `/path/to/your/project/.opencode/commands/` with absolute paths pointing back to the bridge templates.

## Available Commands

Once installed, you can use the following commands in OpenCode:

- `/conductor.setup`: Initialize Conductor in your project.
- `/conductor.newTrack`: Start a new feature or bug fix track.
- `/conductor.implement`: Execute the current track's plan.
- `/conductor.status`: Check the progress of your tracks.
- `/conductor.revert`: Revert a track or task.

## Maintenance

To update the bridge with the latest Conductor features, simply run:

```bash
npm run maintenance
```

Or via OpenCode:
- `/conductor.bridge-update`

To update the bridge in a **different** project:
```bash
npx tsx scripts/setup-bridge.ts /path/to/your/project
```

## License

This bridge is distributed under the same license as Gemini Conductor (Apache-2.0). See [LICENSE](./LICENSE) and [NOTICE](./NOTICE) for details.
Atribuição: Baseado no projeto [Conductor](https://github.com/gemini-cli-extensions/conductor) da Google.
