import { cleanName, contrast, fixTheme, lum, mix, slug, validateTheme } from './model.js'
import type { Mode, Roles, Surfaces, Text3, Theme } from './model.js'

// Reads other people's colour themes (VS Code, base16, base24) into a Theme. Pure: no `$`, no files.

export type Imported = { theme: Theme; notes: string[] }
type Failed = { error: string }

const NOT_A_THEME =
  'That is not a theme file I know. Use a VS Code theme (.json), a base16 or base24 scheme (.yaml or .json), or a terminal scheme: Windows Terminal (.json) or iTerm2 (.itermcolors).'

// ---- reading text ----

/** JSON with comments and trailing commas made plain. Strings are copied untouched. */
export function stripJsonc(text: string): string {
  const src = text.replace(/^﻿/, '')
  let plain = ''
  let i = 0

  while (i < src.length) {
    const c = src[i]!

    if (c === '"') {
      let j = i + 1

      while (j < src.length && src[j] !== '"') {
        j += src[j] === '\\' ? 2 : 1
      }
      plain += src.slice(i, j + 1)
      i = j + 1
    } else if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') {
        i++
      }
    } else if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2)

      plain += ' '
      i = end === -1 ? src.length : end + 2
    } else {
      plain += c
      i++
    }
  }

  return dropTrailingCommas(plain)
}

function dropTrailingCommas(src: string): string {
  let out = ''
  let i = 0

  while (i < src.length) {
    const c = src[i]!

    if (c === '"') {
      let j = i + 1

      while (j < src.length && src[j] !== '"') {
        j += src[j] === '\\' ? 2 : 1
      }
      out += src.slice(i, j + 1)
      i = j + 1
    } else if (c === ',') {
      let j = i + 1

      while (j < src.length && /\s/.test(src[j]!)) {
        j++
      }

      if (src[j] !== '}' && src[j] !== ']') {
        out += c
      }
      i++
    } else {
      out += c
      i++
    }
  }

  return out
}

export function readJson(text: string): unknown {
  try {
    return JSON.parse(stripJsonc(text))
  } catch {
    return undefined
  }
}

export const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

// ---- colours ----

/** A six-digit hex with its opacity (0 to 1), from #rgb, #rgba, #rrggbb or #rrggbbaa. Null for anything else. */
function readColor(v: unknown): { hex: string; alpha: number } | null {
  if (typeof v !== 'string') {
    return null
  }
  const m = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(v.trim())

  if (m === null) {
    return null
  }
  let digits = m[1]!.toLowerCase()

  if (digits.length <= 4) {
    digits = [...digits].map(d => d + d).join('')
  }
  const alpha = digits.length === 8 ? parseInt(digits.slice(6), 16) / 255 : 1

  return { hex: `#${digits.slice(0, 6)}`, alpha }
}

/** A colour moved a little toward the text colour, or toward white or black when that points the wrong way. */
function nudge(mode: Mode, from: string, fg: string, t: number): string {
  const wrongWay = mode === 'dark' ? lum(fg) <= lum(from) : lum(fg) >= lum(from)

  return mix(from, wrongWay ? (mode === 'dark' ? '#ffffff' : '#000000') : fg, t)
}

/**
 * Four surfaces from whatever backgrounds a theme has. Dark ones run darkest to lightest. Light ones run
 * from the darkest up to the lightest, which is used twice (the app wants the last two equal there).
 * Backgrounds that are the same colour count once; missing steps are made by mixing.
 */
export function arrangeSurfaces(mode: Mode, candidates: string[], fg: string): Surfaces {
  const sorted = [...new Set(candidates.map(c => c.toLowerCase()))].sort((a, b) => lum(a) - lum(b))
  const apart: string[] = []

  for (const c of sorted) {
    if (apart.every(a => contrast(a, c) >= 1.03)) {
      apart.push(c)
    }
  }

  if (mode === 'dark') {
    const s = apart.slice(0, 4)

    while (s.length < 4) {
      s.push(nudge(mode, s[s.length - 1]!, fg, 0.06))
    }

    return s as Surfaces
  }
  const top = apart[apart.length - 1]!
  const lower = apart.slice(0, -1).reverse()
  const s1 = lower[0] ?? nudge(mode, top, fg, 0.05)
  const s0 = lower[1] ?? nudge(mode, s1, fg, 0.05)

  return [s0, s1, top, top]
}

