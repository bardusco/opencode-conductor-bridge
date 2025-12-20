# OpenCode Conductor Bridge (v1.2.0)

[![CI](https://github.com/bardusco/opencode-conductor-bridge/actions/workflows/ci.yml/badge.svg)](https://github.com/bardusco/opencode-conductor-bridge/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/bardusco/opencode-conductor-bridge/graph/badge.svg)](https://codecov.io/gh/bardusco/opencode-conductor-bridge)
[![npm audit](https://img.shields.io/badge/npm-audit%20passing-success?logo=npm)](https://docs.npmjs.com/cli/v10/commands/npm-audit)
[![Version](https://img.shields.io/github/v/tag/bardusco/opencode-conductor-bridge?label=version&color=blue)](https://github.com/bardusco/opencode-conductor-bridge/releases)
[![License](https://img.shields.io/github/license/bardusco/opencode-conductor-bridge?color=orange)](./LICENSE)
[![Conductor Upstream](https://img.shields.io/badge/conductor-upstream-blueviolet)](https://github.com/gemini-cli-extensions/conductor)

Bridge Gemini Conductor's Context-Driven Development (CDD) protocol to OpenCode.

## Overview

This project allows you to use the [Gemini Conductor](https://github.com/gemini-cli-extensions/conductor) methodology directly in OpenCode. It maps Conductor's commands and templates to OpenCode custom commands while maintaining a reference to the upstream repository.

> **Dogfooding:** This bridge is developed using Conductor itself. See [`conductor/`](./conductor/) for our workflow, tracks, and development guidelines.

## Installation

### Prerequisites
- **Git:** Required to clone and update the bridge.
- **Node.js >= 18:** Required to run the synchronization and setup scripts.

### Quick Start
Works on Windows, macOS, and Linux:
```bash
npx github:bardusco/opencode-conductor-bridge
```

### Version Pinning
Pin a specific version with `BRIDGE_REF`:
```bash
BRIDGE_REF=v1.2.0 npx github:bardusco/opencode-conductor-bridge
```

## Permissions & Configuration

The bridge installs templates in `~/.opencode/conductor-bridge` and links them to your projects. Since OpenCode accesses files outside your project directory, you might need to adjust your permissions.

If you see permission prompts, configure it in your `opencode.json`:

**Global config** (`~/.config/opencode/opencode.json`):
```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "external_directory": "ask"
  }
}
```

**Per-project config** (`opencode.json` in project root):
```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "external_directory": "allow"
  }
}
```

Options: `"ask"` (prompt each time), `"allow"` (auto-approve), `"deny"` (block).

See [OpenCode Permissions docs](https://opencode.ai/docs/permissions/) for details.

## Available Commands

Once installed, you can use the following commands in OpenCode:

- `/conductor.setup`: Initialize Conductor in your project.
- `/conductor.newTrack`: Start a new feature or bug fix track.
- `/conductor.implement`: Execute the current track's plan.
- `/conductor.status`: Check the progress of your tracks.
- `/conductor.revert`: Revert a track or task.
- `/conductor.styleguide`: Access language-specific code styleguides (Go, TS, Python, etc.). **[Bridge Exclusive]**
- `/conductor.bridge-update`: Update the bridge and its commands to the latest version.
- `/conductor.uninstall`: Remove bridge commands from the current project.

### Styleguide Command (Bridge Exclusive)

The `/conductor.styleguide` command is an **additional feature** exclusive to this bridge. 

In the original Conductor, styleguides exist only as reference files that the agent reads implicitly during code generation. The bridge **preserves this behavior** and **adds** an interactive command that allows you to:

- **Consult** any styleguide on demand: `/conductor.styleguide python`
- **Apply** rules to a specific file or review code against the guidelines
- **List** available languages when called without arguments

**Available styleguides:** `general`, `go`, `html-css`, `javascript`, `python`, `typescript`

## How It Works

The bridge operates in three layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR PROJECT                              │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │ .opencode/command/  │    │ conductor/                      │ │
│  │ conductor.*.md      │    │ ├── product.md      (yours)     │ │
│  │ (installed copies)  │    │ ├── workflow.md     (yours)     │ │
│  └─────────┬───────────┘    │ └── tracks/         (yours)     │ │
│            │                └─────────────────────────────────┘ │
└────────────┼────────────────────────────────────────────────────┘
             │ setup-bridge.ts
┌────────────┴────────────────────────────────────────────────────┐
│              ~/.opencode/conductor-bridge/                       │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │ templates/opencode/ │◄───│ vendor/conductor/               │ │
│  │ command/*.md        │    │ (git submodule)                 │ │
│  │ (generated)         │    │ - commands/conductor/*.toml     │ │
│  └─────────────────────┘    │ - templates/code_styleguides/   │ │
│            ▲          sync  └─────────────────────────────────┘ │
│            │                             ▲                       │
│       npm run sync              git submodule update --remote    │
└─────────────────────────────────────────────────────────────────┘
```

### Update Flow

When you run `/conductor.bridge-update`:

1. **Submodule Update** - Fetches latest Conductor from upstream
2. **Sync** - Regenerates bridge templates from TOML sources  
3. **Setup** - Reinstalls commands to your project

**Your project's `conductor/` directory is never touched.**

## Customization

### Safe to Customize (Your Project)

These files are created by `/conductor.setup` and belong to you:

| Directory/File | Purpose | Updated by Bridge? |
|----------------|---------|-------------------|
| `conductor/product.md` | Product vision | Never |
| `conductor/product-guidelines.md` | UX guidelines | Never |
| `conductor/tech-stack.md` | Tech decisions | Never |
| `conductor/workflow.md` | Development workflow | Never |
| `conductor/tracks/` | Feature/bug tracks | Never |

### Regenerated on Update (Do Not Edit)

| Directory/File | Purpose | Why Not Edit? |
|----------------|---------|---------------|
| `.opencode/command/conductor.*.md` | Bridge commands | Overwritten by `/conductor.bridge-update` |

### Forking the Bridge

If you fork this repository for team customization:

- `conductor/workflow.md` - Customize your team's development workflow
- `conductor/code_styleguides/` - Add custom language styleguides

> **Warning:** The `npm run maintenance` command includes `git reset --hard` which discards uncommitted changes. Always commit your customizations before running it.

## Security

We focus on transparency and predictability:

1. **Supply Chain:** By default, the installer uses the latest stable tag (e.g., `v1.2.0`). Use `BRIDGE_REF` to pin to a specific SHA for production environments.
2. **Isolation:** The bridge core resides in `~/.opencode/conductor-bridge`. It only exports Markdown-based commands to your projects. No hidden background processes are installed.
3. **Auditability:** Every command generated by the bridge includes metadata linking back to the specific Conductor SHA used to generate it.

### Corporate/Air-Gapped Installation

For environments that block `npx github:`, use manual installation:

```bash
# 1. Clone (or mirror internally)
git clone --recursive https://github.com/bardusco/opencode-conductor-bridge.git
cd opencode-conductor-bridge

# 2. Pin to a specific version
git checkout v1.2.0

# 3. Install dependencies and run
npm ci
node bin/install.js
```

This gives full control over the source and avoids remote execution.

## Compatibility Matrix

| Bridge Version | Conductor Submodule | OpenCode Version | Status |
| :--- | :--- | :--- | :--- |
| **v1.2.0** | [b49d770](https://github.com/gemini-cli-extensions/conductor/commit/b49d770) | >= 1.0.0 | ✅ Stable |
| v1.1.14 | [b49d770](https://github.com/gemini-cli-extensions/conductor/commit/b49d770) | >= 1.0.0 | ✅ Stable |
| v1.1.13 | [b49d770](https://github.com/gemini-cli-extensions/conductor/commit/b49d770) | >= 1.0.0 | ✅ Stable |
| v1.1.12 | [b49d770](https://github.com/gemini-cli-extensions/conductor/commit/b49d770) | >= 1.0.0 | ✅ Stable |
| v1.1.11 | [b49d770](https://github.com/gemini-cli-extensions/conductor/commit/b49d770) | >= 1.0.0 | ✅ Stable |
| v1.1.10 | [b49d770](https://github.com/gemini-cli-extensions/conductor/commit/b49d770) | >= 1.0.0 | ✅ Stable |

> For older versions, see [git tags](https://github.com/bardusco/opencode-conductor-bridge/tags).

## Contributing

We welcome contributions! This project uses Conductor for its own development.

### Setup

1. Clone with submodules: `git clone --recursive https://github.com/bardusco/opencode-conductor-bridge.git`
2. Install dependencies: `npm install`
3. Run checks: `npm run check`

### Development Workflow

See [`conductor/workflow.md`](./conductor/workflow.md) for our complete development process, including:

- Task lifecycle and TDD workflow
- Quality gates and commit guidelines
- Release protocol

### Pull Request Process

- Ensure `npm run check` passes (lint, sync, verify, tests with 80%+ coverage)
- If updating the Conductor submodule, update the Compatibility Matrix
- Sync commands before committing: `npm run sync`

## License

This bridge is distributed under the same license as Gemini Conductor (Apache-2.0). See [LICENSE](./LICENSE) and [NOTICE](./NOTICE) for details.

*Attribution: Based on the [Conductor](https://github.com/gemini-cli-extensions/conductor) project by Google.*
