import { fixTheme, hslHex, hslOf, isHex } from './model.js'
import type { Mode, Roles, Surfaces, Text3, Theme } from './model.js'
import { accepted } from './tune.js'

// The other look of a theme that has only one: a light version of a dark theme, a dark version of a light one.
// The hues stay; the lightness is turned over. Pure colour maths: nothing here touches `$`.

/** The id of the made look of a theme that has no pair. */
export const ALT_SUFFIX = '~alt'

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))

/** A color kept at its hue, its saturation held in a range, at a set lightness. */
function recolor(hex: string, sat: [number, number], light: number): string {
  const [h, s] = hslOf(hex)

  return hslHex(h, clamp(s, sat[0], sat[1]), light)
}

/** A color kept at its hue and saturation, its lightness held in a range. */
function bounded(hex: string, sat: [number, number], light: [number, number]): string {
  const [h, s, l] = hslOf(hex)

  return hslHex(h, clamp(s, sat[0], sat[1]), clamp(l, light[0], light[1]))
}

/**
 * `p` in the opposite mode. Surfaces take the hue of the original page at a quiet saturation, text keeps each hue at a
 * lightness that reads, accent and status colors keep their hue at a lightness that stands out from the new page.
 * Returns undefined when the result would be refused by the app.
 */
export function flipTheme(p: Theme): Theme | undefined {
  if (![...p.surfaces, ...p.text, p.accent, ...Object.values(p.roles)].every(isHex)) {
    return undefined
  }
  const toLight = p.mode === 'dark'
  const mode: Mode = toLight ? 'light' : 'dark'
  const [h, s] = hslOf(p.surfaces[0])
  const quiet = clamp(s, 4, 30)
  let surfaces: Surfaces
  let text: Text3
  let roles: Roles
  let accent: string

  if (toLight) {
    const top = hslHex(h, quiet * 0.6, 99)

    surfaces = [hslHex(h, quiet, 93), hslHex(h, quiet * 0.8, 96), top, top]
    text = [recolor(p.text[0], [4, 35], 13), recolor(p.text[1], [4, 30], 30), recolor(p.text[2], [4, 25], 42)]
    accent = bounded(p.accent, [40, 85], [36, 50])
    roles = {
      danger: bounded(p.roles.danger, [45, 85], [34, 48]),
      success: bounded(p.roles.success, [45, 85], [28, 40]),
      warning: bounded(p.roles.warning, [45, 90], [30, 42]),
      pro: bounded(p.roles.pro, [40, 80], [34, 48]),
    }
  } else {
    surfaces = [hslHex(h, quiet, 9), hslHex(h, quiet, 12), hslHex(h, quiet, 16), hslHex(h, quiet * 0.9, 20)]
    text = [recolor(p.text[0], [4, 25], 92), recolor(p.text[1], [4, 22], 76), recolor(p.text[2], [4, 20], 62)]
    accent = bounded(p.accent, [40, 90], [58, 74])
    roles = {
      danger: bounded(p.roles.danger, [45, 90], [60, 72]),
      success: bounded(p.roles.success, [45, 85], [56, 70]),
      warning: bounded(p.roles.warning, [45, 90], [60, 74]),
      pro: bounded(p.roles.pro, [40, 85], [62, 76]),
    }
  }
  const made: Theme = { id: `${p.id}${ALT_SUFFIX}`, name: p.name, note: p.note, mode, surfaces, text, accent, roles, ...(p.family === undefined ? {} : { family: p.family }) }
  const { theme } = fixTheme(made)

  return accepted(theme) ? theme : undefined
}

/** The made looks for every theme in `themes` that has no pair in it, in order. A theme whose look cannot be made is left out. */
export function altLooks(themes: Theme[], hasPair: (t: Theme) => boolean): Theme[] {
  const out: Theme[] = []

  for (const t of themes) {
    if (hasPair(t)) {
      continue
    }
    const alt = flipTheme(t)

    if (alt !== undefined) {
      out.push(alt)
    }
  }

  return out
}