export const FALLBACK = {
  dark: { fg: '#d4d4d4', bg: '#1e1e1e', accent: '#61afef', roles: ['#f87171', '#4ade80', '#fbbf24', '#c084fc'] },
  light: { fg: '#333333', bg: '#ffffff', accent: '#0066cc', roles: ['#c62828', '#2e7d32', '#b26a00', '#7b1fa2'] },
} as const

/** Runs the shared last steps: name, fix, check. */
export function finish(
  name: string,
  note: string,
  mode: Mode,
  surfaces: Surfaces,
  text: Text3,
  accent: string,
  roles: Roles,
): Imported | Failed {
  const clean = cleanName(name) || 'Imported'
  const { theme, notes } = fixTheme({ id: `my-${slug(clean)}`, name: clean, note, mode, surfaces, text, accent, roles })
  const problem = validateTheme(theme)

  return problem === null ? { theme, notes } : { error: problem }
}

// ---- VS Code ----

function vsMode(type: unknown, uiTheme: string | undefined): Mode | undefined {
  const t = typeof type === 'string' ? type.toLowerCase() : ''

  if (t === 'dark' || t === 'hc' || t === 'hc-black') {
    return 'dark'
  }

  if (t === 'light' || t === 'hclight' || t === 'hc-light') {
    return 'light'
  }

  if (uiTheme === 'vs-dark' || uiTheme === 'hc-black') {
    return 'dark'
  }

  if (uiTheme === 'vs' || uiTheme === 'hc-light') {
    return 'light'
  }

  return undefined
}

export function parseVsCode(text: string, hint?: { label?: string; uiTheme?: string }): Imported | Failed {
  const data = readJson(text)

  if (!isObject(data)) {
    return { error: 'That file is not a readable VS Code theme (it is not a JSON object).' }
  }
  const raw = isObject(data.colors) ? data.colors : {}
  const have = Object.keys(raw).filter(k => readColor(raw[k]) !== null).length

  if (typeof data.include === 'string' && have < 6) {
    return {
      error: `This theme builds on another file ("include": ${JSON.stringify(data.include)}) and holds too few colors by itself. Import the theme it includes, or a theme that lists its own colors.`,
    }
  }

  if (readColor(raw['editor.background']) === null && readColor(raw['editor.foreground']) === null) {
    return { error: 'That VS Code theme has no editor colors (no "colors" with editor.background or editor.foreground).' }
  }

  const base = readColor(raw['editor.background'])
  const lookMode: Mode = vsMode(data.type, hint?.uiTheme) ?? (base !== null && lum(base.hex) > 0.18 ? 'light' : 'dark')
  const fb = FALLBACK[lookMode]
  const bg = base === null ? fb.bg : base.alpha < 1 ? mix(fb.bg, base.hex, base.alpha) : base.hex

  // A color from the first key that holds a usable one, laid over the editor background.
  const get = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const c = readColor(raw[k])

      if (c !== null && c.alpha >= 0.05) {
        return c.alpha < 1 ? mix(bg, c.hex, c.alpha) : c.hex
      }
    }

    return undefined
  }

  const fg = get('editor.foreground', 'foreground') ?? fb.fg
  const surfaces = arrangeSurfaces(
    lookMode,
    [
      bg,
      get('sideBar.background', 'activityBar.background') ?? bg,
      get('editorWidget.background', 'input.background', 'panel.background') ?? bg,
      get('menu.background', 'dropdown.background', 'editorWidget.background', 'input.background', 'panel.background') ?? bg,
    ],
    fg,
  )
  const page = surfaces[0]
  // Colors that would vanish into the page are skipped.
  const vivid = (fallback: string, ...keys: string[]): string => {
    for (const k of keys) {
      const c = get(k)

      if (c !== undefined && contrast(c, page) >= 1.3) {
        return c
      }
    }

    return fallback
  }

  const text3: Text3 = [
    fg,
    get('descriptionForeground') ?? mix(fg, page, 0.25),
    get('disabledForeground', 'editorLineNumber.foreground') ?? mix(fg, page, 0.5),
  ]
  const accent = vivid(
    fb.accent,
    'focusBorder',
    'button.background',
    'textLink.foreground',
    'activityBarBadge.background',
  )
  const roles: Roles = {
    danger: vivid(fb.roles[0], 'errorForeground', 'terminal.ansiRed', 'editorError.foreground'),
    success: vivid(fb.roles[1], 'terminal.ansiGreen', 'gitDecoration.addedResourceForeground'),
    warning: vivid(fb.roles[2], 'editorWarning.foreground', 'terminal.ansiYellow'),
    pro: vivid(fb.roles[3], 'terminal.ansiMagenta', 'symbolIcon.classForeground'),
  }
  const name = typeof data.name === 'string' && cleanName(data.name) !== '' ? data.name : (hint?.label ?? '')

  return finish(name, 'imported from VS Code', lookMode, surfaces, text3, accent, roles)
}

