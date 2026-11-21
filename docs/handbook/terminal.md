# Terminal Matching

Copy the active Desktop palette to the Claude Code CLI, then select it once in the terminal’s `/theme` menu.

## Match the terminal

1. Apply your preferred theme in Claude Desktop’s Code tab.
2. Open `/claude-themes`, go to **Settings**, and choose **Match terminal to…**.
3. The plugin writes the current palette with its tuning to `~/.claude/themes/claude-themes.json`.
4. Open Claude Code in a terminal, run `/theme`, and choose **Claude Themes**. If `.claude/themes` was just created, restart the CLI once before opening `/theme` again.

The Desktop app and CLI need to use the same home directory for the CLI to find the file the plugin wrote. This matters if you run the CLI in WSL, an SSH session, or under a different user account.

## Refresh after switching

After changing or tuning the Desktop theme, choose **Match terminal to…** again to rewrite the same file. A CLI session already using **Claude Themes** can pick up the updated file. To stop using the palette, choose a different entry in `/theme`.

## Desktop, CLI, and terminal colors

| Surface | How to set its colors |
| --- | --- |
| Claude Desktop Code tab | Select a theme in the Claude-Themes gallery. |
| Claude Code CLI interface | Write the file with **Match terminal to…**, then select **Claude Themes**. |
| Windows Terminal window and shell | [Export a Windows Terminal scheme](import-export.md#export-a-palette) and apply it in Windows Terminal. |

The Claude Code theme colors its interface, including accents, diffs, status colors, borders, and message backgrounds. The terminal emulator supplies its own window and shell colors.
