import type { Theme } from './model.js'

// Themes that come in a dark and a light version share one name in the gallery ("GitHub"); the Dark and Light
// buttons pick the version. Pure: nothing here touches `$`.

/** [family name, dark theme id, light theme id]. */
export const PAIRS: [string, string, string][] = [
  ['Catppuccin', 'catppuccin-mocha', 'catppuccin-latte'],
  ['GitHub', 'github-dark', 'github-light'],
  ['Solarized', 'solarized-dark', 'solarized-light'],
  ['Gruvbox', 'gruvbox-dark', 'gruvbox-light'],
  ['One', 'one-dark', 'one-light'],
  ['Rosé Pine', 'rose-pine', 'rose-pine-dawn'],
  ['Tokyo Night', 'tokyo-night', 'tokyo-night-day'],
  ['Ayu', 'ayu-dark', 'ayu-light'],
  ['Everforest', 'everforest', 'everforest-light'],
  ['Night Owl', 'night-owl', 'night-owl-light'],
  ['Nightfox', 'nightfox', 'dayfox'],
  ['Kanagawa', 'kanagawa-dragon', 'kanagawa-lotus'],
]

const NAME_OF = new Map<string, string>()
const PARTNER_OF = new Map<string, string>()

for (const [name, dark, light] of PAIRS) {
  NAME_OF.set(dark, name)
  NAME_OF.set(light, name)
  PARTNER_OF.set(dark, light)
  PARTNER_OF.set(light, dark)
}

/** The name the gallery shows: the family name for a pair, else the theme's own name without a trailing "Light" or "Dark". Your own themes keep their names. */
export function displayName(t: Theme): string {
  const family = NAME_OF.get(t.id)

  if (family !== undefined) {
    return family
  }

  if (t.id.startsWith('my-')) {
    return t.name
  }

  return t.name.replace(/\s+(Light|Dark)$/i, '') || t.name
}

/** The same theme in the other mode, when it has one. */
export function counterpart(themes: Theme[], t: Theme): Theme | undefined {
  const id = PARTNER_OF.get(t.id)

  return id === undefined ? undefined : themes.find(x => x.id === id)
}

/** The version of a family in a mode (the theme itself when it already is that mode). */
export function inMode(themes: Theme[], t: Theme, mode: 'dark' | 'light'): Theme | undefined {
  if (t.mode === mode) {
    return t
  }

  return counterpart(themes, t)
}

const norm = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '')

/** The themes whose gallery name is `text` ("github", "Rosé Pine", "rose pine"): one or two, dark first. Empty when none. */
export function findFamily(themes: Theme[], text: string): Theme[] {
  const want = norm(text)

  if (want === '') {
    return []
  }

  return themes
    .filter(t => norm(displayName(t)) === want)
    .sort((a, b) => (a.mode === b.mode ? 0 : a.mode === 'dark' ? -1 : 1))
}

/** How many names the gallery shows. */
export const familyCount = (themes: Theme[]): number => new Set(themes.map(displayName)).size
