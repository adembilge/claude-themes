# claude-themes

Recolor the whole Claude desktop app, not just the chat area. 41 themes, each in dark and light, a gallery where you preview each one before you pick it, a theme maker, seven tuning dials, and import and export for the tools you already use.

![version](https://img.shields.io/badge/version-3.10.1-blue) ![license](https://img.shields.io/badge/license-MIT-green)

## Install

In Claude Code:

```
/plugin marketplace add adembilge/claude-themes
/plugin install desktop-themes@claude-themes
```

Restart the session, then type `/claude-themes`.

## What you get

- **A gallery pane.** `/claude-themes` opens it. The top shows the current theme as a drawn preview under an animated band in its colors. Below, each theme has a small preview, one name, color dots and a short note.
- **One name, two looks.** Every theme is in one list, under one name, and has a dark and a light look. The Dark and Light buttons only change how the list is drawn, each theme in its dark or its light look; nothing is applied until you press a row, so pressing Light and then GitHub gives GitHub Light. Twelve themes (GitHub, Catppuccin, Gruvbox and nine more) have both looks made by hand; for the others (Dracula, Notion and the rest) the other look is made from the original by turning its lightness over and keeping the hues. Picking a theme sets the app to its mode.
- **Tabs, search and favorites.** Dark and Light (the main page), Favorites, Maker, Appearance (backdrop, tuning, readability, day and night) and Settings (VS Code import, folder theme, reset, about). Search filters by name or note; the star adds a theme to Favorites.
- **Switch from the prompt.** `/claude-themes dracula` changes theme without opening the pane. A name follows the mode you are in (`/claude-themes github`); `github light` and `github dark` name a look.

## Themes

41 themes. Palettes are the published ones, with small shifts to the lightest surface and the muted text where the app would otherwise refuse them (it rejects text that is too faint).

**Both looks made by hand:** Catppuccin, GitHub, Solarized, Gruvbox, One, Rosé Pine, Tokyo Night, Ayu, Everforest, Night Owl, Nightfox (with Dayfox), Kanagawa (Dragon and Lotus).

**Made from one look:** Espresso, Dracula, Nord, Monokai, Material Ocean, Synthwave, Absolutely, Linear, Lobster, Matrix, OG, Oscurange, Raycast, Sentry, Temple, Vercel, VS Code Plus, Carbonfox, Poimandres, Cobalt2, Palenight, Ayu Mirage, Vesper, Houston, Notion, Xcode, Dawnfox, Oceanic Next, Bluloco. The other look keeps the original's hues, turns the lightness over, and goes through the same contrast checks as every other theme.

## Make your own

- **Maker.** Type a name, pick a dark or light base and an accent color, and see the palette before you save. The accent box reads `#d98a4e`, `rgb(217, 138, 78)`, `hsl(26, 65%, 56%)` and CSS color names such as `coral`, and says what it understood. Colors the app would refuse are adjusted for you, and the tab lists what it changed.
- **Tuning.** Seven dials per theme, shown as compact cards and moved with `-` and `+`: warmth, saturation, surface brightness, text contrast, surface tint, accent and status colors. Every result still has to pass the app's checks, so a dial stops where the palette would break.
- **Backdrop** (Appearance tab). Nine smooth color fields drawn in the theme's own colors (Glow, Sunrise, Spotlight, Duotone, Vignette, Dusk, Twilight, Ember, Halo), with a Strength switch (Subtle, Normal, Bold).
- **Day and night.** Pick a day theme, a night theme and the hours, or switch to **Follow system** so the app uses the night theme in dark mode and the day theme in light mode.
- **Per folder.** Tie the current theme to the folder you are in (Settings tab); a session started there uses it.
- **Readability** (Appearance tab). High contrast for stronger borders and focus rings, and code colors matched to the theme, plus two options that apply to every theme:
  - **Soften glare** (On or Off): dims the main text on dark themes and the lightest surfaces on light ones.
  - **Night comfort** (On or Off): a warmer cast with less blue, optionally only at night by the Day and night hours.
  Both are still checked against the app's rules, and an option backs off by itself where a theme could not take it. One button resets them.

## Import

Paste into the Import card (Settings tab) or run `/claude-themes import <thing>`. The format is detected for you.

| Source | What to give it |
|---|---|
| A share code | A line starting with `claude-themes:` |
| A share link | The `#...` link made by Copy link |
| VS Code | A theme `.json` file, a web address, or pick one from the From VS Code list in the same card, which shows the themes installed in VS Code, Cursor, Windsurf or VS Code OSS |
| base16 / base24 | A `.yaml` or `.json` scheme |
| Windows Terminal | A scheme `.json`, or your `settings.json` (the first scheme is read) |
| iTerm2 | An `.itermcolors` file |

Paths work on every system, and `~/` at the start means your home folder. Imports go through an automatic contrast fix, so the result is always accepted by the app; the notice says what it adjusted. Themes that color only the editor give an approximate result.

## Export

The Share card (bottom of the Theme Maker tab) has one button per format and copies the theme you are on (with its tuning) to the clipboard. From the prompt, `/claude-themes export <format>` prints it.

| Format | Button / argument | File |
|---|---|---|
| VS Code | `vscode` | `name.json` |
| base16 YAML | `base16` | `name.yaml` |
| Windows Terminal | `wt` | `name.json` |

The terminal formats get a full set of 16 ANSI colors built from the theme's accent and status colors. Importing an export again gives back the same mode and accent.

## Share

**Copy link** and **Copy code** put the current theme in the clipboard as one line. Both are in the Share card; paste either into the Import card on another machine. A link opens a preview page in any browser (the page lives in `docs/t`, is static and has no tracking).

## Commands

| Command | Does |
|---|---|
| `/claude-themes` | Open the gallery |
| `/claude-themes <name>` | Switch theme, for example `dracula` |
| `/claude-themes import <code, link, path or address>` | Add a theme |
| `/claude-themes export <vscode\|base16\|wt>` | Print the current theme as a file for another tool |
| `/claude-themes follow on\|off` | Follow the system's light and dark |
| `/claude-themes reset look\|settings\|all` | Use the app's own look, restore settings, or erase everything |

## Platforms

Developed on Windows. CI runs the tests and plugin validation on Ubuntu, macOS and Windows for every change. The desktop app itself is released for Windows and macOS, so on macOS you can use everything; Linux can run the tests and the validator but has no app to theme.

## Develop

```
claude plugin validate .
claude plugin test .
```

| File | Holds |
|---|---|
| `hooks/register.tsx` | The mod: commands, the pane, state |
| `hooks/model.ts` | Theme type, color maths, contrast fixing, share codes |
| `hooks/import.ts` | VS Code and base16/24 readers |
| `hooks/terminal.ts` | Windows Terminal and iTerm2 readers |
| `hooks/export.ts` | The three exporters |
| `hooks/color.ts` | Reads typed colors (hex, rgb, hsl, names) |
| `hooks/families.ts` | Which themes are two looks of one name |
| `hooks/flip.ts` | Makes the other look of a theme that has one |
| `hooks/tune.ts` | The seven tuning dials |
| `hooks/share.ts` | Share links |
| `hooks/packs.ts` | The 25 extra built-in themes |
| `hooks/make-colors.js` | Generated by the design system; kept as copied |

Everything except `register.tsx` is pure (no `$`, no files), which is what makes it testable. The type definitions in `.claude-plugin/types/` are generated by the app and not committed.

To release: bump the version in `.claude-plugin/plugin.json`, add a section to `CHANGELOG.md`, push a tag such as `v3.3.0`. The release workflow checks the tag, runs the tests and publishes the notes.

## License

MIT
