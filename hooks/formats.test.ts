import { expect, test } from 'claude-code/testing'

import type { Imported } from './import.js'
import { EXPORTS, ansi16, exportFileName, exportTheme, formatOf, toBase16 } from './export.js'
import type { ExportFormat } from './export.js'
import { contrast, validateTheme } from './model.js'
import type { Theme } from './model.js'
import { PACKS } from './packs.js'
import { anyHex, parseAlacritty, parseIterm, parseKitty, parseWindowsTerminal, readThemeFile } from './terminal.js'

function good(r: Imported | { error: string }): Imported {
  if ('error' in r) {
    throw new Error(`expected a theme, got the error: ${r.error}`)
  }
  expect(validateTheme(r.theme)).toBeNull()

  return r
}

// Small real-world schemes, written from the published palettes.
const WT_DRACULA = `{
  // Windows Terminal scheme
  "name": "Dracula",
  "background": "#282A36", "foreground": "#F8F8F2", "cursorColor": "#F8F8F2",
  "black": "#21222C", "red": "#FF5555", "green": "#50FA7B", "yellow": "#F1FA8C",
  "blue": "#BD93F9", "purple": "#FF79C6", "cyan": "#8BE9FD", "white": "#F8F8F2",
  "brightBlack": "#6272A4", "brightRed": "#FF6E6E", "brightGreen": "#69FF94", "brightYellow": "#FFFFA5",
  "brightBlue": "#D6ACFF", "brightPurple": "#FF92DF", "brightCyan": "#A4FFFF", "brightWhite": "#FFFFFF"
}`

const ALACRITTY_NORD = `# Nord
[colors.primary]
background = "#2e3440"
foreground = '#d8dee9'

[colors.normal]
black   = "#3b4252"
red     = "#bf616a"
green   = "#a3be8c"
yellow  = "#ebcb8b"
blue    = "#81a1c1"
magenta = "#b48ead"
cyan    = "#88c0d0"
white   = "#e5e9f0"

[colors.bright]
black   = "#4c566a"
red     = "#bf616a"
green   = "#a3be8c"
yellow  = "#ebcb8b"
blue    = "#81a1c1"
magenta = "#b48ead"
cyan    = "#8fbcbb"
white   = "#eceff4"
`

const KITTY_SOLARIZED_LIGHT = `# Solarized Light
foreground #657b83
background #fdf6e3
cursor #586e75
color0 #073642
color1 #dc322f
color2 #859900
color3 #b58900
color4 #268bd2
color5 #d33682
color6 #2aa198
color7 #eee8d5
color8 #002b36
color9 #cb4b16
color10 #586e75
color11 #657b83
color12 #839496
color13 #6c71c4
color14 #93a1a1
color15 #fdf6e3
`

function plistEntry(key: string, hex: string): string {
  const [r, g, b] = [1, 3, 5].map(i => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(6))

  return `<key>${key}</key><dict><key>Blue Component</key><real>${b}</real><key>Color Space</key><string>sRGB</string>
<key>Green Component</key><real>${g}</real><key>Red Component</key><real>${r}</real></dict>`
}

const ITERM_GRUVBOX = `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
${[
  ['Ansi 0 Color', '#282828'], ['Ansi 1 Color', '#cc241d'], ['Ansi 2 Color', '#98971a'], ['Ansi 3 Color', '#d79921'],
  ['Ansi 4 Color', '#458588'], ['Ansi 5 Color', '#b16286'], ['Ansi 6 Color', '#689d6a'], ['Ansi 7 Color', '#a89984'],
  ['Ansi 9 Color', '#fb4934'], ['Ansi 12 Color', '#83a598'],
  ['Background Color', '#282828'], ['Foreground Color', '#ebdbb2'],
]
  .map(([k, v]) => plistEntry(k!, v!))
  .join('\n')}
</dict></plist>`

test('anyHex reads the usual spellings', () => {
  expect(anyHex('#ABC')).toBe('#aabbcc')
  expect(anyHex('0x1E1E2E')).toBe('#1e1e2e')
  expect(anyHex("'ffffff'")).toBe('#ffffff')
  expect(anyHex('nope')).toBeUndefined()
  expect(anyHex(12)).toBeUndefined()
})

test('Windows Terminal scheme imports with JSON comments, by name', () => {
  const r = good(parseWindowsTerminal(WT_DRACULA))

  expect(r.theme.name).toBe('Dracula')
  expect(r.theme.mode).toBe('dark')
  expect(r.theme.note).toBe('imported from Windows Terminal')
  expect(r.theme.roles.danger).toBe('#ff5555')
})

test('a Windows Terminal settings file reads its first scheme', () => {
  const r = good(parseWindowsTerminal(`{ "schemes": [${WT_DRACULA}] }`))

  expect(r.theme.name).toBe('Dracula')
})

test('Alacritty TOML imports with both quote styles', () => {
  const r = good(parseAlacritty(ALACRITTY_NORD, 'nord'))

  expect(r.theme.name).toBe('nord')
  expect(r.theme.mode).toBe('dark')
  expect(r.theme.roles.success).toBe('#a3be8c')
})

test('Kitty conf imports a light scheme', () => {
  const r = good(parseKitty(KITTY_SOLARIZED_LIGHT, 'solarized light'))

  expect(r.theme.mode).toBe('light')
  expect(r.theme.surfaces[2]).toBe(r.theme.surfaces[3])
})

