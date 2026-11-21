# Command Reference

Run these `/claude-themes` commands at the Code prompt after installing the plugin. See [Installation](installation.md) for the separate Claude Code CLI commands that manage the plugin.

## Browse and apply

| Command | Action |
| --- | --- |
| `/claude-themes` | Open the gallery. |
| `/claude-themes <name>` | Apply a named theme, for example `/claude-themes dracula`. |
| `/claude-themes <name> dark` | Apply the dark variant of a family. |
| `/claude-themes <name> light` | Apply the light variant of a family. |
| `/claude-themes <id>` | Apply the exact variant, for example `/claude-themes github-light`. |

Replace `<name>` or `<id>` with a real value. See [theme name and ID examples](themes.md#switch-from-the-prompt).

## Import and export

| Command | Action |
| --- | --- |
| `/claude-themes import <code, link, path or URL>` | Detect the input format, then save and apply the imported palette. |
| `/claude-themes export vscode` | Print a VS Code theme JSON export. |
| `/claude-themes export base16` | Print a base16 YAML export. |
| `/claude-themes export wt` | Print a Windows Terminal JSON scheme. |

See [supported formats and examples](import-export.md).

## Follow system and reset

| Command | Effect |
| --- | --- |
| `/claude-themes follow on` | Follow the system mode using the configured day and night palettes. This turns off the clock-based schedule. |
| `/claude-themes follow off` | Stop following system mode. To resume switching by time, choose **By the hour** under **Day and night** in Appearance. |
| `/claude-themes reset look` | Restore Claude Desktop’s appearance and retain plugin data. Pick another gallery theme to turn the plugin’s colors back on. |
| `/claude-themes reset settings` | Restore appearance and schedule defaults and clear tuning. Custom themes, favorites, and folder assignments are retained. |
| `/claude-themes reset all` | Immediately erase custom themes, favorites, folder assignments, and tuning, then apply the plugin’s default palette. |

The `reset all` slash command applies immediately. Use [Copy code](import-export.md#share-a-theme) on any custom palettes you want to keep before running it. The **Reset** card in Settings offers a confirmation step.