// ---- base16 and base24 ----

/** `key: value` lines of a small YAML file, keys in lower case. Nesting is ignored; the first of a key wins. */
function readYamlPairs(text: string): Record<string, string> {
  const out: Record<string, string> = {}

  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    const m = /^\s*(?:-\s+)?([A-Za-z0-9_.-]+)\s*:(.*)$/.exec(line)

    if (m === null) {
      continue
    }
    const key = m[1]!.toLowerCase()

    if (!(key in out)) {
      out[key] = yamlValue(m[2]!.trim())
    }
  }

  return out
}

function yamlValue(v: string): string {
  const quote = v[0]

  if (quote === '"' || quote === "'") {
    const end = v.indexOf(quote, 1)

    return end === -1 ? v.slice(1) : v.slice(1, end)
  }

  if (v.startsWith('#')) {
    return v.split(/\s/)[0]!
  }

  return v.replace(/\s+#.*$/, '').trim()
}

/** The text values of a JSON scheme: the top level plus an optional `palette` object. Keys in lower case. */
function readJsonPairs(data: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  const add = (o: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string' && !(k.toLowerCase() in out)) {
        out[k.toLowerCase()] = v
      }
    }
  }

  add(data)

  if (isObject(data.palette)) {
    add(data.palette)
  }

  return out
}

