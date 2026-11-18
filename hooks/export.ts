import { mix, slug } from './model.js'
import type { Theme } from './model.js'

// Writes a Theme out as another tool's theme file. Pure: returns text, touches nothing.

export type ExportFormat = 'vscode' | 'base16' | 'wt'

export const EXPORTS: { id: ExportFormat; label: string; ext: string }[] = [
  { id: 'vscode', label: 'VS Code', ext: 'json' },
  { id: 'base16', label: 'base16', ext: 'yaml' },
  { id: 'wt', label: 'Windows Terminal', ext: 'json' },
]

/** The file name a format would use for a theme, such as `dracula.json`. */
export const exportFileName = (t: Theme, f: ExportFormat): string =>
  `${slug(t.name)}.${EXPORTS.find(e => e.id === f)?.ext ?? 'txt'}`

const WHITE = '#ffffff'
const BLACK = '#000000'

/** The sixteen terminal colors, in ANSI order: black, red, green, yellow, blue, magenta, cyan, white, then the bright eight. */
export function ansi16(t: Theme): string[] {
  const dark = t.mode === 'dark'
  const [s0, , s2, s3] = t.surfaces
  const { danger, success, warning, pro } = t.roles
  const cyan = mix(t.accent, success, 0.5)
  const bright = (c: string): string => mix(c, dark ? WHITE : BLACK, 0.2)
  const normal = [dark ? s3 : t.text[0], danger, success, warning, t.accent, pro, cyan, dark ? t.text[1] : s0]

  return [
    ...normal,
    dark ? t.text[2] : t.text[1],
    ...normal.slice(1, 7).map(bright),
    dark ? t.text[0] : s2,
  ]
}

const noHash = (c: string): string => c.replace('#', '')

export function toVsCode(t: Theme): string {
  const [s0, s1, s2, s3] = t.surfaces
  const a = ansi16(t)
  const onAccent = mix(t.accent, t.mode === 'dark' ? BLACK : WHITE, 0.85)
  const colors: Record<string, string> = {
    'editor.background': s0,
    'editor.foreground': t.text[0],
    'sideBar.background': s1,
    'activityBar.background': s1,
    'panel.background': s1,
    'editorWidget.background': s2,
    'input.background': s2,
    'menu.background': s3,
    'dropdown.background': s3,
    foreground: t.text[0],
    descriptionForeground: t.text[1],
    disabledForeground: t.text[2],
    'editorLineNumber.foreground': t.text[2],
    focusBorder: t.accent,
    'button.background': t.accent,
    'button.foreground': onAccent,
    'textLink.foreground': t.accent,
    'activityBarBadge.background': t.accent,
    errorForeground: t.roles.danger,
    'editorError.foreground': t.roles.danger,
    'editorWarning.foreground': t.roles.warning,
    'gitDecoration.addedResourceForeground': t.roles.success,
    'terminal.background': s0,
    'terminal.foreground': t.text[0],
  }
  const names = ['Black', 'Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan', 'White']

  a.forEach((c, i) => {
    colors[`terminal.ansi${i < 8 ? '' : 'Bright'}${names[i % 8]}`] = c
  })
  const token = (name: string, scope: string[], foreground: string, fontStyle?: string) => ({
    name,
    scope,
    settings: fontStyle === undefined ? { foreground } : { foreground, fontStyle },
  })

  return `${JSON.stringify(
    {
      name: t.name,
      type: t.mode,
      colors,
      tokenColors: [
        token('Comment', ['comment'], t.text[2], 'italic'),
        token('Keyword', ['keyword', 'storage'], t.roles.pro),
        token('String', ['string'], t.roles.success),
        token('Number and constant', ['constant.numeric', 'constant.language'], t.roles.warning),
        token('Function', ['entity.name.function', 'support.function'], t.accent),
        token('Type', ['entity.name.type', 'support.type'], a[6]!),
        token('Invalid', ['invalid'], t.roles.danger),
      ],
    },
    null,
    2,
  )}\n`
}

/** base16 YAML. A light theme puts its lightest surface in base00, as the spec asks. */
export function toBase16(t: Theme): string {
  const dark = t.mode === 'dark'
  const [s0, s1, s2] = t.surfaces
  const edge = dark ? WHITE : BLACK
  const { danger, success, warning, pro } = t.roles
  const p = [
    dark ? s0 : s2,
    s1,
    dark ? s2 : s0,
    t.text[2],
    t.text[1],
    t.text[0],
    mix(t.text[0], edge, 0.3),
    mix(t.text[0], edge, 0.6),
    danger,
    mix(danger, warning, 0.5),
    warning,
    success,
    mix(t.accent, success, 0.5),
    t.accent,
    pro,
    mix(danger, t.text[2], 0.5),
  ]
  const lines = p.map((c, i) => `  base${i.toString(16).toUpperCase().padStart(2, '0')}: "${noHash(c)}"`)

  return [`system: "base16"`, `name: "${t.name}"`, `author: "claude-themes"`, `variant: "${t.mode}"`, 'palette:', ...lines, ''].join('\n')
}

export function toWindowsTerminal(t: Theme): string {
  const a = ansi16(t)
  const keys = [
    'black', 'red', 'green', 'yellow', 'blue', 'purple', 'cyan', 'white',
    'brightBlack', 'brightRed', 'brightGreen', 'brightYellow', 'brightBlue', 'brightPurple', 'brightCyan', 'brightWhite',
  ]
  const scheme: Record<string, string> = {
    name: t.name,
    background: t.surfaces[0],
    foreground: t.text[0],
    cursorColor: t.accent,
    selectionBackground: mix(t.surfaces[0], t.accent, 0.3),
  }

  keys.forEach((k, i) => {
    scheme[k] = a[i]!
  })

  return `${JSON.stringify(scheme, null, 2)}\n`
}

export function exportTheme(t: Theme, f: ExportFormat): string {
  switch (f) {
    case 'vscode':
      return toVsCode(t)
    case 'base16':
      return toBase16(t)
    case 'wt':
      return toWindowsTerminal(t)
  }
}

/** A format from what a person types: `vscode`, `vs code`, `windows terminal`, `wt`... Undefined when unknown. */
export function formatOf(word: string): ExportFormat | undefined {
  const w = word.toLowerCase().replace(/[^a-z0-9]/g, '')

  if (w === 'vscode' || w === 'code') {
    return 'vscode'
  }

  if (w === 'base16' || w === 'base24' || w === 'yaml') {
    return 'base16'
  }

  if (w === 'wt' || w === 'windowsterminal' || w === 'terminal') {
    return 'wt'
  }

  return undefined
}
