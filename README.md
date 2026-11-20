<h1 align="center">
  <img src="docs/media/logo.svg" alt="Claude-Themes" width="440">
</h1>

<p align="center">Dark and light themes for Claude Desktop’s Code tab. Pick a palette or make your own.</p>

<p align="center">
  <a href="https://github.com/adembilge/claude-themes/releases"><img alt="Plugin version 3.11.1" src="https://img.shields.io/badge/version-3.11.1-blue"></a>
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-green"></a>
  <a href="https://github.com/adembilge/claude-themes/actions/workflows/ci.yml"><img alt="CI status on main" src="https://github.com/adembilge/claude-themes/actions/workflows/ci.yml/badge.svg?branch=main"></a>
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#themes">Themes</a> ·
  <a href="#theme-maker">Theme Maker</a> ·
  <a href="docs/usage.md">Usage guide</a>
</p>

<p align="center">
  <a href="docs/media/demo.gif"><img src="docs/media/demo.gif" alt="In Claude Desktop’s Code tab, /claude-themes opens the gallery. Selecting Dracula and then Catppuccin Light changes the colors of the Code tab."></a>
</p>

## Install

Open a local session in the **Code** tab of Claude Desktop on macOS or Windows. Run each command separately.

```text
/plugin marketplace add adembilge/claude-themes
/plugin install desktop-themes@claude-themes
```

Restart the session, then run **`/claude-themes`** to open the gallery.

For terminal sessions, see [Match the Claude Code terminal](docs/usage.md#match-the-claude-code-terminal).

## Themes

| Tokyo Night | Rosé Pine | GitHub Light |
| :---: | :---: | :---: |
| <img src="docs/media/tokyo-night.webp" alt="Tokyo Night preview with a deep navy background and blue accents" width="260"> | <img src="docs/media/rose-pine.webp" alt="Rosé Pine preview with a plum background and muted pink accents" width="260"> | <img src="docs/media/github-light.webp" alt="GitHub Light preview with a white background and blue accents" width="260"> |

In the gallery, search by name, switch between **Dark** and **Light**, or star a palette to find it under **Favorites**.

[Browse 40 theme families in dark and light](docs/media/themes.svg)

## Theme Maker

Choose a dark or light base, enter an accent color and see the palette update as you edit. Save it when the preview looks right.

<p align="center">
  <a href="docs/media/theme-maker.webp"><img src="docs/media/theme-maker.webp" alt="Theme Maker in Claude Desktop with dark and light base options, an accent color field, and a live palette preview." width="720"></a>
</p>

[Tune colors and backdrops](docs/usage.md#make-and-tune-a-theme) · [Import a palette](docs/usage.md#import-a-theme) · [Export or share a theme](docs/usage.md#export-or-share-a-theme)

## Commands

| Command | Action |
| --- | --- |
| `/claude-themes` | Open the gallery. |
| `/claude-themes dracula` | Apply Dracula. |
| `/claude-themes github light` | Apply GitHub Light. |
| `/claude-themes follow on` | Follow the system’s light and dark modes. |
| `/claude-themes reset look` | Restore Claude Desktop’s default look. |

[Full command reference](docs/usage.md#command-reference)

## Maintenance

<details>
<summary>Update or uninstall the plugin</summary>

### Update

In a terminal with the Claude Code CLI installed, refresh the marketplace and update the plugin.

```sh
claude plugin marketplace update claude-themes
claude plugin update desktop-themes@claude-themes
```

Restart the Code session to load the update. [Changelog](CHANGELOG.md)

### Uninstall

To restore Claude Desktop’s default look, run `/claude-themes reset look` in the Code tab before removing the plugin.

```sh
claude plugin uninstall desktop-themes@claude-themes
```

For a project or local install, add `--scope project` or `--scope local` to match the installation scope. Restart the Code session after removal.

If you set up terminal matching, choose another terminal theme with `/theme`. You can also remove the generated `~/.claude/themes/claude-themes.json` file.

</details>

[Changelog](CHANGELOG.md)

## License

[MIT](LICENSE) · Use it, change it, ship it.
