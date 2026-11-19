import { expect, test } from 'claude-code/testing'

import { PAIRS, counterpart, displayName, familyCount, findFamily, inMode } from './families.js'
import type { Theme } from './model.js'
import { PACKS } from './packs.js'

// The built-in themes live in register.tsx; their ids are listed here.
const BUILTIN_IDS = [
  'catppuccin-mocha', 'espresso', 'dracula', 'nord', 'tokyo-night', 'gruvbox-dark', 'one-dark', 'rose-pine',
  'solarized-dark', 'github-dark', 'monokai', 'ayu-dark', 'everforest', 'material-ocean',
  'synthwave', 'absolutely', 'linear', 'lobster', 'matrix', 'night-owl', 'og', 'oscurange', 'raycast',
  'sentry', 'temple', 'vercel', 'vscode-plus', 'catppuccin-latte', 'github-light', 'solarized-light',
  'rose-pine-dawn', 'gruvbox-light', 'tokyo-night-day', 'one-light', 'ayu-light', 'everforest-light',
  'notion', 'xcode',
]

const fake = (id: string, name: string, mode: 'dark' | 'light'): Theme => ({
  id,
  name,
  note: '',
  mode,
  surfaces: ['#000000', '#111111', '#222222', '#333333'],
  text: ['#ffffff', '#dddddd', '#bbbbbb'],
  accent: '#3b82f6',
  roles: { danger: '#ff0000', success: '#00ff00', warning: '#ffff00', pro: '#ff00ff' },
})

const ALL_IDS = new Set([...BUILTIN_IDS, ...PACKS.map(p => p.id)])

test('every id in the pair table is a real theme, in the right mode', () => {
  const byMode = new Map<string, string>(PACKS.map(p => [p.id, p.mode]))

  for (const [name, dark, light] of PAIRS) {
    expect(ALL_IDS.has(dark), `${name}: ${dark}`).toBe(true)
    expect(ALL_IDS.has(light), `${name}: ${light}`).toBe(true)

    if (byMode.has(dark)) {
      expect(byMode.get(dark), dark).toBe('dark')
    }

    if (byMode.has(light)) {
      expect(byMode.get(light), light).toBe('light')
    }
  }
})

test('no theme is in two pairs', () => {
  const ids = PAIRS.flatMap(([, d, l]) => [d, l])

  expect(new Set(ids).size).toBe(ids.length)
})

test('a pair shows one name, and the other mode is found', () => {
  const dark = fake('github-dark', 'GitHub Dark', 'dark')
  const light = fake('github-light', 'GitHub Light', 'light')
  const all = [dark, light]

  expect(displayName(dark)).toBe('GitHub')
  expect(displayName(light)).toBe('GitHub')
  expect(counterpart(all, dark)).toBe(light)
  expect(counterpart(all, light)).toBe(dark)
  expect(inMode(all, dark, 'light')).toBe(light)
  expect(inMode(all, dark, 'dark')).toBe(dark)
})

test('a theme with one mode keeps its name, minus a trailing Light or Dark', () => {
  const dracula = fake('dracula', 'Dracula', 'dark')
  const oceanic = fake('oceanic-next-light', 'Oceanic Next Light', 'light')
  const dimmed = fake('x-dark', 'Some Dark', 'dark')

  expect(displayName(dracula)).toBe('Dracula')
  expect(displayName(oceanic)).toBe('Oceanic Next')
  expect(displayName(dimmed)).toBe('Some')
  expect(counterpart([dracula], dracula)).toBeUndefined()
  expect(inMode([dracula], dracula, 'light')).toBeUndefined()
})

test('your own themes keep their names exactly', () => {
  const mine = fake('my-night-light', 'Night Light', 'light')

  expect(displayName(mine)).toBe('Night Light')
})

test('a pair whose partner is missing still works', () => {
  const dark = fake('github-dark', 'GitHub Dark', 'dark')

  expect(counterpart([dark], dark)).toBeUndefined()
})

test('no gallery name says Light or Dark, and no two themes of one mode share a name', () => {
  const all = [...BUILTIN_IDS.map(id => fake(id, id, id.includes('light') || ['notion', 'xcode', 'rose-pine-dawn', 'tokyo-night-day', 'github-light', 'catppuccin-latte'].includes(id) ? 'light' : 'dark')), ...PACKS]
  const named = new Map<string, number>()

  for (const t of PACKS) {
    expect(displayName(t), t.id).not.toMatch(/\b(light|dark)\b/i)
  }

  for (const t of all) {
    const key = `${t.mode}:${displayName(t)}`

    named.set(key, (named.get(key) ?? 0) + 1)
  }

  for (const [key, n] of named) {
    expect(n, key).toBe(1)
  }
})

test('findFamily takes names however they are typed', () => {
  const a = fake('github-dark', 'GitHub Dark', 'dark')
  const b = fake('github-light', 'GitHub Light', 'light')
  const c = fake('rose-pine', 'Rosé Pine', 'dark')
  const all = [b, a, c]

  expect(findFamily(all, 'github').map(t => t.id)).toEqual(['github-dark', 'github-light'])
  expect(findFamily(all, ' GITHUB ').length).toBe(2)
  expect(findFamily(all, 'rose pine').map(t => t.id)).toEqual(['rose-pine'])
  expect(findFamily(all, 'Rosé-Pine').length).toBe(1)
  expect(findFamily(all, 'nope')).toEqual([])
  expect(findFamily(all, '')).toEqual([])
})

test('familyCount counts names, not variants', () => {
  const all = [fake('github-dark', 'GitHub Dark', 'dark'), fake('github-light', 'GitHub Light', 'light'), fake('dracula', 'Dracula', 'dark')]

  expect(familyCount(all)).toBe(2)
})
