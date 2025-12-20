# Plan: Minimal SCA with npm audit

## Phase 1: Local Audit Script

- [x] Task: Add `audit` script to `package.json`
  - [x] Sub-task: Create npm script that runs `npm audit` with appropriate flags
  - [x] Sub-task: Configure script to return exit code based on critical vulnerabilities only
  - [x] Sub-task: Verify script outputs summary, advisory links, and remediation suggestions
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Local Audit Script' (Protocol in workflow.md)

## Phase 2: CI Integration

- [x] Task: Add npm audit step to `.github/workflows/ci.yml`
  - [x] Sub-task: Add audit step after dependency installation
  - [x] Sub-task: Configure step to fail only on critical vulnerabilities
  - [x] Sub-task: Ensure non-critical vulnerabilities are reported but don't block the build
  - [x] Sub-task: Add descriptive comments explaining the policy
- [ ] Task: Conductor - User Manual Verification 'Phase 2: CI Integration' (Protocol in workflow.md)

## Phase 3: Documentation

- [x] Task: Update `conductor/workflow.md` with audit instructions
  - [x] Sub-task: Add audit command to "Before Committing" section
  - [x] Sub-task: Document the vulnerability policy (fail on critical only)
  - [x] Sub-task: Include guidance on interpreting audit results
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Documentation' (Protocol in workflow.md)