test('iTerm2 plist imports, with missing ANSI slots filled in', () => {
  const r = good(parseIterm(ITERM_GRUVBOX, 'gruvbox'))

  expect(r.theme.mode).toBe('dark')
  expect(r.theme.name).toBe('gruvbox')
  expect(contrast(r.theme.roles.danger, '#cc241d')).toBeLessThan(1.5)
})

test('readThemeFile picks the right reader for each format', () => {
  expect(good(readThemeFile(WT_DRACULA, 'C:\\x\\dracula.json')).theme.note).toContain('Windows Terminal')
  expect(good(readThemeFile(ALACRITTY_NORD, '/home/me/nord.toml')).theme.note).toContain('Alacritty')
  expect(good(readThemeFile(KITTY_SOLARIZED_LIGHT, 'sol.conf')).theme.note).toContain('Kitty')
  expect(good(readThemeFile(ITERM_GRUVBOX, 'g.itermcolors')).theme.note).toContain('iTerm2')
  expect(good(readThemeFile('base00: "1e1e2e"\nbase01: "313244"\nbase02: "45475a"\nbase03: "585b70"\nbase04: "a6adc8"\nbase05: "cdd6f4"\nbase06: "f5e0dc"\nbase07: "b4befe"\nbase08: "f38ba8"\nbase0B: "a6e3a1"\nbase0A: "f9e2af"\nbase0D: "89b4fa"\nbase0E: "cba6f7"', 'm.yaml')).theme.note).toContain('base16')
  expect(good(readThemeFile('{"colors":{"editor.background":"#101010","editor.foreground":"#eeeeee"},"type":"dark"}', 'v.json')).theme.note).toContain('VS Code')
})

test('bad input gives a plain error, never a throw', () => {
  for (const text of ['', 'hello', '{', '[]', '<plist></plist>', '[colors.primary]\nbackground = "nope"', 'foreground red']) {
    const r = readThemeFile(text, 'x.txt')

    expect('error' in r).toBe(true)
  }
  expect('error' in parseWindowsTerminal('{"background":"#000000"}')).toBe(true)
})

// ---- export ----

const SAMPLE: Theme[] = [PACKS.find(p => p.mode === 'dark')!, PACKS.find(p => p.mode === 'light')!]

test('every theme exports every format without throwing', () => {
  for (const t of PACKS) {
    for (const f of EXPORTS) {
      expect(exportTheme(t, f.id).length).toBeGreaterThan(40)
    }
  }
})

test('the 16 terminal colors are valid hex and the bright ones differ from the normal ones', () => {
  for (const t of PACKS) {
    const a = ansi16(t)

    expect(a).toHaveLength(16)
    expect(a.every(c => /^#[0-9a-f]{6}$/.test(c))).toBe(true)
    expect(a[9]).not.toBe(a[1])
  }
})

test('JSON exports are valid JSON and name the theme', () => {
  for (const t of SAMPLE) {
    const vs = JSON.parse(exportTheme(t, 'vscode'))
    const wt = JSON.parse(exportTheme(t, 'wt'))

    expect(vs.name).toBe(t.name)
    expect(vs.type).toBe(t.mode)
    expect(vs.colors['editor.background']).toBe(t.surfaces[0])
    expect(wt.background).toBe(t.surfaces[0])
    expect(wt.name).toBe(t.name)
  }
})

test('text exports hold the right keys', () => {
  const t = SAMPLE[0]!

  expect(exportTheme(t, 'alacritty')).toContain('[colors.primary]')
  expect(exportTheme(t, 'alacritty')).toContain(`background = "${t.surfaces[0]}"`)
  expect(exportTheme(t, 'kitty')).toContain(`background ${t.surfaces[0]}`)
  expect(toBase16(t)).toContain('base0D:')
  expect(toBase16(t)).toContain(`variant: "${t.mode}"`)
})

// Export then import again: the result must be a palette the app accepts, with the same mode and an accent close to the original.
// One test per format keeps each well inside the test time limit on a slow machine.
const FILE: Record<ExportFormat, string> = { vscode: 'a.json', base16: 'a.yaml', wt: 'a.json', alacritty: 'a.toml', kitty: 'a.conf' }

for (const f of EXPORTS) {
  test(`exporting as ${f.label} and importing again keeps the mode and accent`, () => {
    for (const t of PACKS) {
      const got = good(readThemeFile(exportTheme(t, f.id), FILE[f.id])).theme

      expect(got.mode, `${t.name} via ${f.label}`).toBe(t.mode)
      // Colors only move when the app's contrast rules force it, so they stay close.
      expect(contrast(got.accent, t.accent), `${t.name} accent via ${f.label}`).toBeLessThan(2.2)
    }
  })
}

test('formatOf understands what people type', () => {
  expect(formatOf('VS Code')).toBe('vscode')
  expect(formatOf('windows-terminal')).toBe('wt')
  expect(formatOf('Alacritty')).toBe('alacritty')
  expect(formatOf('kitty')).toBe('kitty')
  expect(formatOf('base24')).toBe('base16')
  expect(formatOf('word')).toBeUndefined()
})

test('export file names are safe on every system', () => {
  expect(exportFileName(SAMPLE[0]!, 'vscode')).toMatch(/^[a-z0-9-]+\.json$/)
  expect(exportFileName(SAMPLE[0]!, 'alacritty')).toMatch(/\.toml$/)
})
