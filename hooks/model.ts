import type { ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'

// Shared model and pure colour maths. Nothing here touches `$`.

export type Mode = 'dark' | 'light'

export type Surfaces = [string, string, string, string]
export type Text3 = [string, string, string]

export type Roles = { danger: string; success: string; warning: string; pro: string }

/**
 * One UI theme. A theme is either dark or light; picking it sets the app's mode too.
 * Surfaces run page -> card -> panel -> menu. Dark ones get lighter along the list; light ones
 * get lighter too, and the last two are one color (make-colors requires it).
 */
export type Theme = {
  id: string
  name: string
  note: string
  mode: Mode
  surfaces: Surfaces
  text: Text3
  accent: string
  roles: Roles
  /** A family the theme belongs to ("Catppuccin"), for the gallery filter. */
  family?: string
  /** Words for the working line while this theme is on: up to 6, 24 characters each. */
  words?: string[]
}

export const HEX = /^#[0-9a-f]{6}$/i
export const isHex = (v: unknown): v is string => typeof v === 'string' && HEX.test(v)

export const rgbOf = (h: string): [number, number, number] =>
  [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]

/** The color `t` of the way from `a` to `b`, both six-digit hex. */
export function mix(a: string, b: string, t: number): `#${string}` {
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16)
  const out = [0, 1, 2].map(i => Math.round(ch(a, i) * (1 - t) + ch(b, i) * t).toString(16).padStart(2, '0')).join('')

  return `#${out}`
}

