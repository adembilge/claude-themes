# Changelog

All notable changes to claude-themes (the `desktop-themes` plugin). Versions follow [Semantic Versioning](https://semver.org/); the format follows [Keep a Changelog](https://keepachangelog.com/).

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

First releases: a few themes and an Auto mode. Renamed from `claude-deskmod` to `desktop-themes` in 2.1.0.
