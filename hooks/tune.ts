import { contrast, hslHex, hslOf, isHex, lum, mix } from './model.js'
import type { Surfaces, Text3, Theme } from './model.js'

// Fine tuning of a built-in theme: four small dials, each from -4 to 4. Pure colour maths, nothing here touches `$`.

export type Tune = {
  warmth: number
  sat: number
  bright: number
  contrast: number
  hue: number
  tint: number
  accent: number
  status: number
}

export const TUNE_MAX = 4

export const NO_TUNE: Tune = { warmth: 0, sat: 0, bright: 0, contrast: 0, hue: 0, tint: 0, accent: 0, status: 0 }

const KEYS = ['warmth', 'sat', 'bright', 'contrast', 'hue', 'tint', 'accent', 'status'] as const

/** Saved tunes kept at most. */
const MAX_SAVED = 80

export const isTuned = (t: Tune): boolean => KEYS.some(k => t[k] !== 0)

const step = (v: unknown): number => {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    return 0
  }
  const n = Math.max(-TUNE_MAX, Math.min(TUNE_MAX, Math.round(v)))

  return n === 0 ? 0 : n
}

/** A Tune from anything: non-objects give no tune, each dial is rounded and kept within -4..4, a non-number is 0. */
export function cleanTune(raw: unknown): Tune {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ...NO_TUNE }
  }
  const r = raw as Record<string, unknown>

  return {
    warmth: step(r.warmth),
    sat: step(r.sat),
    bright: step(r.bright),
    contrast: step(r.contrast),
    hue: step(r.hue),
    tint: step(r.tint),
    accent: step(r.accent),
    status: step(r.status),
  }
}

/** A saved map of theme id -> Tune made safe: unknown ids and all-zero entries are dropped, at most 80 are kept. */
export function cleanTunes(raw: unknown, known: Set<string>): Record<string, Tune> {
  const out: Record<string, Tune> = {}

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return out
  }
  let n = 0

  for (const id of Object.keys(raw)) {
    if (n >= MAX_SAVED) {
      break
    }

    if (!known.has(id)) {
      continue
    }
    const t = cleanTune((raw as Record<string, unknown>)[id])

    if (isTuned(t)) {
      out[id] = t
      n++
    }
  }

  return out
}

// ---- the colour maths ----

const WARM = '#ff9a3c'
const COOL = '#3c8cff'

/** Amounts per dial step, and the size of the full request. */
const WARM_PER_STEP = 0.025
const ACCENT_WARM = 0.4
const SAT_PER_STEP = 0.12
const TEXT_SAT = 0.5
const BRIGHT_PER_STEP = 1.6
const CONTRAST_PER_STEP = 2.5
const HUE_PER_STEP = 7
const TINT_PER_STEP = 0.2
const ACCENT_SAT_PER_STEP = 0.15
const ACCENT_LIGHT_PER_STEP = 1.5
const STATUS_PER_STEP = 0.15

type Shift = {
  /** Signed share of a warm (positive) or cool (negative) tint mixed in; lightness is kept. */
  warm: number
  /** Saturation is multiplied by this. */
  sat: number
  /** Added to the lightness, in points. */
  light: number
  /** Added to the hue, in degrees. */
  hue?: number
}

function shift(hex: string, s: Shift): string {
  const low = hex.toLowerCase()

  if (s.warm === 0 && s.sat === 1 && s.light === 0 && (s.hue ?? 0) === 0) {
    return low
  }
  const [h0, s0, l0] = hslOf(low)
  let h = h0
  let sat = s0

  if (s.warm !== 0) {
    const [h1, s1] = hslOf(mix(low, s.warm > 0 ? WARM : COOL, Math.abs(s.warm)))

    h = h1
    sat = Math.max(s0, s1)
  }
  sat = Math.max(0, Math.min(100, sat * s.sat))
  h = (((h + (s.hue ?? 0)) % 360) + 360) % 360

  return hslHex(h, sat, Math.max(0, Math.min(100, l0 + s.light)))
}

/** The palette moved by the four dials, each scaled by `f` (1 is the full request). Not yet checked. */
function request(p: Theme, t: Tune, f: number): Theme {
  const w = t.warmth * f
  const sa = 1 + SAT_PER_STEP * t.sat * f
  const light = BRIGHT_PER_STEP * t.bright * f
  const push = CONTRAST_PER_STEP * t.contrast * f
  const page = hslOf(p.surfaces[0])[2]

  const dh = HUE_PER_STEP * t.hue * f
  const tint = 1 + TINT_PER_STEP * t.tint * f

  const surfaces = p.surfaces.map(c => shift(c, { warm: WARM_PER_STEP * w, sat: sa * tint, light, hue: dh })) as Surfaces

  if (p.mode === 'light') {
    surfaces[3] = surfaces[2]
  }
  const text = p.text.map(c => {
    const away = hslOf(c)[2] >= page ? 1 : -1

    return shift(c, { warm: WARM_PER_STEP * w, sat: 1 + (sa - 1) * TEXT_SAT, light: away * push, hue: dh })
  }) as Text3

  const accent = shift(p.accent, {
    warm: WARM_PER_STEP * ACCENT_WARM * w,
    sat: sa * (1 + ACCENT_SAT_PER_STEP * t.accent * f),
    light: ACCENT_LIGHT_PER_STEP * t.accent * f * (p.mode === 'dark' ? 1 : -1),
    hue: dh,
  })
  const roles = Object.fromEntries(
    Object.entries(p.roles).map(([k, v]) => [k, shift(v, { warm: 0, sat: sa * (1 + STATUS_PER_STEP * t.status * f), light: 0, hue: dh })]),
  ) as Theme['roles']

  return { ...p, surfaces, text, accent, roles }
}