export function lum(h: string): number {
  const [r, g, b] = rgbOf(h).map(v => {
    const c = v / 255

    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio of two six-digit hex colors. */
export function contrast(a: string, b: string): number {
  const x = lum(a)
  const y = lum(b)

  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

export function hslHex(h: number, s: number, l: number): string {
  const sat = s / 100
  const lig = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sat * Math.min(lig, 1 - lig)
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))

  return `#${[f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('')}`
}

/** [hue 0-360, saturation 0-100, lightness 0-100] of a six-digit hex. */
export function hslOf(hex: string): [number, number, number] {
  const [r, g, b] = rgbOf(hex).map(v => v / 255) as [number, number, number]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  const l = (max + min) / 2

  if (d === 0) {
    return [0, 0, l * 100]
  }
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4

  return [(h * 60 + 360) % 360, s * 100, l * 100]
}

export function hueOf(hex: string): number {
  return hslOf(hex)[0]
}

export const slug = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24) || 'theme'

export const cleanName = (name: string): string => name.replace(/[^\p{L}\p{N} _.&'-]/gu, '').trim().slice(0, 24)

export const MAX_WORDS = 6

/** Up to six short words, letters and spaces only; anything else is dropped. */
export function cleanWords(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : []

  return list
    .filter((w): w is string => typeof w === 'string')
    .map(w => w.replace(/[^\p{L}\p{N} '’-]/gu, '').trim().slice(0, 24))
    .filter(w => w !== '')
    .slice(0, MAX_WORDS)
}

/** A Theme as the app's color object. Throws on a palette make-colors cannot use. */
export function look(p: Theme): ThemeSetArgs {
  const { theme: colors } = makeColors({
    label: p.name,
    only: p.mode,
    roles: { accent: p.accent, ...p.roles },
    [p.mode]: {
      gray: {
        anchors: {
          'surface-0': p.surfaces[0],
          'surface-1': p.surfaces[1],
          'surface-2': p.surfaces[2],
          'surface-3': p.surfaces[3],
          'text-primary': p.text[0],
          'text-secondary': p.text[1],
          'text-muted': p.text[2],
        },
      },
    },
  })

  return { colors }
}

/**
 * One look that holds a light theme under `light` and a dark theme under `dark` and names no mode,
 * so the app picks by its own setting (and its System setting follows the OS).
 */
export function lookPair(light: Theme, dark: Theme): ThemeSetArgs {
  const mode = (p: Theme) => ({
    gray: {
      anchors: {
        'surface-0': p.surfaces[0],
        'surface-1': p.surfaces[1],
        'surface-2': p.surfaces[2],
        'surface-3': p.surfaces[3],
        'text-primary': p.text[0],
        'text-secondary': p.text[1],
        'text-muted': p.text[2],
      },
    },
    roles: { accent: p.accent, ...p.roles },
  })
  const { theme: colors } = makeColors({
    label: `${dark.name} + ${light.name}`,
    light: mode(light),
    dark: mode(dark),
  })

  return { colors }
}

/** Why a palette would be refused, or null when it is fine. */
export function validateTheme(t: Theme): string | null {
  if (![...t.surfaces, ...t.text, t.accent, ...Object.values(t.roles)].every(isHex)) {
    return 'Every color must be a six-digit hex such as #d98a4e.'
  }

  if (t.surfaces.some(s => contrast(t.text[0], s) < 4.5) || t.surfaces.some(s => contrast(t.text[2], s) < 3)) {
    return 'The text would be too faint on that background. Try another accent or the other base.'
  }

  try {
    look(t)
  } catch {
    return 'The app would refuse this palette: surfaces must run from the page to the menu, each one lighter.'
  }

  return null
}

/**
 * Nudges a palette the app would refuse until it passes, and says what it changed.
 * Surfaces are made to get lighter along the list, text is raised until it reads, the accent and the
 * roles are lifted off the page. A palette with a color that is not hex is returned as it is.
 */
export function fixTheme(t: Theme): { theme: Theme; notes: string[] } {
  const all = [...t.surfaces, ...t.text, t.accent, ...Object.values(t.roles)]

  if (!all.every(isHex)) {
    return { theme: t, notes: [] }
  }
  const dark = t.mode === 'dark'
  const toward = dark ? '#ffffff' : '#000000'
  const notes: string[] = []
  const low = (v: string) => v.toLowerCase()
  const surfaces = t.surfaces.map(low) as Surfaces
  let text = t.text.map(low) as Text3
  let accent = low(t.accent)
  const roles = Object.fromEntries(Object.entries(t.roles).map(([k, v]) => [k, low(v)])) as Roles

  // Surfaces: each one lighter than the one before (the last two equal on a light theme).
  const before = surfaces.join()

  for (let i = 1; i < 4; i++) {
    const prev = surfaces[i - 1]!

    if (lum(surfaces[i]!) <= lum(prev)) {
      surfaces[i] = mix(prev, '#ffffff', 0.05 + 0.02 * i)
    }
  }

  if (!dark) {
    surfaces[3] = surfaces[2]!
  }

  if (surfaces.join() !== before) {
    notes.push('made the surfaces get lighter from the page to the menu')
  }

  // Text: readable on every surface.
  const worst = (c: string) => Math.min(...surfaces.map(s => contrast(c, s)))
  const raise = (c: string, need: number): string => {
    let out = c

    for (let i = 0; i < 14 && worst(out) < need; i++) {
      out = mix(out, toward, 0.12)
    }

    return out
  }
  const t0 = raise(text[0], 4.5)
  const t1 = raise(text[1], 4.5)
  const t2 = raise(text[2], 3)

  if (t0 !== text[0]) {
    notes.push('raised the main text')
  }

  if (t1 !== text[1]) {
    notes.push('raised the second text')
  }

  if (t2 !== text[2]) {
    notes.push('raised the muted text')
  }
  text = [t0, t1, t2]

  // The second text is not stronger than the main one, the muted not stronger than the second.
  if (worst(text[1]) > worst(text[0])) {
    text = [text[0], mix(text[0], text[2], 0.5), text[2]]
  }

  // Accent and roles stand out from the page.
  const lift = (c: string, name: string): string => {
    let out = c

    for (let i = 0; i < 8 && contrast(out, surfaces[0]!) < 3; i++) {
      out = mix(out, toward, 0.15)
    }

    if (out !== c) {
      notes.push(`lifted the ${name} off the page`)
    }

    return out
  }

  accent = lift(accent, 'accent')

  for (const k of Object.keys(roles) as (keyof Roles)[]) {
    roles[k] = lift(roles[k], k)
  }

  return { theme: { ...t, surfaces, text, accent, roles }, notes }
}

// ---- codes: a theme as one line of text ----

export const CODE_PREFIX = 'claude-themes:'

/** A theme from anything that holds one: a saved value or a pasted code. Null when it is not a safe palette. */
export function sanitizeTheme(o: unknown): Theme | null {
  if (typeof o !== 'object' || o === null) {
    return null
  }
  const r = o as Record<string, unknown>
  const name = typeof r.name === 'string' ? cleanName(r.name) : ''
  const roles = (typeof r.roles === 'object' && r.roles !== null ? r.roles : {}) as Record<string, unknown>
  const { danger, success, warning, pro } = roles
  const mode = r.mode

  if (name === '' || (mode !== 'dark' && mode !== 'light')) {
    return null
  }

  if (!Array.isArray(r.surfaces) || r.surfaces.length !== 4 || !r.surfaces.every(isHex)) {
    return null
  }

  if (!Array.isArray(r.text) || r.text.length !== 3 || !r.text.every(isHex)) {
    return null
  }

  if (!isHex(r.accent) || !isHex(danger) || !isHex(success) || !isHex(warning) || !isHex(pro)) {
    return null
  }
  const low = (v: string) => v.toLowerCase()
  const words = cleanWords(r.words)
  const t: Theme = {
    id: `my-${slug(name)}`,
    name,
    note: typeof r.note === 'string' && r.note.trim() !== '' ? r.note.replace(/[^\p{L}\p{N} _.,&'()-]/gu, '').trim().slice(0, 40) : `your ${mode} theme`,
    mode,
    surfaces: r.surfaces.map(low) as Surfaces,
    text: r.text.map(low) as Text3,
    accent: low(r.accent),
    roles: { danger: low(danger), success: low(success), warning: low(warning), pro: low(pro) },
    ...(words.length === 0 ? {} : { words }),
  }

  return validateTheme(t) === null ? t : null
}

/** The shareable text of a theme: a prefix and its palette as JSON. */
export function themeToCode(t: Theme): string {
  return `${CODE_PREFIX}${JSON.stringify({
    name: t.name,
    mode: t.mode,
    surfaces: t.surfaces,
    text: t.text,
    accent: t.accent,
    roles: t.roles,
    ...(t.words === undefined || t.words.length === 0 ? {} : { words: t.words }),
  })}`
}

export function parseCode(text: string): { theme: Theme } | { error: string } {
  const code = text.trim()

  if (!code.startsWith(CODE_PREFIX)) {
    return { error: `That is not a theme code. It starts with "${CODE_PREFIX}".` }
  }
  let data: unknown

  try {
    data = JSON.parse(code.slice(CODE_PREFIX.length))
  } catch {
    return { error: 'The code is damaged: it could not be read.' }
  }
  const theme = sanitizeTheme(data)

  return theme === null
    ? { error: 'The code holds a palette the app would refuse. Check its colors and the text contrast.' }
    : { theme }
}
