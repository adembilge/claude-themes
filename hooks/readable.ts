import { fixTheme, isHex, mix, validateTheme } from './model.js'
import type { Theme } from './model.js'
import { NO_TUNE, accepted, tuneTheme } from './tune.js'

// Readability options that apply to every theme: less glare and a warmer cast for the night.
// Pure colour maths: nothing here touches `$`.

export type Level = 0 | 1 | 2

export type Reading = {
  /** 0 off, 2 on. */
  glare: Level
  /** 0 off, 2 on. */
  night: Level
  /** Only while the Day and night clock says night. */
  nightOnly: boolean
}

export const NO_READING: Reading = { glare: 0, night: 0, nightOnly: false }

/** True when any option changes the colors (nightOnly alone changes nothing). */
export const isReading = (r: Reading): boolean => r.glare > 0 || r.night > 0

// Each option is on or off; an earlier version kept Soft and Softer apart, and either now means on.
const level = (v: unknown): Level => (v === 1 || v === 2 ? 2 : 0)

/** A Reading from anything a store might hold; every field falls back to off. Options that were removed are ignored. */
export function cleanReading(raw: unknown): Reading {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ...NO_READING }
  }
  const r = raw as Record<string, unknown>

  return { glare: level(r.glare), night: level(r.night), nightOnly: r.nightOnly === true }
}

// ---- the parts ----

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

/** The options as one pass, then the contrast fix. */
function build(p: Theme, r: Reading): Theme {
  return fixTheme(glare(night(p, r.night), r.glare)).theme
}

/**
 * A theme with the person's readability options applied. When the result would be refused by the app, the options
 * are backed off one step at a time (glare first) until it is accepted; at worst the theme comes back unchanged.
 */
export function readableOf(p: Theme, reading: Reading): Theme {
  if (!isReading(reading) || ![...p.surfaces, ...p.text, p.accent, ...Object.values(p.roles)].every(isHex)) {
    return p
  }
  const r: Reading = { ...reading }

  for (let i = 0; i < 6; i++) {
    const out = build(p, r)

    if (accepted(out) && validateTheme(out) === null) {
      return out
    }

    if (r.glare > 0) {
      r.glare = (r.glare - 1) as Level
    } else if (r.night > 0) {
      r.night = (r.night - 1) as Level
    } else {
      break
    }
  }

  return p
}
