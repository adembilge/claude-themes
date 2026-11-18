import { expect, test } from 'claude-code/testing'

import { listVsCodeThemes, parseBase16, parseThemeFile, parseVsCode, stripJsonc, vsCodeExtensionRoots } from './import.js'
import type { Imported } from './import.js'
import { lum, validateTheme } from './model.js'

// A successful import, checked: it must always be a palette the app accepts.
function good(r: Imported | { error: string }): Imported {
  if ('error' in r) {
    throw new Error(`expected a theme, got the error: ${r.error}`)
  }
  expect(validateTheme(r.theme)).toBeNull()
  expect(r.theme.surfaces).toHaveLength(4)
  expect(r.theme.text).toHaveLength(3)

  return r
}

function bad(r: Imported | { error: string }): string {
  if (!('error' in r)) {
    throw new Error(`expected an error, got the theme ${r.theme.name}`)
  }

  return r.error
}

// Dracula Official, the colors that matter (written from memory), with comments and a trailing comma.
const DRACULA = `{
  // Dracula Official
  "name": "Dracula",
  "type": "dark",
  "colors": {
    "editor.background": "#282a36",
    "editor.foreground": "#f8f8f2",
    "sideBar.background": "#21222c",
    "activityBar.background": "#343746",
    "focusBorder": "#6272a4",
    "button.background": "#44475a",
    "errorForeground": "#ff5555",
    "terminal.ansiGreen": "#50fa7b",
    "terminal.ansiYellow": "#f1fa8c",
    "terminal.ansiMagenta": "#ff79c6", /* trailing comma next */
  },
  "tokenColors": [],
}`

const GITHUB_LIGHT = `{
  "name": "GitHub Light",
  "type": "light",
  "colors": {
    "editor.background": "#ffffff",
    "editor.foreground": "#1f2328",
    "sideBar.background": "#f6f8fa",
    "activityBar.background": "#ffffff",
    "editorWidget.background": "#ffffff",
    "descriptionForeground": "#59636e",
    "focusBorder": "#0969da",
    "errorForeground": "#cf222e",
    "terminal.ansiGreen": "#116329",
    "terminal.ansiYellow": "#4d2d00",
    "terminal.ansiMagenta": "#8250df"
  }
}`

const TOMORROW_NEW = `# Tomorrow Night
system: "base16"
name: "Tomorrow Night"
author: "Chris Kempson"
variant: "dark"
palette:
  base00: "1d1f21"
  base01: "282a2e"
  base02: "373b41"
  base03: "969896"
  base04: "b4b7b4"
  base05: "c5c8c6"
  base06: "e0e0e0"
  base07: "ffffff"
  base08: "cc6666"
  base09: "de935f"
  base0A: "f0c674"
  base0B: "b5bd68"
  base0C: "8abeb7"
  base0D: "81a2be"
  base0E: "b294bb"
  base0F: "a3685a"
`

const SOLARIZED_OLD = `scheme: "Solarized Light"
author: "Ethan Schoonover"
base00: "fdf6e3" # "Default Background"
base01: "eee8d5"
base02: "93a1a1"
base03: "839496"
base04: "657b83"
base05: "586e75"
base06: "073642"
base07: "002b36"
base08: "dc322f"
base09: "cb4b16"
base0A: "b58900"
base0B: "859900"
base0C: "2aa198"
base0D: "268bd2"
base0E: "6c71c4"
base0F: "d33682"
`

const BASE24 = `system: "base24"
name: "Catppuccin Mocha 24"
author: "someone"
variant: "dark"
palette:
  base00: "#1e1e2e"
  base01: "#313244"
  base02: "#45475a"
  base03: "#585b70"
  base04: "#a6adc8"
  base05: "#cdd6f4"
  base06: "#f5e0dc"
  base07: "#b4befe"
  base08: "#f38ba8"
  base09: "#fab387"
  base0A: "#f9e2af"
  base0B: "#a6e3a1"
  base0C: "#94e2d5"
  base0D: "#89b4fa"
  base0E: "#cba6f7"
  base0F: "#f2cdcd"
  base10: "#181825"
  base11: "#11111b"
  base12: "#eba0ac"
  base13: "#f9e2af"
  base14: "#a6e3a1"
  base15: "#94e2d5"
  base16: "#89b4fa"
  base17: "#cba6f7"
`

