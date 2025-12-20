# Spec: Implement Unit Tests and Ensure 80% Code Coverage

## Objective
Implement a comprehensive unit test suite for all TypeScript scripts in the OpenCode Conductor Bridge project, ensuring a minimum code coverage of 80%.

## Scope

### Files to Test
1. **`scripts/sync-commands.ts`** - Syncs TOML commands to Markdown templates
2. **`scripts/setup-bridge.ts`** - Installs the bridge in target projects
3. **`scripts/verify-compat.ts`** - Verifies the compatibility matrix
4. **`scripts/verify-docs.ts`** - Verifies version consistency in documentation
5. **`scripts/uninstall-bridge.ts`** - Uninstalls the bridge from projects
6. **`bin/install.js`** - Main installation script

### Functional Requirements
- Each module must have a corresponding test file
- Tests must cover both success and failure cases
- Mocks must be used for external dependencies (fs, child_process, etc.)
- Tests must be runnable via `npm test`

### Non-Functional Requirements
- Code coverage >= 80%
- Tests must run quickly (< 30 seconds total)
- Coverage report must be generated in a readable format

## Acceptance Criteria
- [ ] Testing framework configured (Vitest or Jest)
- [ ] Unit tests for all listed scripts
- [ ] Code coverage >= 80%
- [ ] `npm test` command runs all tests
- [ ] CI pipeline updated to run tests
