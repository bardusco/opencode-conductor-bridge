# Plan: Release/Tag Signing with Sigstore

## Phase 1: Signing Workflow Setup

- [x] Task: Create `.github/workflows/release-signing.yml` workflow
  - [x] Sub-task: Configure workflow trigger on release published event
  - [x] Sub-task: Add `sigstore/cosign-installer` action for cosign setup
  - [x] Sub-task: Configure OIDC permissions for keyless signing
  - [x] Sub-task: Add descriptive inline comments
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Signing Workflow Setup' (Protocol in workflow.md)

## Phase 2: Git Tag Signing

- [x] Task: Implement Git tag signing step
  - [x] Sub-task: Fetch the release tag in the workflow
  - [x] Sub-task: Sign the tag using cosign with keyless OIDC identity
  - [x] Sub-task: Upload tag signature as release asset
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Git Tag Signing' (Protocol in workflow.md)

## Phase 3: Release Asset Signing

- [x] Task: Implement release asset signing step
  - [x] Sub-task: Download all release assets
  - [x] Sub-task: Sign each asset using cosign (generate `.sig` files)
  - [x] Sub-task: Upload `.sig` signature files to the GitHub Release
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Release Asset Signing' (Protocol in workflow.md)

## Phase 4: Documentation

- [x] Task: Document signature verification process
  - [x] Sub-task: Add verification instructions to README or SECURITY.md
  - [x] Sub-task: Include example cosign verify commands
  - [x] Sub-task: Explain the keyless signing model and transparency log
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Documentation' (Protocol in workflow.md)
