# Changelog

All notable changes to claude-themes (the `desktop-themes` plugin). Versions follow [Semantic Versioning](https://semver.org/); the format follows [Keep a Changelog](https://keepachangelog.com/).

## [3.10.0] - 2026-11-19

### Changed
- Every theme is in one list and has a dark and a light look. The Dark and Light buttons show the same list in that look (no theme is missing from either), and still switch the theme you are on to its other look.
- A theme that has only one hand-made look gets the other made from it: the hues stay, the lightness is turned over, and the result goes through the same contrast checks and the same fix-up as every other palette. Twelve themes still have both looks by hand.
- `/claude-themes dracula light` and `dracula dark` work for every theme.

### Notes
- Made looks have no matching code-highlighting theme, so the app keeps its own for them. Your own themes (Maker, imports) are single-look and show only under their own button.

## [3.9.0] - 2026-11-19

### Changed
- Dark and light themes are combined: a theme that comes in both modes shows one name in the gallery (GitHub, Catppuccin, Solarized, Gruvbox, One, Rosé Pine, Tokyo Night, Ayu, Everforest, Night Owl, Nightfox, Kanagawa). The Dark and Light buttons show the themes that have that look and also switch the theme you are on to its other version. A theme with one look stays as it is.
- No gallery name says Light or Dark any more ("Oceanic Next Light" is "Oceanic Next"); your own themes keep their names. Pickers and notices use the same names, with ☾ or ☀ where both looks could be meant.
- `/claude-themes github` picks the version for the mode you are in; `github light` and `github dark` still name one. The count reads 41 themes instead of 53.

## [3.8.0] - 2026-11-19

### Added
- A better accent box in the Theme Maker: it reads hex (`#d98a4e`, `d98a4e`, `#abc`), `rgb()`, `hsl()`, three plain numbers and all CSS color names, shows a dot of the color, and says "Reads as #xxxxxx" or how to fix what was typed. Enter turns it into the plain hex.

### Changed
- The Theme Maker form is in a single column: Name, Base, Accent, then Save and apply.

## [3.7.1] - 2026-11-19

### Changed
- The Export card is now called Share and sits at the bottom of the Theme Maker tab. Settings holds Reset, Import, Theme for this folder and About, in that order.
- The Import and Share descriptions are the same size as the other card descriptions.
- Backdrop: the "Soft color behind the chat" line is drawn in the dimmer description color, and the Style and Strength labels in the normal color.
- "Save and apply" in the Theme Maker is a regular button, no longer the filled one that looked selected.

## [3.7.0] - 2026-11-19

### Changed
- Share moved from the Maker tab to the Settings tab and split in two: Import (small text, the box for a code, link, web address or file path, and the From VS Code list) and Export (small text, Copy link, Copy code, and one button each for VS Code, base16 and Windows Terminal). Messages from both show at the top of Settings.
- The title "Claude Themes" is at the top, then the animated color band, then the theme count.
- The note on each theme row is drawn in the smallest text size. Names, previews and dots are as before.
- Tuning: the range under each dial shows the low word on the left and the high word on the right, without the arrow.

### Removed
- The line "The backdrop is off while following the system..." from Day and night.

## [3.6.3] - 2026-11-19

### Changed
- The theme rows are back to their 3.6.0 size and text: the smaller previews, footnote and caption text and tighter padding of 3.6.1 and 3.6.2 are undone, since the buttons did not shrink.

## [3.6.2] - 2026-11-19

### Changed
- Even smaller theme rows: the preview is 72 by 36, the color dots and the note share one line, the gaps are tighter, and the preview at the top is 288 by 144.

## [3.6.1] - 2026-11-19

### Changed
- Smaller theme rows: the name and star are drawn in the footnote size, the note in caption size, the padding is tighter and the previews are smaller (96 by 48 and 70 by 14).

## [3.6.0] - 2026-11-19

### Removed
- Seven themes: GitHub Dark Dimmed, Gruvbox Dark Hard, Gruvbox Light Hard, Rosé Pine Moon, Everforest Hard, Everforest Light Hard and Kanagawa Wave (53 themes now). A saved choice of one of them falls back to the default.
- The name of the folder on the "Theme for this folder" card and in its notice.
- The Reset button of the readability options, and the Soft / Softer and Soft / Warm steps.

### Changed
- Tuning is redesigned: the dials are compact cards, two to a row, each with a small `−` and `+`, a step track and its range.
- Soften glare and Night comfort are plain On and Off switches. A saved Soft or Softer now means On.
- The backdrop switch reads "Soft color behind the chat. Drawn in the theme's colors." on one line in the normal text color.
- Day and night no longer explains what System does.

## [3.5.0] - 2026-11-19

### Removed
- Four themes: Catppuccin Macchiato, Catppuccin Frappé, Tokyo Night Storm and Winter is Coming Light (60 themes now). A saved choice of one of them falls back to the default.
- Alacritty and Kitty import and export; the formats are VS Code, base16, Windows Terminal and iTerm2 (import only).
- The Hue tuning dial (seven dials now). A saved Hue setting is ignored.
- The Color choice (accent or second color) in the Backdrop card; only Strength remains, and the backdrop always uses the accent.
- The readability options Color-blind safe status colors, Muted text and Accent visibility. Only Soften glare and Night comfort remain; saved values for the removed ones are ignored.
- The summary line under the tuning buttons.

### Changed
- The Backdrop card's switch reads "Soft color behind the chat" in plain text, with "Drawn in the theme's colors." under it.

## [3.4.0] - 2026-11-19

### Added
- Readability options on the Appearance tab: color-blind safe status colors (red-green, blue-yellow), soften glare, night comfort (with an "only at night" switch that follows the Day and night hours), muted text and accent visibility, with a button to reset them. They apply to every theme, are saved, and back off by themselves where the app would refuse the result. Shares and exports are not affected.

### Changed
- Types for the saved state include the new options.

## [3.3.1] - 2026-11-19

### Changed
- The Settings tab now holds the VS Code import, Theme for this folder, Reset and About. The Appearance tab keeps Tune, Backdrop, Readability and Day and night.
- The Appearance card is titled Backdrop, and its switch no longer repeats the word.

## [3.3.0] - 2026-11-19

### Added
- Import terminal color schemes: Windows Terminal (`.json`, or a settings file, first scheme), iTerm2 (`.itermcolors`), Alacritty (`.toml`) and Kitty (`.conf`). The import box detects the format by itself.
- Export the theme you are on as a VS Code theme, a base16 YAML scheme, a Windows Terminal scheme, an Alacritty file or a Kitty file. Five buttons in the Share card copy it to the clipboard; `/claude-themes export <vscode|base16|wt|alacritty|kitty>` prints it. Tuning is included.
- `~/` works at the start of an import path on Mac and Linux.
- GitHub Actions: tests and plugin validation on Ubuntu, macOS and Windows for every push and pull request; a release workflow that publishes a GitHub release from this file when a `v*` tag is pushed.
- `.gitattributes` so every system checks files out with the same line endings.
- This changelog, and a rewritten README.

### Changed
- Home folder lookup is one shared function (`USERPROFILE`, then `HOME`).

## [3.2.0] - 2026-11-18

### Added
- Appearance tab (backdrop, tuning, reset, readability, day and night, folder theme) and Theme Maker cards.

### Changed
- Settings holds only the VS Code import.
- Shorter Everforest notes.

### Removed
- Usage glow.

## [3.1.0] - 2026-11-18

### Added
- Four more tuning dials (hue, surface tint, accent, status colors), for eight in all.

### Changed
- 64 themes (ten dark ones removed, every light one kept).
- The VS Code theme list moved from the Maker to Settings.

### Removed
- Try/Keep/Back, family filter chips, folder rules and themed working words.

## [3.0.0] - 2026-11-18

### Added
- Import of VS Code color themes and base16/base24 schemes, with an automatic contrast fix.
- 35 new themes (Catppuccin, Nightfox, Kanagawa and more).
- Follow system, per-theme tuning, share links (page in `docs/t`) and Reset.

## [2.15.1] - 2026-11-18

### Removed
- Cloud, Deep, Prism and Mist backdrops, Corner glow and Split tone.

## [2.x] - 2026-11-18

The 2.x line grew the gallery from one theme to 39: tabs, search and favorites (2.5), the theme Maker (2.7), day and night switching, code color pairing and high contrast (2.8), backdrops (2.9 to 2.15), and the Settings and Maker card layouts (2.10, 2.11).

## [1.x]

First releases: a few themes and an Auto mode.
