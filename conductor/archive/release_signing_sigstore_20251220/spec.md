# Spec: Release/Tag Signing with Sigstore

## Overview

Implement release and tag signing using Sigstore (cosign) with keyless signing via GitHub Actions OIDC. This provides cryptographic provenance for releases and assets, meeting compliance requirements for enterprise users without the overhead of manual key management.

## Track Type

Chore (Security/Compliance)

## Functional Requirements

### FR-1: Git Tag Signing

- Sign Git tags automatically during the release workflow
- Use Sigstore's keyless signing with GitHub Actions OIDC identity
- Store signature artifacts alongside the release

### FR-2: Release Asset Signing

- Sign all release assets (binaries, archives) attached to GitHub Releases
- Generate `.sig` signature files for each asset
- Upload signature files as additional release assets

### FR-3: CI Automation

- Integrate signing into the existing release workflow or create a dedicated workflow
- Trigger automatically when a GitHub Release is published
- Use `sigstore/cosign-installer` GitHub Action for cosign setup
- Use OIDC token for keyless signing (no secrets management required)

### FR-4: Verification Support

- Document how users can verify signatures using cosign
- Include verification commands in release notes or README

## Non-Functional Requirements

### NFR-1: Security

- No private keys stored in repository or secrets
- Leverage GitHub's OIDC provider for identity attestation
- Signatures are publicly verifiable via Sigstore's transparency log (Rekor)

### NFR-2: Transparency

- All signatures recorded in Sigstore's public transparency log
- Provides auditable proof of release authenticity

### NFR-3: Enterprise Compliance

- Meets supply chain security requirements (SLSA, SOC2)
- Provides cryptographic proof of artifact provenance

## Acceptance Criteria

1. [ ] GitHub Actions workflow for signing exists
2. [ ] Workflow triggers automatically on release publish
3. [ ] Git tags are signed using Sigstore keyless signing
4. [ ] Release assets have corresponding `.sig` signature files
5. [ ] Signature files are uploaded to the GitHub Release
6. [ ] OIDC token is used (no manual key management)
7. [ ] Verification instructions documented in README or release notes

## Out of Scope

- GPG signing (traditional key-based approach)
- Container image signing
- SBOM (Software Bill of Materials) generation
- SLSA provenance attestation (can be added in future track)
- Signing for npm package publishing
