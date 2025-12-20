# Spec: Minimal SCA with npm audit

## Overview

Implement minimal Software Composition Analysis (SCA) using `npm audit` to identify vulnerabilities in project dependencies. The solution includes CI integration with a clear policy (fail only on critical vulnerabilities) and a local script for developer use. This enhances project security posture without blocking development workflow for non-critical issues.

## Track Type

Chore (Security/Infrastructure)

## Functional Requirements

### FR-1: npm audit CI Integration

- Add npm audit step to existing GitHub Actions CI workflow (`.github/workflows/ci.yml`)
- Run `npm audit` after dependency installation
- Policy: Fail the build only if critical vulnerabilities are detected
- Non-critical vulnerabilities (low, moderate, high) should be reported but not block the build

### FR-2: Local Audit Script

- Add `audit` script to `package.json` for local developer use
- Script should run `npm audit` with the same policy as CI
- Provide clear output with actionable information

### FR-3: Audit Output Information

- Display summary table with vulnerability counts by severity level
- Include links to security advisories for each vulnerability found
- Show suggested remediation commands (e.g., `npm audit fix`)

### FR-4: Workflow Documentation

- Update `conductor/workflow.md` with instructions on when and how to run the audit
- Include the audit step in the appropriate workflow section (e.g., "Before Committing" or "Daily Development")

## Non-Functional Requirements

### NFR-1: Non-Blocking by Default

- The audit should inform, not obstruct development
- Only critical vulnerabilities should block CI builds
- Clear distinction between informational warnings and actionable failures

### NFR-2: Developer Experience

- Audit output should be clear and actionable
- Local script should be easy to run (`npm run audit`)
- Documentation should be concise and practical

## Acceptance Criteria

1. [ ] `npm run audit` script exists in `package.json`
2. [ ] CI workflow includes npm audit step
3. [ ] CI fails only when critical vulnerabilities are found
4. [ ] CI reports all vulnerability levels (low, moderate, high, critical)
5. [ ] Audit output includes summary table with counts per severity
6. [ ] Audit output includes links to advisories
7. [ ] Audit output includes remediation suggestions
8. [ ] `conductor/workflow.md` updated with audit instructions

## Out of Scope

- Third-party SCA tools (Snyk, Dependabot security alerts, etc.)
- Automated vulnerability remediation (auto-fix)
- License compliance scanning
- SBOM (Software Bill of Materials) generation
- Blocking builds on non-critical vulnerabilities
