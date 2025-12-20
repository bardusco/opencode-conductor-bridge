# Spec: Configure Dependabot (npm) with Automated Updates

## Overview

Configure GitHub Dependabot for automated npm dependency management with auto-merge capabilities for minor and patch version updates. This enhances project security and maintainability by keeping dependencies current with minimal manual intervention.

## Track Type

Chore (Infrastructure/Maintenance)

## Functional Requirements

### FR-1: Dependabot Configuration

- Create `.github/dependabot.yml` configuration file
- Configure for npm package ecosystem
- Set update schedule to daily
- Target `package.json` in the root directory
- Create individual PRs for each dependency update (no grouping)

### FR-2: Auto-Merge Workflow

- Create GitHub Actions workflow for auto-merging Dependabot PRs
- Auto-merge conditions:
  - PR is created by Dependabot bot
  - All CI checks pass (tests, linting, type checking)
  - Update is a minor or patch version bump
- Major version updates require manual review and merge

### FR-3: CI Integration

- Leverage existing CI workflow (`.github/workflows/ci.yml`) for validation
- No modifications to existing CI checks required
- Auto-merge workflow waits for CI completion before merging

## Non-Functional Requirements

### NFR-1: Security

- Workflow must verify PR author is `dependabot[bot]` to prevent unauthorized auto-merges
- Use GitHub's native `github.actor` validation

### NFR-2: Maintainability

- Configuration files should be well-documented with inline comments
- Follow GitHub Actions best practices

## Acceptance Criteria

1. [ ] `.github/dependabot.yml` exists and is valid YAML
2. [ ] Dependabot is configured for npm ecosystem with daily schedule
3. [ ] Auto-merge workflow `.github/workflows/dependabot-auto-merge.yml` exists
4. [ ] Auto-merge triggers only for Dependabot PRs
5. [ ] Minor and patch updates auto-merge after CI passes
6. [ ] Major updates do NOT auto-merge (require manual review)
7. [ ] All configuration files have descriptive comments

## Out of Scope

- Dependabot configuration for other ecosystems (e.g., GitHub Actions, Docker)
- Modifications to existing CI workflow
- Custom security advisories or vulnerability alerts configuration
- Dependabot version updates for GitHub Actions workflows
