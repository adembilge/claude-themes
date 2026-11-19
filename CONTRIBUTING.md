# Contributing to Claude-Themes

## Local setup

Install Node.js 22 and the Claude Code CLI, then clone the repository.

```sh
npm install -g @anthropic-ai/claude-code
git clone https://github.com/adembilge/claude-themes.git
cd claude-themes
claude plugin validate .
claude plugin test .
```

CI runs those checks on Windows, macOS, and Ubuntu. Use Claude Desktop on Windows or macOS to check visual changes in the Code tab.

For a CLI development session, run `claude --plugin-dir .` from the checkout. For Desktop testing, use a development profile and add the checkout as a local marketplace with `/plugin marketplace add <absolute-checkout-path>`. Install `desktop-themes@claude-themes` from that marketplace and restart the Code session. [Claude Code mod development guide](https://code.claude.com/docs/en/plugins/mods/create)

## Theme changes

- The core palettes and gallery preview live in [hooks/register.tsx](hooks/register.tsx). Additional palettes are in [hooks/packs.ts](hooks/packs.ts).
- Register a hand-authored dark and light pair in [hooks/families.ts](hooks/families.ts). For a single-look theme, [hooks/flip.ts](hooks/flip.ts) derives its other mode.
- Open `/claude-themes` in the Code tab. Find the theme by name, select its row under **Dark**, then select it again under **Light**. Check the preview and the applied Code tab in both modes, including muted text, the active sidebar row, and the composer.
- For a change to the built-in collection, update the theme gallery image, count, and names in the README.

## Pull requests

Describe the change, how you verified it, and which platform you used. Include dark and light screenshots for palette or gallery changes. Link any related issue and include the results of the validation and test commands above.

Send vulnerability reports through the [security policy](SECURITY.md).

## Releases

Maintainers update the version in `.claude-plugin/plugin.json` and add a matching section to `CHANGELOG.md`. Push a tag in the form `v<version>` to run validation and tests and publish the GitHub release with those notes.
