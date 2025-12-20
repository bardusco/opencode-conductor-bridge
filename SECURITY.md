# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| < 1.1   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

1. **Do not** open a public GitHub issue for security vulnerabilities.
2. Email the maintainer directly at: **danilo@bardusco.com**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes (optional)

You can expect an initial response within **48 hours**. We will work with you to understand and address the issue promptly.

## Scope

This security policy covers:

- The bridge installation scripts (`install.sh`, `bin/install.js`)
- The command synchronization process (`scripts/sync-commands.ts`)
- Generated OpenCode command templates

### Out of Scope

- Vulnerabilities in the upstream [Gemini Conductor](https://github.com/gemini-cli-extensions/conductor) project (report those upstream)
- Vulnerabilities in OpenCode itself (report to [sst/opencode](https://github.com/sst/opencode))
- Issues requiring physical access to the machine

## Supply Chain Security

For production/corporate environments, we recommend:

1. **Pin to a specific version** using `BRIDGE_REF` or the [manual installation method](README.md#corporateair-gapped-installation)
2. **Audit the source** before installation: all code is open source
3. **Verify release signatures** using cosign (see below)

## Release Signing and Verification

All releases are cryptographically signed using [Sigstore](https://www.sigstore.dev/) with keyless signing via GitHub Actions OIDC. This provides:

- **Provenance**: Cryptographic proof that releases were built by this repository's GitHub Actions
- **Integrity**: Verification that release assets haven't been tampered with
- **Transparency**: All signatures are recorded in Sigstore's public transparency log (Rekor)

### Verifying Release Signatures

To verify a release signature, install [cosign](https://docs.sigstore.dev/cosign/installation/) and run:

```bash
# Download the release asset and its signature files
gh release download v1.x.x --pattern "*.sig" --pattern "*.pem" --pattern "*.txt"

# Verify the tag signature
cosign verify-blob v1.x.x.txt \
  --signature v1.x.x.sig \
  --certificate v1.x.x.pem \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  --certificate-identity-regexp 'https://github.com/bardusco/opencode-conductor-bridge/'

# Verify a release asset (if any)
cosign verify-blob <asset-file> \
  --signature <asset-file>.sig \
  --certificate <asset-file>.pem \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  --certificate-identity-regexp 'https://github.com/bardusco/opencode-conductor-bridge/'
```

### Understanding Keyless Signing

Unlike traditional signing with private keys, keyless signing uses GitHub's OIDC provider to attest the identity of the workflow that created the signature. This means:

- **No key management**: No private keys to store, rotate, or protect
- **Automatic rotation**: Identity is tied to the GitHub Actions workflow, not a static key
- **Publicly auditable**: All signatures are recorded in Sigstore's transparency log

The signature certificate contains claims that prove:
- The signature was created by a GitHub Actions workflow
- The workflow ran in this specific repository
- The workflow was triggered by a specific event (release publication)

## Security Best Practices

- Review generated commands in `.opencode/command/` before use
- Use `permission.external_directory: "ask"` in OpenCode config for explicit approval
- Keep the bridge updated to receive security fixes