/** CIE lightness of a six-digit hex, the scale the app's gray ramp is ordered on. */
function lstar(hex: string): number {
  const y = lum(hex)

  return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y
}

/**
 * What validateTheme checks, without building the app's colours (that costs about ten milliseconds, too slow for
 * a gallery): the text reads on every surface, and the ramp runs in one direction (the app's rule): text[0], text[1],
 * text[2], then the surfaces from the menu down to the page on a dark theme; on a light one the menu and card
 * surfaces down to the page, then the text. The tests hold this to validateTheme on every combination.
 */
function accepted(t: Theme): boolean {
  if (t.surfaces.some(s => contrast(t.text[0], s) < 4.5 || contrast(t.text[2], s) < 3)) {
    return false
  }
  const chain = t.mode === 'dark'
    ? [...t.text, t.surfaces[3], t.surfaces[2], t.surfaces[1], t.surfaces[0]]
    : [t.surfaces[2], t.surfaces[1], t.surfaces[0], t.text[2], t.text[1], t.text[0]]
  const l = chain.map(lstar)

  return l.every((v, i) => i === 0 || v <= l[i - 1]!) && (t.mode === 'dark' || t.surfaces[2] === t.surfaces[3])
}

const BACK_OFF = 0.9
const TRIES = 24

/**
 * A theme moved by `t`. If the full request would be refused (text too faint, surfaces out of order) every dial is
 * shrunk by a tenth until it is accepted, and `limited` says it came out smaller than asked.
 */
export function tuneTheme(p: Theme, t: Tune): { theme: Theme; limited: boolean } {
  if (!isTuned(t) || ![...p.surfaces, ...p.text, p.accent, ...Object.values(p.roles)].every(isHex)) {
    return { theme: p, limited: false }
  }
  const tune = cleanTune(t)
  let f = 1

  for (let i = 0; i < TRIES; i++, f *= BACK_OFF) {
    const out = request(p, tune, f)

    if (accepted(out)) {
      return { theme: out, limited: i > 0 }
    }
  }

  // Nothing smaller worked: keep the theme as it was.
  return { theme: p, limited: true }
}

// ---- words ----

const AXIS_WORDS: Record<keyof Tune, [string, string]> = {
  warmth: ['cooler', 'warmer'],
  sat: ['less saturated', 'more saturated'],
  bright: ['darker surfaces', 'lighter surfaces'],
  contrast: ['softer text', 'stronger text'],
  hue: ['hue turned back', 'hue turned on'],
  tint: ['less tinted surfaces', 'more tinted surfaces'],
  accent: ['quieter accent', 'bolder accent'],
  status: ['softer status colors', 'stronger status colors'],
}

/** The tune in plain words: "warmer, a little more saturated". */
export function describeTune(t: Tune): string {
  const parts: string[] = []

  for (const k of KEYS) {
    const v = t[k]

    if (v === 0) {
      continue
    }
    const size = Math.abs(v) === 1 ? 'a little ' : Math.abs(v) >= TUNE_MAX ? 'much ' : ''

    parts.push(`${size}${AXIS_WORDS[k][v > 0 ? 1 : 0]}`)
  }

  return parts.length === 0 ? 'no changes' : parts.join(', ')
}

export const TUNE_AXES: { key: keyof Tune; label: string; low: string; high: string }[] = [
  { key: 'warmth', label: 'Warmth', low: 'Cooler', high: 'Warmer' },
  { key: 'sat', label: 'Saturation', low: 'Duller', high: 'Richer' },
  { key: 'bright', label: 'Surface brightness', low: 'Darker', high: 'Lighter' },
  { key: 'contrast', label: 'Text contrast', low: 'Softer', high: 'Stronger' },
  { key: 'hue', label: 'Hue', low: 'Back', high: 'Forward' },
  { key: 'tint', label: 'Surface tint', low: 'Grayer', high: 'Colored' },
  { key: 'accent', label: 'Accent', low: 'Quieter', high: 'Bolder' },
  { key: 'status', label: 'Status colors', low: 'Softer', high: 'Stronger' },
]
