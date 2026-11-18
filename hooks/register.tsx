import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'

const STORE_KEY = 'theme'
const DEFAULT_THEME = 'espresso'

type Palette = {
  id: string
  name: string
  note: string
  surfaces: [string, string, string, string]
  text: [string, string, string]
  roles: { accent: string; danger: string; success: string; warning: string; pro: string }
}

const PALETTES: Palette[] = [
  {
    id: 'espresso',
    name: 'Espresso',
    note: 'near-black brown, amber',
    surfaces: ['#17110d', '#1f1712', '#281e17', '#2d221a'],
    text: ['#f1e6da', '#cfbfae', '#a8978a'],
    roles: { accent: '#d98a4e', danger: '#c2453a', success: '#6b9a4d', warning: '#c99a2e', pro: '#9b78b8' },
  },
  {
    id: 'walnut',
    name: 'Walnut',
    note: 'medium warm brown, terracotta',
    surfaces: ['#1d1612', '#261d17', '#30251d', '#352a21'],
    text: ['#f0e4d4', '#cbb9a3', '#a3917d'],
    roles: { accent: '#c47a52', danger: '#bf4a3d', success: '#6f9a55', warning: '#c4952e', pro: '#977bb5' },
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    note: 'warm charcoal, clay orange',
    surfaces: ['#1c1816', '#252019', '#2e2822', '#36302a'],
    text: ['#f2e9e0', '#d0c4b8', '#ab9e91'],
    roles: { accent: '#c4623a', danger: '#b8323a', success: '#4f8a4b', warning: '#b8860b', pro: '#7a5fa8' },
  },
  {
    id: 'mocha-rose',
    name: 'Mocha rose',
    note: 'reddish brown, dusty rose',
    surfaces: ['#1b1415', '#251b1c', '#2f2324', '#35282a'],
    text: ['#f3e5e0', '#d1bab5', '#a99591'],
    roles: { accent: '#cf7d70', danger: '#c4403f', success: '#73986a', warning: '#c79a4a', pro: '#a07cb4' },
  },
  {
    id: 'coffee-olive',
    name: 'Coffee olive',
    note: 'greenish brown, gold',
    surfaces: ['#1a1710', '#231f15', '#2d281b', '#332e20'],
    text: ['#efe8d2', '#c9c1a6', '#a29a80'],
    roles: { accent: '#c09a4a', danger: '#bf4a3a', success: '#7f9f4b', warning: '#cda23a', pro: '#9a7cb0' },
  },
  {
    id: 'chestnut-ember',
    name: 'Chestnut ember',
    note: 'deep red brown, copper',
    surfaces: ['#1a0f0c', '#231612', '#2d1d17', '#33211a'],
    text: ['#f4e4d8', '#d2bba9', '#a8917f'],
    roles: { accent: '#d2703f', danger: '#c8403a', success: '#6e9650', warning: '#d09a30', pro: '#a07ab8' },
  },
]

function look(p: Palette): ThemeSetArgs {
  const { theme } = makeColors({
    label: p.name,
    only: 'dark',
    roles: p.roles,
    dark: {
      gray: {
        anchors: {
          'surface-0': p.surfaces[0],
          'surface-1': p.surfaces[1],
          'surface-2': p.surfaces[2],
          'surface-3': p.surfaces[3],
          'text-primary': p.text[0],
          'text-secondary': p.text[1],
          'text-muted': p.text[2],
        },
      },
    },
  })

  return { colors: theme }
}

const LOOKS = new Map<string, ThemeSetArgs>(PALETTES.map(p => [p.id, look(p)]))

// "Mocha rose", "mocha_rose" and "mocha-rose" all name the same theme.
const idOf = (text: string): string => text.trim().toLowerCase().replace(/[\s_]+/g, '-')

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const saved = await $.store.get(STORE_KEY)
    const id = typeof saved === 'string' && LOOKS.has(saved) ? saved : DEFAULT_THEME
    const chosen = LOOKS.get(id)

    if (chosen !== undefined) {
      const set = await $.theme.set(chosen)

      if (!set.isDrawn) {
        $.ui.status(set.reason)
      }
    }

    await $.command.register({
      name: 'themes',
      description: 'Pick a brown theme: /themes lists them, /themes <name> switches',
    })

    return next(e)
  })

  on('command.run', { command: 'themes' }, async ($, e) => {
    const want = idOf(e.args)

    if (want === '') {
      const saved = await $.store.get(STORE_KEY)
      const now = typeof saved === 'string' && LOOKS.has(saved) ? saved : DEFAULT_THEME
      const lines = PALETTES.map(p => `${p.id === now ? '*' : ' '} ${p.id.padEnd(15)}${p.note}`)

      return { text: ['Themes (* is current). Switch with /themes <name>:', ...lines].join('\n') }
    }
    const picked = LOOKS.get(want)

    if (picked === undefined) {
      return { text: `No theme called "${e.args.trim()}". Try: ${PALETTES.map(p => p.id).join(', ')}` }
    }
    await $.theme.set(picked)
    await $.store.set(STORE_KEY, want)

    return { text: `Theme: ${want}` }
  })
}
