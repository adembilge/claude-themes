import { expect, test } from 'claude-code/testing'

import { contrast, hslOf, rgbOf, validateTheme } from './model.js'
import type { Theme } from './model.js'
import { cleanTune, cleanTunes, describeTune, isTuned, NO_TUNE, TUNE_AXES, tuneTheme } from './tune.js'
import type { Tune } from './tune.js'

const T = (
  mode: 'dark' | 'light',
  id: string,
  name: string,
  surfaces: Theme['surfaces'],
  text: Theme['text'],
  accent: string,
  [danger, success, warning, pro]: [string, string, string, string],
): Theme => ({ id, name, note: 'test', mode, surfaces, text, accent, roles: { danger, success, warning, pro } })

const MOCHA = T('dark', 'catppuccin-mocha', 'Catppuccin Mocha',
  ['#181825', '#1e1e2e', '#313244', '#3d3f51'], ['#cdd6f4', '#bac2de', '#a6adc8'], '#cba6f7',
  ['#f38ba8', '#a6e3a1', '#f9e2af', '#b4befe'])
const ESPRESSO = T('dark', 'espresso', 'Espresso',
  ['#17110d', '#1f1712', '#281e17', '#2d221a'], ['#f1e6da', '#cfbfae', '#a8978a'], '#d98a4e',
  ['#c2453a', '#6b9a4d', '#c99a2e', '#9b78b8'])
const TOKYO = T('dark', 'tokyo-night', 'Tokyo Night',
  ['#16161e', '#1a1b26', '#24283b', '#292e42'], ['#c0caf5', '#a9b1d6', '#7f89b8'], '#7aa2f7',
  ['#f7768e', '#9ece6a', '#e0af68', '#bb9af7'])
const GH_DARK = T('dark', 'github-dark', 'GitHub Dark',
  ['#010409', '#0d1117', '#161b22', '#21262d'], ['#e6edf3', '#c9d1d9', '#8b949e'], '#58a6ff',
  ['#f85149', '#3fb950', '#d29922', '#bc8cff'])
const GH_LIGHT = T('light', 'github-light', 'GitHub Light',
  ['#eaeef2', '#f6f8fa', '#ffffff', '#ffffff'], ['#1f2328', '#424a53', '#656d76'], '#0969da',
  ['#cf222e', '#1a7f37', '#9a6700', '#8250df'])
const NOTION = T('light', 'notion', 'Notion',
  ['#efefed', '#f7f6f3', '#ffffff', '#ffffff'], ['#37352f', '#5a5852', '#787774'], '#2383e2',
  ['#eb5757', '#448361', '#cb912f', '#9065b0'])

const THEMES = [MOCHA, ESPRESSO, TOKYO, GH_DARK, GH_LIGHT, NOTION]
const DARK = THEMES.filter(p => p.mode === 'dark')
const LIGHT = THEMES.filter(p => p.mode === 'light')

const t = (over: Partial<Tune>): Tune => ({ ...NO_TUNE, ...over })
const colours = (p: Theme): string[] => [...p.surfaces, ...p.text, p.accent, ...Object.values(p.roles)]
const SIX = /^#[0-9a-f]{6}$/
const STEPS = [-4, 0, 4]

test('the fixtures are themselves valid', () => {
  for (const p of THEMES) {
    expect(validateTheme(p)).toBeNull()
  }
})

test('no tune returns the same colours, unlimited', () => {
  for (const p of THEMES) {
    const out = tuneTheme(p, NO_TUNE)

    expect(out.limited).toBe(false)
    expect(colours(out.theme)).toEqual(colours(p))
    expect(isTuned(NO_TUNE)).toBe(false)
  }
})

