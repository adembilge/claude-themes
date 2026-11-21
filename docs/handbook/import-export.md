# Import, Export & Share

Bring a palette from another editor or terminal into Claude Desktop, or take a Claude-Themes palette to another machine or tool.

## Import a palette

1. Open `/claude-themes` and find **Import** in **Settings**.
2. Paste a theme code, share link, local file path, or direct URL to a theme file. You can also use `/claude-themes import` followed by the same input.
3. Read the import message. A successful import adds a custom theme, applies it, and reports any color adjustments.

| Source | What to provide |
| --- | --- |
| Claude-Themes | A complete `claude-themes:` code or the preview URL from **Copy link**, including its `#` fragment. |
| VS Code | A theme JSON file, a direct URL to it, or a selection from **From VS Code**. The picker can find installed themes from VS Code, Cursor, Windsurf, and VS Code OSS. |
| base16 or base24 | A YAML or JSON scheme. |
| Windows Terminal | A scheme JSON file or `settings.json`. A settings file supplies the first scheme in its `schemes` array. |
| iTerm2 | An `.itermcolors` file. |

Example with a local file. `~/` expands to your home folder. Surround a path containing spaces with double quotes.

```text
/claude-themes import "~/themes/My Palette.json"
```

An editor theme supplies colors for a different interface, so Claude-Themes builds an approximate Code tab palette from it. With a GitHub-hosted file, use the raw URL so the plugin receives the theme contents.

## Export a palette

The **Share** card at the bottom of **Theme Maker** has export buttons that copy the current theme to the clipboard. The slash command prints the export and a suggested filename in the session.

| Format | Command argument | Suggested extension |
| --- | --- | --- |
| VS Code theme JSON | `vscode` | `.json` |
| base16 scheme | `base16` | `.yaml` |
| Windows Terminal scheme | `wt` | `.json` |

```text
/claude-themes export wt
```

Paste the output into the suggested file and follow the destination app’s instructions for loading it. Exports use the active palette with its color tuning applied. Windows Terminal exports include 16 ANSI colors derived from that palette. For the Claude Code CLI’s own format, use [Terminal Matching](terminal.md).

## Share a theme

- **Copy code** produces a single `claude-themes:` line to paste into **Import** on another machine.
- **Copy link** produces a browser preview URL that you can also paste into **Import**. Send the whole link, including the part after `#`, because it contains the palette.

Use either option when you want to share a Claude-Themes palette without choosing another app’s file format. Favorites, folder assignments, and schedule settings belong to your installation.