function baseHex(v: string | undefined): string | null {
  const s = (v ?? '').trim().replace(/^#/, '')

  if (/^[0-9a-f]{3}$/i.test(s)) {
    return `#${[...s].map(d => d + d).join('').toLowerCase()}`
  }

  return /^[0-9a-f]{6}$/i.test(s) ? `#${s.toLowerCase()}` : null
}

export function parseBase16(text: string): Imported | Failed {
  const trimmed = text.replace(/^﻿/, '').trim()
  let pairs: Record<string, string>

  if (trimmed.startsWith('{')) {
    const data = readJson(trimmed)

    if (!isObject(data)) {
      return { error: 'That file is not readable JSON.' }
    }
    pairs = readJsonPairs(data)
  } else {
    pairs = readYamlPairs(trimmed)
  }

  const colors: Record<string, string> = {}

  for (const [key, value] of Object.entries(pairs)) {
    if (!/^base(0[0-9a-f]|1[0-7])$/.test(key)) {
      continue
    }
    const hex = baseHex(value)

    if (hex === null) {
      return { error: `${key} is not a color: "${value}". Colors are six hex digits such as 1e1e2e.` }
    }
    colors[key] = hex
  }

  for (let i = 0; i < 8; i++) {
    const key = `base0${i}`

    if (colors[key] === undefined) {
      return { error: `The scheme has no ${key}, so it is not a complete base16 palette.` }
    }
  }

  const c = (key: string): string => colors[key]!
  const mode: Mode = lum(c('base00')) > 0.18 ? 'light' : 'dark'
  const fb = FALLBACK[mode]
  const is24 = (pairs.system ?? '').toLowerCase() === 'base24' || (colors.base10 !== undefined && colors.base11 !== undefined && colors.base12 !== undefined)
  const proper =
    is24 &&
    colors.base10 !== undefined &&
    colors.base11 !== undefined &&
    lum(c('base11')) < lum(c('base10')) &&
    lum(c('base10')) < lum(c('base00'))
  const candidates = proper
    ? [c('base11'), c('base10'), c('base00'), c('base01')]
    : [c('base00'), c('base01'), c('base02'), mix(c('base02'), c('base03'), 0.3)]
  const surfaces = arrangeSurfaces(mode, candidates, c('base05'))
  const pick = (key: string, fallback: string): string => colors[key] ?? fallback
  const roles: Roles = {
    danger: pick('base08', fb.roles[0]),
    success: pick('base0b', fb.roles[1]),
    warning: pick('base0a', fb.roles[2]),
    pro: pick('base0e', fb.roles[3]),
  }
  const accent = colors.base0d ?? colors.base0e ?? fb.accent
  const name = pairs.name ?? pairs.scheme ?? ''

  return finish(
    name,
    is24 ? 'imported base24' : 'imported base16',
    mode,
    surfaces,
    [c('base05'), c('base04'), c('base03')],
    accent,
    roles,
  )
}

// ---- any file ----

export function stemOf(fileName: string | undefined): string {
  const leaf = (fileName ?? '').split(/[\\/]/).pop() ?? ''

  return leaf.replace(/\.(jsonc?|ya?ml|itermcolors)$/i, '').replace(/[-_.]+/g, ' ').trim()
}

export function parseThemeFile(text: string, fileName?: string): Imported | Failed {
  const body = text.replace(/^﻿/, '').trim()

  if (body === '') {
    return { error: 'That file is empty.' }
  }

  if (body.startsWith('{')) {
    const data = readJson(body)

    if (!isObject(data)) {
      return { error: 'That file looks like JSON but could not be read. Check for a missing bracket or quote.' }
    }

    if ('colors' in data || 'tokenColors' in data || 'include' in data) {
      return parseVsCode(body, { label: stemOf(fileName) })
    }
    const pairs = readJsonPairs(data)

    if ('base00' in pairs) {
      return parseBase16(body)
    }

    return { error: NOT_A_THEME }
  }

  if (/^\s*(?:-\s+)?["']?base00["']?\s*:/im.test(body)) {
    return parseBase16(body)
  }

  return { error: NOT_A_THEME }
}

// ---- finding themes on disk ----

/** The colour themes an extension offers, from its package.json (`contributes.themes`). High-contrast ones are left out. */
export function listVsCodeThemes(packageJsonText: string): { label: string; uiTheme: string; path: string }[] {
  const data = readJson(packageJsonText)

  if (!isObject(data) || !isObject(data.contributes) || !Array.isArray(data.contributes.themes)) {
    return []
  }
  const out: { label: string; uiTheme: string; path: string }[] = []

  for (const t of data.contributes.themes as unknown[]) {
    if (!isObject(t) || typeof t.path !== 'string' || t.path === '') {
      continue
    }
    const uiTheme = typeof t.uiTheme === 'string' ? t.uiTheme : 'vs-dark'

    if (uiTheme === 'hc-black' || uiTheme === 'hc-light') {
      continue
    }
    const label = typeof t.label === 'string' && t.label !== '' ? t.label : (typeof t.id === 'string' ? t.id : t.path)

    out.push({ label, uiTheme, path: t.path })
  }

  return out
}

/** Folders where editors keep their extensions. Not all will exist. `appData` is unused for now. */
export function vsCodeExtensionRoots(home: string, appData: string): string[] {
  void appData
  const h = home.replace(/[\\/]+$/, '').replace(/\\/g, '/')

  return ['.vscode', '.vscode-insiders', '.vscode-oss', '.cursor', '.windsurf', '.vscode-server'].map(
    d => `${h}/${d}/extensions`,
  )
}
