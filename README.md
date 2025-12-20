# OpenCode Conductor Bridge (v1.1.4)
...
### Version Pinning
You can pin a specific version, tag, or SHA by setting the `BRIDGE_REF` environment variable:
```bash
# Windows/Node
$env:BRIDGE_REF="v1.1.4"; npx github:bardusco/opencode-conductor-bridge

# macOS/Linux
BRIDGE_REF=v1.1.4 curl -sSL https://raw.githubusercontent.com/bardusco/opencode-conductor-bridge/main/install.sh | bash
```
...
## Compatibility Matrix

| Bridge Version | Conductor Submodule | OpenCode Version | Status |
| :--- | :--- | :--- | :--- |
| **v1.1.4** | [b49d770](https://github.com/gemini-cli-extensions/conductor/commit/b49d770) | >= 1.0.0 | ✅ Stable |
| v1.1.3 | [b49d770](https://github.com/gemini-cli-extensions/conductor/commit/b49d770) | >= 1.0.0 | ✅ Legacy |
| v1.1.2 | [b49d770](https://github.com/gemini-cli-extensions/conductor/commit/b49d770) | >= 1.0.0 | ✅ Legacy |
| v1.1.1 | [b49d770](https://github.com/gemini-cli-extensions/conductor/commit/b49d770) | >= 1.0.0 | ✅ Legacy |
| v1.1.0 | [b49d770](https://github.com/gemini-cli-extensions/conductor/commit/b49d770) | >= 1.0.0 | ✅ Legacy |


## Contributing

We welcome contributions! To set up your development environment:

1. Clone the repository with submodules: `git clone --recursive https://github.com/bardusco/opencode-conductor-bridge.git`
2. Install dependencies: `npm install`
3. Run tests and linting: `npm test`

### Pull Request Process
- Ensure `npm test` passes.
- If you update the Conductor submodule, update the Compatibility Matrix in the README.
- Sync commands before committing: `npm run sync`.

## License

This bridge is distributed under the same license as Gemini Conductor (Apache-2.0). See [LICENSE](./LICENSE) and [NOTICE](./NOTICE) for details.

*Attribution: Based on the [Conductor](https://github.com/gemini-cli-extensions/conductor) project by Google.*
