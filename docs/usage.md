# Claude-Themes usage guide

[Back to the README](../README.md)

## Browse and switch themes

Run `/claude-themes` in Claude Desktop’s Code tab. In the gallery, **Dark** and **Light** switch the previews. Select a theme to apply that look and set the app’s mode. Search by name or description, and use the star to save a theme to **Favorites**.

From the prompt, run `/claude-themes github light` to choose a specific look. A family name such as `github` follows the current mode. A specific theme ID selects that exact look.

## Make and tune a theme

In **Theme Maker**, enter a name, choose a dark or light base, and give it an accent such as `#d98a4e`, `rgb(217, 138, 78)`, `hsl(26, 65%, 56%)`, or `coral`. The preview shows the palette and any adjustments needed to meet the app’s contrast checks.

In **Appearance**, use the seven tuning controls for warmth, saturation, surface brightness, text contrast, surface tint, accent, and status colors. Each control stops where the palette would fail the app’s checks.

- **Backdrop** offers Glow, Sunrise, Spotlight, Duotone, Vignette, Dusk, Twilight, Ember, and Halo in Subtle, Normal, and Bold strengths.
- **Readability** offers high contrast, palette-matched code colors, **Soften glare**, and **Night comfort**. Night comfort can follow the **Day and night** schedule.
- **Day and night** lets you pick two themes and the hours to use them. **Follow system** uses the day theme in light mode and the night theme in dark mode.
- To keep a theme for the current folder, use the folder theme card in **Settings**.

## Import a theme

Use **Import** in **Settings**, or run `/claude-themes import <code, link, path or address>`. Claude-Themes detects the format and reports any contrast adjustments. Local paths work across platforms, and `~/` refers to your home folder.

| Source | What to provide |
| --- | --- |
| Claude-Themes code | A line starting with `claude-themes:` |
| Claude-Themes link | A preview link from **Copy link** |
| VS Code | A theme JSON file or URL. The **From VS Code** picker can also find themes installed in VS Code, Cursor, Windsurf, and VS Code OSS. |
| base16 / base24 | A YAML or JSON scheme |
| Windows Terminal | A scheme JSON file or `settings.json`. From `settings.json`, the first scheme is used. |
| iTerm2 | An `.itermcolors` file |

Editor-only themes yield an approximate palette for the Code tab.

## Export or share a theme

Open the **Share** card at the bottom of **Theme Maker**. Export buttons copy the current theme with its tuning to the clipboard. Use `/claude-themes export <format>` to print the result and a suggested filename in the session.

| Export | Command argument | File |
| --- | --- | --- |
| VS Code | `vscode` | `name.json` |
| base16 YAML | `base16` | `name.yaml` |
| Windows Terminal | `wt` | `name.json` |

Terminal exports include 16 ANSI colors derived from the theme. Re-importing an export preserves the mode and accent.

**Copy code** copies a line you can paste into the Import card on another machine. **Copy link** makes a browser preview link that can also be imported. The preview is a [static page](t/index.html).

## Match the Claude Code terminal

In **Settings**, choose **Match terminal to…** to write the current palette to `~/.claude/themes/claude-themes.json`. In the Claude Code terminal, run `/theme` and select **Claude Themes**. If the themes directory was just created, restart Claude Code before selecting it. After switching Desktop themes, use the button again to refresh the terminal palette.

The custom theme supplies Claude Code’s accent, diffs, status colors, borders, and message backgrounds. Use the Windows Terminal export to set that terminal app’s own background and text colors.

## Command reference

| Command | Action |
| --- | --- |
| `/claude-themes` | Open the gallery. |
| `/claude-themes <name>` | Apply a theme, for example `/claude-themes dracula`. |
| `/claude-themes <name> dark` or `/claude-themes <name> light` | Apply a theme in the specified mode. |
| `/claude-themes import <code, link, path or address>` | Import and apply a theme. |
| `/claude-themes export <vscode\|base16\|wt>` | Print an export of the current theme. |
| `/claude-themes follow on` or `/claude-themes follow off` | Start or stop following the system’s appearance. |
| `/claude-themes reset look` | Restore Claude Desktop’s own appearance. |
| `/claude-themes reset settings` | Restore settings defaults and retain custom themes, favorites, and folder choices. |
| `/claude-themes reset all` | Erase custom themes, favorites, and folder choices, then apply the plugin’s default theme. |
