import { arrangeSurfaces, FALLBACK, finish, isObject, parseThemeFile, readJson, stemOf } from './import.js'
import type { Imported } from './import.js'
import { contrast, lum, mix } from './model.js'
import type { Mode, Roles, Text3 } from './model.js'

// Reads terminal colour schemes (Windows Terminal, iTerm2, Alacritty, Kitty) into a Theme. Pure: no `$`, no files.

type Failed = { error: string }

/** What every terminal scheme has: two colours and sixteen ANSI ones (index 0 to 15, any may be missing). */
type Scheme = { name: string; bg: string; fg: string; ansi: (string | undefined)[] }

/** `#rrggbb`, `rrggbb`, `0xrrggbb` or `#rgb` as a six-digit hex, else undefined. */
export function anyHex(v: unknown): string | undefined {
  if (typeof v !== 'string') {
    return undefined
  }
  const s = v.trim().replace(/^["']|["']$/g, '').replace(/^(#|0x)/i, '')

  if (/^[0-9a-f]{3}$/i.test(s)) {
    return `#${[...s].map(d => d + d).join('').toLowerCase()}`
  }

  return /^[0-9a-f]{6}$/i.test(s) ? `#${s.toLowerCase()}` : undefined
}

function fromScheme(s: Scheme, source: string): Imported | Failed {
  const mode: Mode = lum(s.bg) > 0.18 ? 'light' : 'dark'
  const fb = FALLBACK[mode]
  const surfaces = arrangeSurfaces(mode, [s.bg, mix(s.bg, s.fg, 0.05), mix(s.bg, s.fg, 0.1), mix(s.bg, s.fg, 0.15)], s.fg)
  const page = surfaces[0]
  // The first colour that does not vanish into the page.
  const vivid = (fallback: string, ...idx: number[]): string => {
    for (const i of idx) {
      const c = s.ansi[i]

      if (c !== undefined && contrast(c, page) >= 1.3) {
        return c
      }
    }

    return fallback
  }
  const text: Text3 = [s.fg, mix(s.fg, s.bg, 0.3), mix(s.fg, s.bg, 0.55)]
  const roles: Roles = {
    danger: vivid(fb.roles[0], 1, 9),
    success: vivid(fb.roles[1], 2, 10),
    warning: vivid(fb.roles[2], 3, 11),
    pro: vivid(fb.roles[3], 5, 13),
  }
  const accent = vivid(fb.accent, 4, 12, 6, 14)

  return finish(s.name, `imported from ${source}`, mode, surfaces, text, accent, roles)
}

const MISSING = 'That scheme has no background and foreground color, so there is nothing to build a theme from.'

// ---- Windows Terminal ----

const WT_KEYS = [
  'black', 'red', 'green', 'yellow', 'blue', 'purple', 'cyan', 'white',
  'brightBlack', 'brightRed', 'brightGreen', 'brightYellow', 'brightBlue', 'brightPurple', 'brightCyan', 'brightWhite',
] as const

/** One scheme object, or a settings file / list of schemes (the first one is read). */
export function parseWindowsTerminal(text: string, stem = ''): Imported | Failed {
  let data = readJson(text)

  if (isObject(data) && Array.isArray(data.schemes)) {
    data = data.schemes[0]
  } else if (Array.isArray(data)) {
    data = data[0]
  }

  if (!isObject(data)) {
    return { error: 'That is not a readable Windows Terminal color scheme.' }
  }
  const bg = anyHex(data.background)
  const fg = anyHex(data.foreground)

  if (bg === undefined || fg === undefined) {
    return { error: MISSING }
  }
  const name = typeof data.name === 'string' && data.name.trim() !== '' ? data.name : stem

  return fromScheme({ name, bg, fg, ansi: WT_KEYS.map(k => anyHex(data[k])) }, 'Windows Terminal')
}

// ---- iTerm2 (.itermcolors, an XML property list) ----

function plistColor(xml: string, key: string): string | undefined {
  const at = xml.indexOf(`<key>${key}</key>`)

  if (at === -1) {
    return undefined
  }
  const end = xml.indexOf('</dict>', at)
  const block = xml.slice(at, end === -1 ? undefined : end)
  const part = (n: string): number | undefined => {
    const m = new RegExp(`<key>${n} Component</key>\\s*<real>([^<]+)</real>`).exec(block)
    const v = m === null ? NaN : parseFloat(m[1]!)

    return Number.isFinite(v) ? Math.max(0, Math.min(255, Math.round(v * 255))) : undefined
  }
  const [r, g, b] = [part('Red'), part('Green'), part('Blue')]

  return r === undefined || g === undefined || b === undefined
    ? undefined
    : `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

export function parseIterm(text: string, stem = ''): Imported | Failed {
  const bg = plistColor(text, 'Background Color')
  const fg = plistColor(text, 'Foreground Color')

  if (bg === undefined || fg === undefined) {
    return { error: MISSING }
  }

  return fromScheme({ name: stem, bg, fg, ansi: Array.from({ length: 16 }, (_, i) => plistColor(text, `Ansi ${i} Color`)) }, 'iTerm2')
}

// ---- Alacritty (TOML) ----

const ALA_NAMES = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']

export function parseAlacritty(text: string, stem = ''): Imported | Failed {
  const vals: Record<string, string> = {}
  let section = ''

  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    const head = /^\s*\[([^\]]+)\]/.exec(line)

    if (head !== null) {
      section = head[1]!.trim().toLowerCase()
      continue
    }
    const kv = /^\s*([A-Za-z_]+)\s*=\s*["']([^"']+)["']/.exec(line)

    if (kv !== null) {
      vals[`${section}.${kv[1]!.toLowerCase()}`] = kv[2]!
    }
  }
  const bg = anyHex(vals['colors.primary.background'])
  const fg = anyHex(vals['colors.primary.foreground'])

  if (bg === undefined || fg === undefined) {
    return { error: MISSING }
  }
  const ansi = [
    ...ALA_NAMES.map(n => anyHex(vals[`colors.normal.${n}`])),
    ...ALA_NAMES.map(n => anyHex(vals[`colors.bright.${n}`])),
  ]

  return fromScheme({ name: stem, bg, fg, ansi }, 'Alacritty')
}

// ---- Kitty (conf) ----

export function parseKitty(text: string, stem = ''): Imported | Failed {
  const vals: Record<string, string> = {}

  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    const m = /^\s*(foreground|background|color\d{1,2})\s+(#?[0-9a-fA-F]{3,6})\b/.exec(line)

    if (m !== null && !(m[1]! in vals)) {
      vals[m[1]!] = m[2]!
    }
  }
  const bg = anyHex(vals.background)
  const fg = anyHex(vals.foreground)

  if (bg === undefined || fg === undefined) {
    return { error: MISSING }
  }

  return fromScheme({ name: stem, bg, fg, ansi: Array.from({ length: 16 }, (_, i) => anyHex(vals[`color${i}`])) }, 'Kitty')
}

// ---- any file ----

/** Every theme file the mod can read: VS Code, base16/24, and the four terminal formats. */
export function readThemeFile(text: string, fileName?: string): Imported | Failed {
  const body = text.replace(/^﻿/, '').trim()
  const stem = stemOf(fileName)

  if (/<plist|<key>Ansi \d+ Color<\/key>/.test(body)) {
    return parseIterm(body, stem)
  }

  if (/^\s*\[colors[.\]]/m.test(body)) {
    return parseAlacritty(body, stem)
  }

  if (/^\s*(foreground|background)\s+#?[0-9a-f]{6}\b/im.test(body) && !body.startsWith('{')) {
    return parseKitty(body, stem)
  }

  if (body.startsWith('{') || body.startsWith('[')) {
    const data = readJson(body)
    const scheme = isObject(data) && Array.isArray(data.schemes) ? data.schemes[0] : Array.isArray(data) ? data[0] : data

    if (isObject(scheme) && 'background' in scheme && 'foreground' in scheme && !('colors' in scheme)) {
      return parseWindowsTerminal(body, stem)
    }
  }

  return parseThemeFile(body, fileName)
}
