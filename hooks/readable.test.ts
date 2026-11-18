import { expect, test } from 'claude-code/testing'

import { contrast, hslOf, lum, rgbOf, validateTheme } from './model.js'
import type { Theme } from './model.js'
import { PACKS } from './packs.js'
import { accepted } from './tune.js'
import { NO_READING, cleanReading, isReading, readableOf } from './readable.js'
import type { ColorBlind, Level, Reading } from './readable.js'

const DARK = PACKS.filter(p => p.mode === 'dark')
const LIGHT = PACKS.filter(p => p.mode === 'light')
const worst = (c: string, t: Theme) => Math.min(...t.surfaces.map(s => contrast(c, s)))
const on = (change: Partial<Reading>): Reading => ({ ...NO_READING, ...change })

// Each check runs once for the dark themes and once for the light ones, so every test stays well inside the
// time limit on a slow machine (building a palette costs a few milliseconds).
function perHalf(name: string, check: (t: Theme) => void): void {
  for (const [label, list] of [['dark', DARK], ['light', LIGHT]] as const) {
    test(`${name} (${label} themes)`, () => {
      for (const t of list) {
        check(t)
      }
    })
  }
}

test('cleanReading makes anything safe', () => {
  expect(cleanReading(undefined)).toEqual(NO_READING)
  expect(cleanReading('x')).toEqual(NO_READING)
  expect(cleanReading([])).toEqual(NO_READING)
  expect(cleanReading({ colorblind: 'nope', glare: 7, night: -1, muted: '1', focus: 2, nightOnly: 1 })).toEqual(on({ focus: 2 }))
  expect(cleanReading({ colorblind: 'redgreen', glare: 2, night: 1, nightOnly: true, muted: 2, focus: 1 })).toEqual({
    colorblind: 'redgreen',
    glare: 2,
    night: 1,
    nightOnly: true,
    muted: 2,
    focus: 1,
  })
})

test('with nothing on, the theme comes back as it is', () => {
  const p = PACKS[0]!

  expect(isReading(NO_READING)).toBe(false)
  expect(isReading(on({ nightOnly: true }))).toBe(false)
  expect(readableOf(p, NO_READING)).toBe(p)
  expect(readableOf(p, on({ nightOnly: true }))).toBe(p)
})

const EACH: Reading[] = [
  on({ colorblind: 'redgreen' }),
  on({ colorblind: 'blueyellow' }),
  on({ glare: 2 }),
  on({ night: 2 }),
  on({ muted: 2 }),
  on({ focus: 2 }),
]

perHalf('each option alone gives a palette the app accepts', t => {
  for (const r of EACH) {
    expect(accepted(readableOf(t, r)), `${t.name} ${JSON.stringify(r)}`).toBe(true)
  }
})

perHalf('every option at once is accepted', t => {
  expect(accepted(readableOf(t, on({ colorblind: 'redgreen', glare: 2, night: 2, muted: 2, focus: 2 }))), t.name).toBe(true)
})

// readableOf checks its own result against the app's full rules before returning it; a sample is checked again here.
test('the full app check agrees on a sample', () => {
  for (const t of [DARK[0]!, LIGHT[0]!]) {
    for (const r of EACH) {
      expect(validateTheme(readableOf(t, r)), `${t.name} ${JSON.stringify(r)}`).toBeNull()
    }
  }
})

// One test per theme. Muted and focus move together (0, 1, 2) so the grid is 54 combinations, each checked against the app's own rules.
for (const t of [DARK[0]!, DARK[5]!, LIGHT[0]!, LIGHT[4]!]) {
  test(`every combination of the options is accepted on ${t.name}`, () => {
    let n = 0

    for (const colorblind of ['off', 'redgreen', 'blueyellow'] as ColorBlind[]) {
      for (const glare of [0, 1, 2] as Level[]) {
        for (const night of [0, 2] as Level[]) {
          for (const both of [0, 1, 2] as Level[]) {
            const out = readableOf(t, on({ colorblind, glare, night, muted: both, focus: both }))

            expect(validateTheme(out), `${colorblind} ${glare}${night}${both}`).toBeNull()
            n++
          }
        }
      }
    }
    expect(n).toBe(54)
  })
}

perHalf('muted text is stronger against the surfaces, more so on Clear', t => {
  const a = worst(readableOf(t, on({ muted: 1 })).text[2], t)
  const b = worst(readableOf(t, on({ muted: 2 })).text[2], t)

  expect(a, t.name).toBeGreaterThanOrEqual(worst(t.text[2], t) - 0.001)
  expect(a, t.name).toBeGreaterThanOrEqual(4.4)
  expect(b, t.name).toBeGreaterThanOrEqual(a - 0.001)
})

perHalf('the accent reaches the contrast it was asked for, where the theme allows it', t => {
  const clear = readableOf(t, on({ focus: 1 }))
  const strong = readableOf(t, on({ focus: 2 }))

  expect(worst(clear.accent, clear), t.name).toBeGreaterThanOrEqual(Math.min(4.4, worst(t.accent, t)))
  expect(worst(strong.accent, strong), t.name).toBeGreaterThanOrEqual(worst(clear.accent, clear) - 0.001)
})

test('less glare dims the main text on dark themes and the whites on light ones', () => {
  for (const t of DARK) {
    expect(lum(readableOf(t, on({ glare: 2 })).text[0]), t.name).toBeLessThanOrEqual(lum(t.text[0]))
  }

  for (const t of LIGHT) {
    const out = readableOf(t, on({ glare: 2 }))

    expect(lum(out.surfaces[2]), t.name).toBeLessThanOrEqual(lum(t.surfaces[2]))
    expect(out.surfaces[2]).toBe(out.surfaces[3])
  }
})

perHalf('night comfort takes blue out of the page', t => {
  const [r0, , b0] = rgbOf(t.surfaces[0])
  const [r1, , b1] = rgbOf(readableOf(t, on({ night: 2 })).surfaces[0])

  // Blue relative to red does not grow.
  expect((b1 + 1) / (r1 + 1), t.name).toBeLessThanOrEqual((b0 + 1) / (r0 + 1) + 0.001)
})

const hueGap = (a: string, b: string) => {
  const d = Math.abs(hslOf(a)[0] - hslOf(b)[0])

  return Math.min(d, 360 - d)
}

perHalf('color-blind palettes keep danger and success far apart in hue', t => {
  const rg = readableOf(t, on({ colorblind: 'redgreen' }))

  expect(hueGap(rg.roles.danger, rg.roles.success), `${t.name} red-green hue`).toBeGreaterThan(100)

  const by = readableOf(t, on({ colorblind: 'blueyellow' }))

  expect(hueGap(by.roles.danger, by.roles.warning), `${t.name} blue-yellow`).toBeGreaterThan(15)
})

test('readableOf is deterministic and fast', () => {
  const r = on({ colorblind: 'redgreen', glare: 1, night: 1, muted: 1, focus: 1 })
  const start = Date.now()

  for (let i = 0; i < 20; i++) {
    expect(readableOf(PACKS[0]!, r)).toEqual(readableOf(PACKS[0]!, r))
  }
  expect(Date.now() - start).toBeLessThan(1500)
})
