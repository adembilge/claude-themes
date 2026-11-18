import { expect, test } from 'claude-code/testing'

import { lum, validateTheme } from './model.js'
import { PACK_CODE_THEMES, PACKS } from './packs.js'

// The built-in theme ids in register.tsx (the sandbox cannot read files, so they are listed here; add new
// built-ins to this list). The first tests below read it only to catch a pack that reuses one.
const BUILTIN_IDS = [
  'catppuccin-mocha', 'espresso', 'dracula', 'nord', 'tokyo-night', 'gruvbox-dark', 'one-dark', 'rose-pine',
  'solarized-dark', 'github-dark', 'monokai', 'ayu-dark', 'everforest', 'material-ocean', 'kanagawa-wave',
  'synthwave', 'absolutely', 'linear', 'lobster', 'matrix', 'night-owl', 'og', 'oscurange', 'raycast',
  'sentry', 'temple', 'vercel', 'vscode-plus', 'catppuccin-latte', 'github-light', 'solarized-light',
  'rose-pine-dawn', 'gruvbox-light', 'tokyo-night-day', 'one-light', 'ayu-light', 'everforest-light',
  'notion', 'xcode',
]

async function builtinIds(): Promise<string[]> {
  return BUILTIN_IDS
}

test('there are about twenty-five new packs', async () => {
  expect(PACKS.length >= 20).toBe(true)
  expect(PACKS.length <= 35).toBe(true)
})

test('every pack passes the palette check', async () => {
  for (const t of PACKS) {
    expect(`${t.id}: ${validateTheme(t)}`).toBe(`${t.id}: null`)
  }
})

test('pack ids are lowercase-hyphen and unique', async () => {
  const ids = PACKS.map(t => t.id)

  expect(new Set(ids).size).toBe(ids.length)

  for (const id of ids) {
    expect(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)).toBe(true)
  }
})

test('pack ids do not collide with the built-in themes', async () => {
  const builtin = await builtinIds()

  expect(builtin.length > 20).toBe(true)

  for (const t of PACKS) {
    expect(`${t.id}: ${builtin.includes(t.id)}`).toBe(`${t.id}: false`)
  }
})

test('each pack has a family and a short note', async () => {
  for (const t of PACKS) {
    expect(typeof t.family === 'string' && t.family.trim() !== '').toBe(true)
    expect(t.note.trim() !== '').toBe(true)
    expect(`${t.id}: ${t.note.length <= 40}`).toBe(`${t.id}: true`)
    expect(t.name.length <= 24).toBe(true)
  }
})

test('dark packs get lighter from the page to the menu, light ones end on one color', async () => {
  for (const t of PACKS) {
    expect(t.mode === 'dark' || t.mode === 'light').toBe(true)
    const [a, b, c, d] = t.surfaces.map(lum) as [number, number, number, number]

    expect(`${t.id}: ${a < b && b < c}`).toBe(`${t.id}: true`)

    if (t.mode === 'dark') {
      expect(`${t.id}: ${c < d}`).toBe(`${t.id}: true`)
    } else {
      expect(`${t.id}: ${t.surfaces[2] === t.surfaces[3]}`).toBe(`${t.id}: true`)
    }
  }
})

test('both modes are offered', async () => {
  expect(PACKS.some(t => t.mode === 'dark')).toBe(true)
  expect(PACKS.some(t => t.mode === 'light')).toBe(true)
})

test('PACK_CODE_THEMES only names packs', async () => {
  const ids = new Set(PACKS.map(t => t.id))

  for (const [id, name] of Object.entries(PACK_CODE_THEMES)) {
    expect(`${id}: ${ids.has(id)}`).toBe(`${id}: true`)
    expect(name.trim() !== '').toBe(true)
  }
})
