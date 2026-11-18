import { expect, test } from 'claude-code/testing'

import { lum, rgbOf, validateTheme } from './model.js'
import type { Theme } from './model.js'
import { PACKS } from './packs.js'
import { NO_READING, cleanReading, isReading, readableOf } from './readable.js'
import type { Level, Reading } from './readable.js'
import { accepted } from './tune.js'

const DARK = PACKS.filter(p => p.mode === 'dark')
const LIGHT = PACKS.filter(p => p.mode === 'light')
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

test('cleanReading makes anything safe, and ignores options that were removed', () => {
  expect(cleanReading(undefined)).toEqual(NO_READING)
  expect(cleanReading('x')).toEqual(NO_READING)
  expect(cleanReading([])).toEqual(NO_READING)
  expect(cleanReading({ glare: 7, night: -1, nightOnly: 1 })).toEqual(NO_READING)
  expect(cleanReading({ glare: 2, night: 1, nightOnly: true })).toEqual({ glare: 2, night: 1, nightOnly: true })
  // Saved by an earlier version: only glare and night are kept.
  expect(cleanReading({ colorblind: 'redgreen', muted: 2, focus: 2, glare: 1 })).toEqual(on({ glare: 1 }))
})

test('with nothing on, the theme comes back as it is', () => {
  const p = PACKS[0]!

  expect(isReading(NO_READING)).toBe(false)
  expect(isReading(on({ nightOnly: true }))).toBe(false)
  expect(readableOf(p, NO_READING)).toBe(p)
  expect(readableOf(p, on({ nightOnly: true }))).toBe(p)
})

const EACH: Reading[] = [on({ glare: 1 }), on({ glare: 2 }), on({ night: 1 }), on({ night: 2 }), on({ glare: 2, night: 2 })]

perHalf('each option and the two together give a palette the app accepts', t => {
  for (const r of EACH) {
    expect(accepted(readableOf(t, r)), `${t.name} ${JSON.stringify(r)}`).toBe(true)
  }
})

// readableOf checks its own result against the app's full rules before returning it; a sample is checked again here.
test('the full app check agrees on a sample', () => {
  for (const t of [DARK[0]!, LIGHT[0]!]) {
    for (const r of EACH) {
      expect(validateTheme(readableOf(t, r)), `${t.name} ${JSON.stringify(r)}`).toBeNull()
    }
  }
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

test('every level pair is accepted on a dark and a light theme', () => {
  for (const t of [DARK[3]!, LIGHT[3]!]) {
    for (const glare of [0, 1, 2] as Level[]) {
      for (const night of [0, 1, 2] as Level[]) {
        expect(validateTheme(readableOf(t, on({ glare, night }))), `${t.name} ${glare}${night}`).toBeNull()
      }
    }
  }
})

test('readableOf is deterministic and fast', () => {
  const r = on({ glare: 1, night: 1 })
  const start = Date.now()

  for (let i = 0; i < 20; i++) {
    expect(readableOf(PACKS[0]!, r)).toEqual(readableOf(PACKS[0]!, r))
  }
  expect(Date.now() - start).toBeLessThan(1500)
})
