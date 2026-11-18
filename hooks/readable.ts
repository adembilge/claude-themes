import { contrast, fixTheme, hslHex, hslOf, isHex, mix, validateTheme } from './model.js'
import type { Theme } from './model.js'
import { NO_TUNE, accepted, tuneTheme } from './tune.js'

// Readability options that apply to every theme: color-blind safe status colors, less glare, a warmer cast,
// stronger muted text and a more visible accent. Pure colour maths: nothing here touches `$`.

export type Level = 0 | 1 | 2
export type ColorBlind = 'off' | 'redgreen' | 'blueyellow'

export type Reading = {
  colorblind: ColorBlind
  /** 0 off, 1 soft, 2 softer. */
  glare: Level
  /** 0 off, 1 soft, 2 warm. */
  night: Level
  /** Only while the Day and night clock says night. */
  nightOnly: boolean
  /** 0 off, 1 lifted, 2 clear. */
  muted: Level
  /** 0 off, 1 clear (4.5:1 against the page), 2 strong (7:1). */
  focus: Level
}

export const NO_READING: Reading = { colorblind: 'off', glare: 0, night: 0, nightOnly: false, muted: 0, focus: 0 }

/** True when any option changes the colors (nightOnly alone changes nothing). */
export const isReading = (r: Reading): boolean => r.colorblind !== 'off' || r.glare > 0 || r.night > 0 || r.muted > 0 || r.focus > 0

const level = (v: unknown): Level => (v === 1 || v === 2 ? v : 0)

/** A Reading from anything a store might hold; every field falls back to off. */
export function cleanReading(raw: unknown): Reading {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ...NO_READING }
  }
  const r = raw as Record<string, unknown>

  return {
    colorblind: r.colorblind === 'redgreen' || r.colorblind === 'blueyellow' ? r.colorblind : 'off',
    glare: level(r.glare),
    night: level(r.night),
    nightOnly: r.nightOnly === true,
    muted: level(r.muted),
    focus: level(r.focus),
  }
}

// ---- the parts ----

/** A status color moved to a hue, keeping its saturation and lightness within a range that reads on its mode. */
function recolor(c: string, hue: number, dl: number, dark: boolean): string {
  const [, s, l] = hslOf(c)

  return hslHex(hue, Math.max(55, Math.min(90, s)), Math.max(dark ? 45 : 30, Math.min(dark ? 80 : 50, l + dl)))
}

/**
 * Status colors that stay apart for the two common kinds of color blindness. Red and green are told apart by
 * making danger a vermilion and success a sky blue, and by a difference in lightness; for blue and yellow the
 * success is a pure green, the warning an orange that is lighter than the danger. An approximation, not a simulation.
 */
function colorBlind(p: Theme, kind: ColorBlind): Theme {
  if (kind === 'off') {
    return p
  }
  const dark = p.mode === 'dark'
  const r = p.roles
  const roles =
    kind === 'redgreen'
      ? {
          danger: recolor(r.danger, 14, -10, dark),
          success: recolor(r.success, 205, 10, dark),
          warning: recolor(r.warning, 48, 4, dark),
          pro: recolor(r.pro, 280, 0, dark),
        }
      : {
          danger: recolor(r.danger, 355, -6, dark),
          success: recolor(r.success, 125, 6, dark),
          warning: recolor(r.warning, 30, 10, dark),
          pro: recolor(r.pro, 270, -8, dark),
        }

  return { ...p, roles }
}

/** Less glare: dark themes get a dimmer main text; light themes get dimmer whites. */
function glare(p: Theme, g: Level): Theme {
  if (g === 0) {
    return p
  }

  if (p.mode === 'dark') {
    const page = p.surfaces[0]

    return { ...p, text: [mix(p.text[0], page, 0.07 * g), mix(p.text[1], page, 0.05 * g), p.text[2]] }
  }
  const [s0, s1, s2] = p.surfaces
  const ink = p.text[0]
  const w = mix(s2, ink, 0.04 * g)

  return { ...p, surfaces: [mix(s0, ink, 0.02 * g), mix(s1, ink, 0.03 * g), w, w] }
}

