# Troubleshooting

Check the session, the active theme settings, and the input format when a command or palette behaves differently than you expect.

## The gallery command is missing

Confirm that you’re in a local **Code** session in Claude Desktop. Check that the marketplace and plugin installation commands in [Installation](installation.md#install-the-plugin) completed successfully. Restart the Code session after installing or updating, then retry `/claude-themes`.

## A theme or mode changed unexpectedly

- If you ran a family name alone, add an explicit mode such as `/claude-themes github light`.
- For changes after opening a folder, check the folder theme card in **Settings**.
- For changes after submitting a prompt or changing the system mode, check **Day and night** and **Follow system** in **Appearance**.
- If you only want to go back to Claude Desktop’s default colors, run `/claude-themes reset look`. This keeps your themes and favorites.

## A file or share link will not import

- Confirm that the file is in a [supported format](import-export.md#import-a-palette). For URLs, check that opening one returns the palette file itself.
- For a local path, check that the session can read the file. Quote paths with spaces and use `~/` for your home folder if helpful.
- For a share link, copy the entire URL including its fragment. For a share code, keep the `claude-themes:` prefix.
- If the import succeeds but the accent or surfaces change, review the adjustment message. Imported colors may be changed by the plugin’s palette and contrast checks.

## The Claude Code theme is missing from the terminal

Check whether **Match terminal to…** reports a successful write. Confirm that `~/.claude/themes/claude-themes.json` exists under the CLI account’s home directory. Restart the CLI if the directory was newly created, then run `/theme` and choose **Claude Themes**. See [Terminal Matching](terminal.md) for refresh and terminal emulator settings.

## Report an issue

Include the plugin and Claude Desktop versions, operating system, the command or button you used, what you expected, and what happened. If the issue is specific to an import, include its format and a shareable example.

[Open a GitHub issue](https://github.com/adembilge/claude-themes/issues/new/choose).