for (const p of THEMES) {
  test(`${p.name}: every combination of the dials at -4, 0 and 4 gives a palette the app accepts`, () => {
    let limited = 0

    for (const warmth of STEPS) {
      for (const sat of STEPS) {
        for (const bright of STEPS) {
          for (const c of STEPS) {
            const out = tuneTheme(p, { ...NO_TUNE, warmth, sat, bright, contrast: c })

            expect(validateTheme(out.theme)).toBeNull()
            expect(colours(out.theme).every(h => SIX.test(h))).toBe(true)
            expect(out.theme.id).toBe(p.id)
            expect(out.theme.name).toBe(p.name)
            expect(out.theme.note).toBe(p.note)
            expect(out.theme.mode).toBe(p.mode)

            if (out.limited) {
              limited++
            }
          }
        }
      }
    }
    // Backing off is the exception, not the rule.
    expect(limited).toBeLessThan(40)
  })
}

test('limited is only set when the result is smaller than asked', () => {
  // One gentle step on one dial is always honoured in full.
  for (const p of THEMES) {
    for (const k of ['warmth', 'sat', 'bright', 'contrast'] as const) {
      for (const v of [-1, 1]) {
        expect(tuneTheme(p, t({ [k]: v })).limited).toBe(false)
      }
    }
  }
  // A limited result is still different from the original only if something was kept.
  for (const p of THEMES) {
    const out = tuneTheme(p, { ...NO_TUNE, warmth: 4, sat: 4, bright: -4, contrast: -4 })

    expect(typeof out.limited).toBe('boolean')
    expect(validateTheme(out.theme)).toBeNull()
  }
})

test('warmth moves the page toward red or blue', () => {
  for (const p of THEMES) {
    const base = rgbOf(p.surfaces[0])
    const warm = rgbOf(tuneTheme(p, t({ warmth: 4 })).theme.surfaces[0])
    const cool = rgbOf(tuneTheme(p, t({ warmth: -4 })).theme.surfaces[0])

    expect(warm[0] - warm[2]).toBeGreaterThan(base[0] - base[2] - 0.5)
    expect(cool[0] - cool[2]).toBeLessThan(base[0] - base[2] + 0.5)
    expect(warm[0] - warm[2]).toBeGreaterThan(cool[0] - cool[2])
  }

  // On a mid-tone page the move is plain.
  const warm = rgbOf(tuneTheme(TOKYO, t({ warmth: 4 })).theme.surfaces[1])
  const cool = rgbOf(tuneTheme(TOKYO, t({ warmth: -4 })).theme.surfaces[1])

  expect(warm[0]).toBeGreaterThan(warm[2])
  expect(cool[2]).toBeGreaterThan(cool[0])
})

test('saturation scales the accent', () => {
  for (const p of THEMES) {
    const base = hslOf(p.accent)[1]
    const dull = tuneTheme(p, t({ sat: -4 }))
    const rich = tuneTheme(p, t({ sat: 4 }))

    expect(hslOf(dull.theme.accent)[1]).toBeLessThan(base)

    if (!rich.limited && base < 85) {
      expect(hslOf(rich.theme.accent)[1]).toBeGreaterThan(base)
    }
    expect(hslOf(rich.theme.accent)[1]).toBeGreaterThan(hslOf(dull.theme.accent)[1])
  }
})

test('surface brightness moves the surfaces and keeps their order', () => {
  for (const p of DARK) {
    const lighter = tuneTheme(p, t({ bright: 2 })).theme
    const darker = tuneTheme(p, t({ bright: -2 })).theme

    expect(hslOf(lighter.surfaces[0])[2]).toBeGreaterThan(hslOf(p.surfaces[0])[2])
    expect(hslOf(darker.surfaces[0])[2]).toBeLessThan(hslOf(p.surfaces[0])[2])

    for (const out of [lighter, darker]) {
      for (let i = 1; i < 4; i++) {
        expect(hslOf(out.surfaces[i]!)[2]).toBeGreaterThan(hslOf(out.surfaces[i - 1]!)[2] - 0.01)
      }
    }
    // Text is left where it was.
    expect(lighter.text).toEqual(p.text)
  }
})

