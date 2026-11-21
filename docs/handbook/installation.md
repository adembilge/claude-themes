# Installation

Install Claude-Themes in a local session in the **Code** tab of Claude Desktop on macOS or Windows. You can use the gallery from that session after restarting it.

## Install the plugin

1. Open Claude Desktop and start a local session in **Code**.
2. Add the marketplace at the Code prompt.

   ```text
   /plugin marketplace add adembilge/claude-themes
   ```

3. Install the plugin in a separate command.

   ```text
   /plugin install desktop-themes@claude-themes
   ```

4. Restart the Code session so it loads the plugin.

The identifier `desktop-themes@claude-themes` combines the plugin name (`desktop-themes`) and marketplace name (`claude-themes`). Use that full identifier for install, update, and uninstall.

## Quick Start

Run the following at the Code prompt in the restarted session.

```text
/claude-themes
```

Choose **Dark** or **Light**, then select a theme card. The Code tab should change immediately. If the command is missing or colors appear on a different surface than expected, see [Troubleshooting](troubleshooting.md).

## Update

From a terminal with the Claude Code CLI installed, refresh the marketplace, then update the plugin.

```sh
claude plugin marketplace update claude-themes
claude plugin update desktop-themes@claude-themes
```

Restart the Code session to load the update. Open `/claude-themes` again to confirm the gallery loads.

## Uninstall

1. In Claude Desktop’s Code tab, run `/claude-themes reset look` to restore the app’s appearance.
2. In a terminal with the Claude Code CLI installed, uninstall the plugin.

   ```sh
   claude plugin uninstall desktop-themes@claude-themes
   ```

3. For a project or local installation, append `--scope project` or `--scope local` to match the scope you used. Restart the Code session.

If you exported a Claude Code terminal theme, use `/theme` in the CLI to select another theme. Then you can remove `~/.claude/themes/claude-themes.json` if you no longer need it.