const BASE16_JSON = JSON.stringify({
  scheme: 'Ocean Json',
  base00: '2b303b',
  base01: '343d46',
  base02: '4f5b66',
  base03: '65737e',
  base04: 'a7adba',
  base05: 'c0c5ce',
  base06: 'dfe1e8',
  base07: 'eff1f5',
  base08: 'bf616a',
  base09: 'd08770',
  base0A: 'ebcb8b',
  base0B: 'a3be8c',
  base0C: '96b5b4',
  base0D: '8fa1b3',
  base0E: 'b48ead',
  base0F: 'ab7967',
})

test('JSONC comments and trailing commas are removed without touching strings', () => {
  const plain = stripJsonc('{ "a": "http://x // not a comment", /* c */ "b": [1, 2,], // end\n "c": "/* keep */", }')

  expect(JSON.parse(plain)).toEqual({ a: 'http://x // not a comment', b: [1, 2], c: '/* keep */' })
})

test('a Dracula-like VS Code theme is read, comments and trailing commas included', () => {
  const { theme, notes } = good(parseVsCode(DRACULA))

  expect(theme.name).toBe('Dracula')
  expect(theme.id).toBe('my-dracula')
  expect(theme.mode).toBe('dark')
  expect(theme.note).toBe('imported from VS Code')
  expect(theme.surfaces[0]).toBe('#21222c')
  expect(theme.surfaces).toContain('#282a36')
  expect(theme.text[0]).toBe('#f8f8f2')
  expect(theme.roles.danger).toBe('#ff5555')
  expect(theme.roles.success).toBe('#50fa7b')
  expect(theme.roles.warning).toBe('#f1fa8c')
  expect(theme.roles.pro).toBe('#ff79c6')
  expect(Array.isArray(notes)).toBe(true)
})

test('a light VS Code theme keeps the page darkest and the last two surfaces equal', () => {
  const { theme } = good(parseVsCode(GITHUB_LIGHT))

  expect(theme.mode).toBe('light')
  expect(lum(theme.surfaces[0])).toBeLessThan(lum(theme.surfaces[1]))
  expect(lum(theme.surfaces[1])).toBeLessThan(lum(theme.surfaces[2]))
  expect(theme.surfaces[2]).toBe(theme.surfaces[3])
  expect(theme.accent).toBe('#0969da')
})