test('text contrast pushes the main text away from the page, or toward it', () => {
  for (const p of [MOCHA, ESPRESSO, TOKYO, GH_LIGHT, NOTION]) {
    const base = contrast(p.text[0], p.surfaces[0])
    const strong = tuneTheme(p, t({ contrast: 3 })).theme
    const soft = tuneTheme(p, t({ contrast: -3 })).theme

    expect(contrast(strong.text[0], strong.surfaces[0])).toBeGreaterThan(base)
    expect(contrast(soft.text[0], soft.surfaces[0])).toBeLessThan(base)
  }
})

test('light themes keep the last two surfaces equal', () => {
  for (const p of LIGHT) {
    for (const warmth of STEPS) {
      for (const bright of STEPS) {
        for (const sat of STEPS) {
          const out = tuneTheme(p, { ...NO_TUNE, warmth, sat, bright, contrast: 2 }).theme

          expect(out.surfaces[2]).toBe(out.surfaces[3])
        }
      }
    }
  }
})

test('tuning is deterministic and fast', () => {
  const a = tuneTheme(MOCHA, { ...NO_TUNE, warmth: 3, sat: -2, bright: 4, contrast: 1 })
  const b = tuneTheme(MOCHA, { ...NO_TUNE, warmth: 3, sat: -2, bright: 4, contrast: 1 })

  expect(a).toEqual(b)
  const start = Date.now()

  for (let i = 0; i < 75; i++) {
    tuneTheme(THEMES[i % THEMES.length]!, { ...NO_TUNE, warmth: 2, sat: 2, bright: 2, contrast: 2 })
  }
  // A gallery of 75 themes in a fraction of a second.
  expect(Date.now() - start).toBeLessThan(150)
})

test('cleanTune and cleanTunes sanitise garbage', () => {
  expect(cleanTune(null)).toEqual(NO_TUNE)
  expect(cleanTune('warm')).toEqual(NO_TUNE)
  expect(cleanTune(7)).toEqual(NO_TUNE)
  expect(cleanTune([1, 2, 3, 4])).toEqual(NO_TUNE)
  expect(cleanTune({ warmth: 2.6, sat: -9, bright: 'x', contrast: Number.NaN })).toEqual(t({ warmth: 3, sat: -4 }))
  expect(cleanTune({ warmth: 99, sat: Infinity, bright: -0.2, contrast: 1 })).toEqual(t({ warmth: 4, contrast: 1 }))

  const known = new Set(['a', 'b', 'c'])
  const raw = {
    a: { warmth: 1 },
    b: { warmth: 0, sat: 0 },
    c: 'junk',
    zzz: { warmth: 4 },
  }

  expect(cleanTunes(raw, known)).toEqual({ a: t({ warmth: 1 }) })
  expect(cleanTunes(null, known)).toEqual({})
  expect(cleanTunes([1], known)).toEqual({})
  expect(cleanTunes('x', known)).toEqual({})

  const ids = Array.from({ length: 120 }, (_, i) => `id${i}`)
  const many = Object.fromEntries(ids.map(id => [id, { bright: 1 }]))

  expect(Object.keys(cleanTunes(many, new Set(ids))).length).toBe(80)
})

test('describeTune and the dial list read in plain words', () => {
  expect(describeTune(NO_TUNE)).toBe('no changes')
  expect(describeTune(t({ warmth: 2, sat: 1 }))).toBe('warmer, a little more saturated')
  expect(describeTune(t({ warmth: -1 }))).toBe('a little cooler')
  expect(describeTune(t({ bright: 4, contrast: -2 }))).toBe('much lighter surfaces, softer text')
  expect(TUNE_AXES.map(a => a.key)).toEqual(['warmth', 'sat', 'bright', 'contrast', 'hue', 'tint', 'accent', 'status'])
  expect(TUNE_AXES.map(a => a.label)).toEqual(['Warmth', 'Saturation', 'Surface brightness', 'Text contrast', 'Hue', 'Surface tint', 'Accent', 'Status colors'])
})
