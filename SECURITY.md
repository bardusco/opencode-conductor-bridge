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
3. **Verify checksums** of downloaded files against releases (when available)

## Security Best Practices

- Review generated commands in `.opencode/command/` before use
- Use `permission.external_directory: "ask"` in OpenCode config for explicit approval
- Keep the bridge updated to receive security fixes