/** A warmer cast with less blue, by the tuning dial's own warm shift (which backs off when the app would refuse it). */
function night(p: Theme, n: Level): Theme {
  return n === 0 ? p : tuneTheme(p, { ...NO_TUNE, warmth: n === 1 ? 2 : 4 }).theme
}

/** The faintest text pulled toward the main text, then raised until it reads at the target. */
function muted(p: Theme, m: Level): Theme {
  if (m === 0) {
    return p
  }
  const [t0, t1, t2] = p.text
  const toward = (c: string, k: number) => mix(c, t0, k)
  const want = m === 1 ? 4.5 : 6
  const worst = (c: string) => Math.min(...p.surfaces.map(s => contrast(c, s)))
  let text2 = toward(t2, m === 1 ? 0.35 : 0.55)

  for (let i = 0; i < 12 && worst(text2) < want; i++) {
    text2 = toward(text2, 0.15)
  }
  const text1 = worst(t1) >= worst(text2) ? toward(t1, m === 1 ? 0.15 : 0.3) : mix(t0, text2, 0.4)

  return { ...p, text: [t0, text1, text2] }
}

/** The accent made to stand out from every surface (the focus ring and links use it). */
function focus(p: Theme, f: Level): Theme {
  if (f === 0) {
    return p
  }
  const want = f === 1 ? 4.5 : 7
  const edge = p.mode === 'dark' ? '#ffffff' : '#000000'
  const worst = (c: string) => Math.min(...p.surfaces.map(s => contrast(c, s)))
  let accent = p.accent

  for (let i = 0; i < 14 && worst(accent) < want; i++) {
    accent = mix(accent, edge, 0.1)
  }

  return { ...p, accent }
}

/** The options as one pass, in a fixed order, then the contrast fix. */
function build(p: Theme, r: Reading): Theme {
  const out = focus(muted(glare(night(p, r.night), r.glare), r.muted), r.focus)

  return fixTheme(colorBlind(out, r.colorblind)).theme
}

/**
 * A theme with the person's readability options applied. When the result would be refused by the app, the options
 * are backed off one step at a time (the last one set first) until it is accepted; at worst the theme comes back unchanged.
 */
export function readableOf(p: Theme, reading: Reading): Theme {
  if (!isReading(reading) || ![...p.surfaces, ...p.text, p.accent, ...Object.values(p.roles)].every(isHex)) {
    return p
  }
  const r: Reading = { ...reading }

  for (let i = 0; i < 12; i++) {
    const out = build(p, r)

    if (accepted(out) && validateTheme(out) === null) {
      return out
    }

    if (r.focus > 0) {
      r.focus = (r.focus - 1) as Level
    } else if (r.muted > 0) {
      r.muted = (r.muted - 1) as Level
    } else if (r.glare > 0) {
      r.glare = (r.glare - 1) as Level
    } else if (r.night > 0) {
      r.night = (r.night - 1) as Level
    } else if (r.colorblind !== 'off') {
      r.colorblind = 'off'
    } else {
      break
    }
  }

  return p
}

// ---- words ----

export const COLORBLIND_CHOICES: { value: ColorBlind; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'redgreen', label: 'Red-green' },
  { value: 'blueyellow', label: 'Blue-yellow' },
]

export const GLARE_CHOICES: { value: Level; label: string }[] = [
  { value: 0, label: 'Off' },
  { value: 1, label: 'Soft' },
  { value: 2, label: 'Softer' },
]

export const NIGHT_CHOICES: { value: Level; label: string }[] = [
  { value: 0, label: 'Off' },
  { value: 1, label: 'Soft' },
  { value: 2, label: 'Warm' },
]

export const MUTED_CHOICES: { value: Level; label: string }[] = [
  { value: 0, label: 'Off' },
  { value: 1, label: 'Lifted' },
  { value: 2, label: 'Clear' },
]

export const FOCUS_CHOICES: { value: Level; label: string }[] = [
  { value: 0, label: 'Off' },
  { value: 1, label: 'Clear' },
  { value: 2, label: 'Strong' },
]
