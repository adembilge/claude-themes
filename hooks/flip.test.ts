import { expect, test } from 'claude-code/testing'

import { ALT_SUFFIX, altLooks, flipTheme } from './flip.js'
import { contrast, lum, validateTheme } from './model.js'
import type { Theme } from './model.js'
import { PACKS } from './packs.js'

const sample = (mode: 'dark' | 'light'): Theme[] => PACKS.filter(p => p.mode === mode)

// Building a palette to check it takes a few milliseconds, so each test takes only a slice.
function slice(name: string, list: Theme[], check: (t: Theme) => void): void {
  const half = Math.ceil(list.length / 2)

  list.length === 0 ||
    [list.slice(0, half), list.slice(half)].forEach((part, i) => {
      test(`${name} (part ${i + 1})`, () => {
        for (const t of part) {
          check(t)
        }
      })
    })
}

slice('a dark theme gets a light look the app accepts', sample('dark'), t => {
  const flipped = flipTheme(t)

  expect(flipped, t.name).toBeDefined()
  expect(validateTheme(flipped!), t.name).toBeNull()
  expect(flipped!.mode).toBe('light')
  expect(flipped!.id).toBe(`${t.id}${ALT_SUFFIX}`)
  expect(flipped!.name).toBe(t.name)
})

slice('a light theme gets a dark look the app accepts', sample('light'), t => {
  const flipped = flipTheme(t)

  expect(flipped, t.name).toBeDefined()
  expect(validateTheme(flipped!), t.name).toBeNull()
  expect(flipped!.mode).toBe('dark')
})

test('the made look is really the other way round', () => {
  for (const t of PACKS.slice(0, 6)) {
    const f = flipTheme(t)!

    if (t.mode === 'dark') {
      expect(lum(f.surfaces[0]), t.name).toBeGreaterThan(lum(t.surfaces[0]))
      expect(lum(f.text[0]), t.name).toBeLessThan(lum(t.text[0]))
    } else {
      expect(lum(f.surfaces[0]), t.name).toBeLessThan(lum(t.surfaces[0]))
      expect(lum(f.text[0]), t.name).toBeGreaterThan(lum(t.text[0]))
    }
    expect(contrast(f.text[0], f.surfaces[0]), t.name).toBeGreaterThanOrEqual(4.5)
  }
})

test('the accent keeps its hue family', () => {
  const t = PACKS.find(p => p.mode === 'dark')!
  const f = flipTheme(t)!

  expect(f.accent).not.toBe(t.accent)
  expect(contrast(f.accent, f.surfaces[0])).toBeGreaterThanOrEqual(3)
})

test('flipping twice gives a valid theme again', () => {
  const t = PACKS[0]!
  const back = flipTheme(flipTheme(t)!)!

  expect(back.mode).toBe(t.mode)
  expect(validateTheme(back)).toBeNull()
})

test('altLooks skips themes that already have a pair', () => {
  const one = PACKS[0]!
  const two = PACKS[1]!
  const made = altLooks([one, two], t => t.id === one.id)

  expect(made.map(t => t.id)).toEqual([`${two.id}${ALT_SUFFIX}`])
})

test('a palette that is not hex is left alone', () => {
  const bad = { ...PACKS[0]!, accent: 'nope' } as Theme

  // Never throws: there is nothing to turn over.
  const out = flipTheme(bad)

  expect(out).toBeUndefined()
})