test('short hex and alpha colors are normalised over the editor background', () => {
  const { theme } = good(
    parseVsCode(
      JSON.stringify({
        name: 'Alpha',
        type: 'dark',
        colors: {
          'editor.background': '#000',
          'editor.foreground': '#ffffffff',
          descriptionForeground: '#ffffff80',
          focusBorder: '#ff000080',
          'sideBar.background': '#ffffff10',
        },
      }),
    ),
  )

  // #ffffff at 50% over black is mid grey (fixTheme may only lighten it); #ff0000 at 50% is #800000, then lifted.
  expect(lum(theme.text[1])).toBeGreaterThanOrEqual(lum('#808080'))
  expect(theme.surfaces[0]).toBe('#000000')
  expect(theme.surfaces[1]).toBe('#101010')
  expect(theme.accent).toMatch(/^#[0-9a-f]{6}$/)
})

test('the mode comes from the uiTheme hint when the file does not say, and the label names it', () => {
  const dark = JSON.stringify({ colors: { 'editor.background': '#1a1a1a', 'editor.foreground': '#eeeeee' } })
  const light = JSON.stringify({ colors: { 'editor.background': '#fafafa', 'editor.foreground': '#222222' } })
  const asDark = good(parseVsCode(dark, { label: 'Odd Pair', uiTheme: 'vs-dark' }))
  const asLight = good(parseVsCode(light, { uiTheme: 'vs' }))

  expect(asDark.theme.mode).toBe('dark')
  expect(asDark.theme.name).toBe('Odd Pair')
  expect(asLight.theme.mode).toBe('light')
  expect(asLight.theme.name).toBe('Imported')
})

test('a VS Code theme with almost no colors still imports, with sensible defaults', () => {
  const { theme } = good(parseVsCode('{ "colors": { "editor.background": "#1b1b1b" } }'))

  expect(theme.mode).toBe('dark')
  expect(theme.name).toBe('Imported')
})

test('base16 in the new tinted-theming schema', () => {
  const { theme } = good(parseBase16(TOMORROW_NEW))

  expect(theme.name).toBe('Tomorrow Night')
  expect(theme.id).toBe('my-tomorrow-night')
  expect(theme.mode).toBe('dark')
  expect(theme.note).toBe('imported base16')
  expect(theme.surfaces[0]).toBe('#1d1f21')
  expect(theme.surfaces[1]).toBe('#282a2e')
  expect(theme.surfaces[2]).toBe('#373b41')
  expect(lum(theme.text[0])).toBeGreaterThanOrEqual(lum('#c5c8c6'))
  expect(theme.accent).toBe('#81a2be')
  expect(theme.roles.danger).toBe('#cc6666')
  expect(theme.roles.success).toBe('#b5bd68')
  expect(theme.roles.warning).toBe('#f0c674')
  expect(theme.roles.pro).toBe('#b294bb')
})

test('base16 in the old flat schema, light, with trailing comments', () => {
  const { theme } = good(parseBase16(SOLARIZED_OLD))

  expect(theme.name).toBe('Solarized Light')
  expect(theme.mode).toBe('light')
  expect(theme.surfaces[2]).toBe('#fdf6e3')
  expect(theme.surfaces[3]).toBe('#fdf6e3')
})

test('base24 uses the darker backgrounds when they are in order', () => {
  const { theme } = good(parseBase16(BASE24))

  expect(theme.note).toBe('imported base24')
  expect(theme.mode).toBe('dark')
  expect(theme.surfaces[0]).toBe('#11111b')
  expect(theme.surfaces[1]).toBe('#181825')
  expect(theme.surfaces[2]).toBe('#1e1e2e')
})

test('base16 from JSON, with and without the palette wrapper', () => {
  const flat = good(parseBase16(BASE16_JSON))
  const wrapped = good(
    parseBase16(JSON.stringify({ name: 'Wrapped', palette: JSON.parse(BASE16_JSON) as Record<string, string> })),
  )

  expect(flat.theme.name).toBe('Ocean Json')
  expect(wrapped.theme.name).toBe('Wrapped')
  expect(wrapped.theme.surfaces).toEqual(flat.theme.surfaces)
})

test('parseThemeFile tells the formats apart', () => {
  expect(good(parseThemeFile(DRACULA, 'dracula.json')).theme.note).toBe('imported from VS Code')
  expect(good(parseThemeFile(TOMORROW_NEW, 'tomorrow-night.yaml')).theme.note).toBe('imported base16')
  expect(good(parseThemeFile(SOLARIZED_OLD)).theme.note).toBe('imported base16')
  expect(good(parseThemeFile(BASE16_JSON)).theme.note).toBe('imported base16')
  expect(good(parseThemeFile(BASE24)).theme.note).toBe('imported base24')
  expect(good(parseThemeFile(`\uFEFF${GITHUB_LIGHT}`)).theme.mode).toBe('light')
})

test('errors are plain: not a theme, empty, broken JSON, include-only, bad hex, missing slots', () => {
  expect(bad(parseThemeFile('hello world'))).toMatch(/not a theme/)
  expect(bad(parseThemeFile('   '))).toMatch(/empty/)
  expect(bad(parseThemeFile('{ "name": "x" }'))).toMatch(/not a theme/)
  expect(bad(parseThemeFile('{ "colors": '))).toMatch(/JSON/)
  expect(bad(parseVsCode('[1, 2]'))).toMatch(/not a readable/)
  expect(bad(parseVsCode('{ "tokenColors": [] }'))).toMatch(/no editor colors/)

  const includeOnly = '{ "include": "./dracula.json", "name": "Soft", "colors": { "editor.background": "#303240" } }'

  expect(bad(parseVsCode(includeOnly))).toMatch(/include/)
  expect(bad(parseThemeFile(includeOnly))).toMatch(/include/)

  expect(bad(parseBase16(TOMORROW_NEW.replace('"1d1f21"', '"zzzzzz"')))).toMatch(/base00 is not a color/)
  expect(bad(parseBase16(TOMORROW_NEW.replace('base05: "c5c8c6"', '')))).toMatch(/no base05/)
  expect(bad(parseBase16('{ "base00": "12345" }'))).toMatch(/base00 is not a color/)
})

test('theme lists and extension folders', () => {
  const pkg = JSON.stringify({
    contributes: {
      themes: [
        { label: 'Night', uiTheme: 'vs-dark', path: './themes/night.json' },
        { label: 'Day', uiTheme: 'vs', path: './themes/day.json' },
        { label: 'Contrast', uiTheme: 'hc-black', path: './themes/hc.json' },
        { label: 'No path', uiTheme: 'vs' },
        { label: 'Bad path', uiTheme: 'vs', path: 7 },
      ],
    },
  })

  expect(listVsCodeThemes(pkg)).toEqual([
    { label: 'Night', uiTheme: 'vs-dark', path: './themes/night.json' },
    { label: 'Day', uiTheme: 'vs', path: './themes/day.json' },
  ])
  expect(listVsCodeThemes('not json')).toEqual([])
  expect(listVsCodeThemes('{}')).toEqual([])

  const roots = vsCodeExtensionRoots('C:\\Users\\Ada', 'C:\\Users\\Ada\\AppData\\Roaming')

  expect(roots).toHaveLength(6)
  expect(roots[0]).toBe('C:/Users/Ada/.vscode/extensions')
  expect(roots).toContain('C:/Users/Ada/.cursor/extensions')
})

test('differently shaped files always give a palette the app accepts', () => {
  const fixtures: string[] = [
    DRACULA,
    GITHUB_LIGHT,
    TOMORROW_NEW,
    SOLARIZED_OLD,
    BASE24,
    BASE16_JSON,
    // A theme that only gives a page and text: everything else is derived.
    '{ "colors": { "editor.background": "#101820", "editor.foreground": "#e8e8e8" } }',
    // A light theme with a grey page and white widgets, and a wash of faint text.
    '{ "type": "light", "colors": { "editor.background": "#e6e6e6", "editor.foreground": "#bbbbbb", "sideBar.background": "#e6e6e6", "menu.background": "#ffffff" } }',
    // Pure black and pure white extremes.
    '{ "type": "dark", "colors": { "editor.background": "#000000", "editor.foreground": "#ffffff", "focusBorder": "#000000" } }',
    '{ "type": "light", "colors": { "editor.background": "#ffffff", "editor.foreground": "#000000", "focusBorder": "#ffffff" } }',
    // Every surface the same colour.
    '{ "colors": { "editor.background": "#222222", "sideBar.background": "#222222", "editorWidget.background": "#222222", "editor.foreground": "#dddddd" } }',
    // A dark scheme whose muted text is nearly the background.
    TOMORROW_NEW.replace('base03: "969896"', 'base03: "1e2022"'),
  ]

  expect(fixtures.length).toBeGreaterThanOrEqual(6)

  for (const f of fixtures) {
    const r = good(parseThemeFile(f))

    expect(r.theme.id.startsWith('my-')).toBe(true)
    expect(r.theme.name.length).toBeGreaterThan(0)
  }
})
