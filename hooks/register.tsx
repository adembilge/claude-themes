import { atom, read, update } from 'claude-code'
import type { Register, ThemeSetArgs } from 'claude-code'

import { EXPORTS, exportFileName, exportTheme, formatOf } from './export.js'
import type { ExportFormat } from './export.js'
import { listVsCodeThemes, parseVsCode, vsCodeExtensionRoots } from './import.js'
import {
  cleanName,
  contrast,
  fixTheme,
  hslHex,
  hueOf,
  isHex,
  look,
  lookPair,
  mix,
  sanitizeTheme,
  slug,
  themeToCode,
  validateTheme,
} from './model.js'
import type { Mode, Roles, Surfaces, Text3, Theme } from './model.js'
import { PACKS, PACK_CODE_THEMES } from './packs.js'
import {
  NO_READING,
  cleanReading,
  readableOf,
} from './readable.js'
import type { Reading } from './readable.js'
import { SHARE_URL, parseAny, themeToLink } from './share.js'
import { NO_TUNE, TUNE_AXES, TUNE_MAX, cleanTunes, isTuned, tuneTheme } from './tune.js'
import type { Tune } from './tune.js'
import { readThemeFile } from './terminal.js'

const PANE = 'desktop-themes'
const REPO_URL = 'https://github.com/adembilge/claude-themes'
const STORE_KEY = 'theme'
const DEFAULT_THEME = 'catppuccin-mocha'

function theme(
  mode: Mode,
  id: string,
  name: string,
  note: string,
  surfaces: Surfaces,
  text: Text3,
  accent: string,
  [danger, success, warning, pro]: [string, string, string, string],
): Theme {
  return { id, name, note, mode, surfaces, text, accent, roles: { danger, success, warning, pro } }
}

const BASE_THEMES: Theme[] = [
  // ---- dark ----
  theme('dark', 'catppuccin-mocha', 'Catppuccin Mocha', 'soft pastels on warm charcoal',
    ['#181825', '#1e1e2e', '#313244', '#3d3f51'], ['#cdd6f4', '#bac2de', '#a6adc8'], '#cba6f7',
    ['#f38ba8', '#a6e3a1', '#f9e2af', '#b4befe']),
  theme('dark', 'espresso', 'Espresso', 'near-black brown, amber',
    ['#17110d', '#1f1712', '#281e17', '#2d221a'], ['#f1e6da', '#cfbfae', '#a8978a'], '#d98a4e',
    ['#c2453a', '#6b9a4d', '#c99a2e', '#9b78b8']),
  theme('dark', 'dracula', 'Dracula', 'purple and pink on charcoal',
    ['#21222c', '#282a36', '#343746', '#3c3f50'], ['#f8f8f2', '#d6d8e4', '#9aa3d0'], '#bd93f9',
    ['#ff5555', '#50fa7b', '#ffb86c', '#ff79c6']),
  theme('dark', 'nord', 'Nord', 'arctic blue-grey, frost',
    ['#242933', '#2e3440', '#383f4e', '#383f4e'], ['#eceff4', '#d8dee9', '#9aa5b8'], '#88c0d0',
    ['#bf616a', '#a3be8c', '#ebcb8b', '#b48ead']),
  theme('dark', 'tokyo-night', 'Tokyo Night', 'deep navy, electric blue',
    ['#16161e', '#1a1b26', '#24283b', '#292e42'], ['#c0caf5', '#a9b1d6', '#7f89b8'], '#7aa2f7',
    ['#f7768e', '#9ece6a', '#e0af68', '#bb9af7']),
  theme('dark', 'gruvbox-dark', 'Gruvbox Dark', 'retro warm, earthy',
    ['#1d2021', '#282828', '#3c3836', '#423d3b'], ['#ebdbb2', '#d5c4a1', '#b0a089'], '#fe8019',
    ['#fb4934', '#b8bb26', '#fabd2f', '#d3869b']),
  theme('dark', 'one-dark', 'One Dark', 'the Atom classic',
    ['#21252b', '#282c34', '#2c313a', '#3a3f4b'], ['#d7dae0', '#abb2bf', '#9ba2b0'], '#61afef',
    ['#e06c75', '#98c379', '#e5c07b', '#c678dd']),
  theme('dark', 'rose-pine', 'Rosé Pine', 'muted rose and gold, quiet',
    ['#191724', '#1f1d2e', '#26233a', '#3d3a50'], ['#e0def4', '#b9b5d3', '#9e9ab8'], '#ebbcba',
    ['#eb6f92', '#9ccfd8', '#f6c177', '#c4a7e7']),
  theme('dark', 'solarized-dark', 'Solarized Dark', 'teal-black, calibrated contrast',
    ['#00212b', '#002b36', '#073642', '#0d4350'], ['#eee8d5', '#93a1a1', '#93a1a1'], '#2aa198',
    ['#dc322f', '#859900', '#b58900', '#6c71c4']),
  theme('dark', 'github-dark', 'GitHub Dark', 'neutral blue-black, clean',
    ['#010409', '#0d1117', '#161b22', '#21262d'], ['#e6edf3', '#c9d1d9', '#8b949e'], '#58a6ff',
    ['#f85149', '#3fb950', '#d29922', '#bc8cff']),
  theme('dark', 'monokai', 'Monokai', 'vivid on olive charcoal',
    ['#1e1f1c', '#272822', '#34352e', '#3e3d32'], ['#f8f8f2', '#cfcfc2', '#a59f85'], '#a6e22e',
    ['#f92672', '#a6e22e', '#e6db74', '#ae81ff']),
  theme('dark', 'ayu-dark', 'Ayu Dark', 'ink black with warm amber',
    ['#06080c', '#0b0e14', '#131721', '#1c212e'], ['#bfbdb6', '#9a9892', '#8a8984'], '#e6b450',
    ['#f07178', '#aad94c', '#ffb454', '#d2a6ff']),
  theme('dark', 'everforest', 'Everforest', 'soft forest greens',
    ['#232a2e', '#2d353b', '#343f44', '#3d484d'], ['#d3c6aa', '#b5ab93', '#9da9a0'], '#a7c080',
    ['#e67e80', '#a7c080', '#dbbc7f', '#d699b6']),
  theme('dark', 'material-ocean', 'Material Ocean', 'deep navy, soft blue',
    ['#090b10', '#0f111a', '#1a1c25', '#292d3e'], ['#eeffff', '#b0bec5', '#8f93a2'], '#82aaff',
    ['#f07178', '#c3e88d', '#ffcb6b', '#c792ea']),
  theme('dark', 'synthwave', 'Synthwave', 'neon pink on midnight purple',
    ['#1a1726', '#262335', '#34294f', '#3d3361'], ['#ffffff', '#d9d4ee', '#a59fc9'], '#ff7edb',
    ['#fe4450', '#72f1b8', '#fede5d', '#b893ce']),
  theme('dark', 'absolutely', 'Absolutely', 'black, white, yellow',
    ['#000000', '#0a0a0a', '#141414', '#1e1e1e'], ['#ffffff', '#e0e0e0', '#b0b0b0'], '#ffd60a',
    ['#ff453a', '#32d74b', '#ffd60a', '#bf5af2']),
  theme('dark', 'linear', 'Linear', 'near-black with indigo',
    ['#08090a', '#0f1011', '#17181a', '#1f2023'], ['#f7f8f8', '#d0d6e0', '#8a8f98'], '#5e6ad2',
    ['#eb5757', '#4cb782', '#f2c94c', '#bb87fc']),
  theme('dark', 'lobster', 'Lobster', 'deep maroon with coral red',
    ['#140b0b', '#1c1010', '#271717', '#321e1e'], ['#f6e4e1', '#d8b9b4', '#ad8f8b'], '#ff5a4d',
    ['#ff5a4d', '#6bbf7a', '#f0b04a', '#d98ad1']),
  theme('dark', 'matrix', 'Matrix', 'black with phosphor green',
    ['#000a03', '#03110a', '#071c10', '#0c2717'], ['#d4ffe0', '#8ff0ac', '#5fb87a'], '#00ff66',
    ['#ff4d4d', '#00ff66', '#d9e84a', '#5de6d0']),
  theme('dark', 'night-owl', 'Night Owl', 'deep navy for late nights',
    ['#010e1a', '#011627', '#0b2942', '#12304f'], ['#d6deeb', '#aab6cc', '#8195b2'], '#7fdbca',
    ['#ef5350', '#addb67', '#ffcb8b', '#c792ea']),
  theme('dark', 'og', 'OG', 'neutral graphite, green accent',
    ['#0d0d0d', '#161616', '#212121', '#2b2b2b'], ['#ececec', '#c4c4c4', '#9a9a9a'], '#10a37f',
    ['#ef4444', '#10a37f', '#f59e0b', '#a78bfa']),
  theme('dark', 'oscurange', 'Oscurange', 'dark brown-black with orange',
    ['#0e0b09', '#171210', '#221a16', '#2d231d'], ['#f4e8de', '#d1bfb0', '#a89686'], '#ff8a3d',
    ['#f0563e', '#8fbf5a', '#ffb347', '#c490d1']),
  theme('dark', 'raycast', 'Raycast', 'smoky black with red',
    ['#101010', '#1a1a1a', '#252525', '#303030'], ['#f9f9f9', '#c9c9c9', '#9a9a9a'], '#ff6363',
    ['#ff6363', '#5fc992', '#ffbc33', '#cf2f98']),
  theme('dark', 'sentry', 'Sentry', 'aubergine and violet',
    ['#150d1d', '#1d1127', '#2a1b37', '#362447'], ['#ebe6ef', '#c4b9d0', '#9a8dab'], '#9b8cf0',
    ['#fa6e6e', '#7ec26a', '#ffd466', '#c09bff']),
  theme('dark', 'temple', 'Temple', 'old stone and gold leaf',
    ['#13100c', '#1b1710', '#262017', '#312a1f'], ['#f0e6d2', '#cdbf9f', '#a39677'], '#d4a64a',
    ['#c9553f', '#7ea05a', '#d4a64a', '#a98bc4']),
  theme('dark', 'vercel', 'Vercel', 'black and white, electric blue',
    ['#000000', '#0a0a0a', '#141414', '#1f1f1f'], ['#ededed', '#bdbdbd', '#8f8f8f'], '#52a8ff',
    ['#ff4d4d', '#46a758', '#f5a623', '#bf7af0']),
  theme('dark', 'vscode-plus', 'VS Code Plus', 'the editor classic, Dark+',
    ['#181818', '#1e1e1e', '#252526', '#2d2d30'], ['#d4d4d4', '#b8b8b8', '#8c8c8c'], '#569cd6',
    ['#f48771', '#6a9955', '#dcdcaa', '#c586c0']),
  // ---- light ----
  theme('light', 'catppuccin-latte', 'Catppuccin Latte', 'soft pastels on cream',
    ['#dce0e8', '#e6e9ef', '#eff1f5', '#eff1f5'], ['#4c4f69', '#5c5f77', '#6c6f85'], '#8839ef',
    ['#d20f39', '#40a02b', '#df8e1d', '#1e66f5']),
  theme('light', 'github-light', 'GitHub Light', 'crisp white, familiar blue',
    ['#eaeef2', '#f6f8fa', '#ffffff', '#ffffff'], ['#1f2328', '#424a53', '#656d76'], '#0969da',
    ['#cf222e', '#1a7f37', '#9a6700', '#8250df']),
  theme('light', 'solarized-light', 'Solarized Light', 'warm cream',
    ['#eee8d5', '#f5efdc', '#fdf6e3', '#fdf6e3'], ['#073642', '#586e75', '#6b7f86'], '#268bd2',
    ['#dc322f', '#7a8a00', '#b58900', '#6c71c4']),
  theme('light', 'rose-pine-dawn', 'Rosé Pine Dawn', 'morning rose on warm paper',
    ['#f2e9e1', '#faf4ed', '#fffaf3', '#fffaf3'], ['#575279', '#6e6a86', '#797593'], '#b4637a',
    ['#b4637a', '#56949f', '#ea9d34', '#907aa9']),
  theme('light', 'gruvbox-light', 'Gruvbox Light', 'retro warm, sepia paper',
    ['#ebdbb2', '#f2e5bc', '#fbf1c7', '#fbf1c7'], ['#3c3836', '#504945', '#7c6f64'], '#d65d0e',
    ['#cc241d', '#79740e', '#d79921', '#b16286']),
  theme('light', 'tokyo-night-day', 'Tokyo Night Day', 'cool lavender-white, blue',
    ['#d0d5e3', '#e1e2e7', '#eef0f6', '#eef0f6'], ['#343b58', '#4c5576', '#6a6f8e'], '#2e7de9',
    ['#f52a65', '#587539', '#8c6c3e', '#9854f1']),
  theme('light', 'one-light', 'One Light', 'the Atom classic, bright',
    ['#e5e5e6', '#f0f0f1', '#fafafa', '#fafafa'], ['#383a42', '#4b4e57', '#696c77'], '#4078f2',
    ['#e45649', '#50a14f', '#c18401', '#a626a4']),
  theme('light', 'ayu-light', 'Ayu Light', 'clean white with warm orange',
    ['#e7e8ea', '#f3f4f5', '#fafafa', '#fafafa'], ['#5c6166', '#6b7077', '#787b80'], '#ff9940',
    ['#f07171', '#86b300', '#f2ae49', '#a37acc']),
  theme('light', 'everforest-light', 'Everforest Light', 'cream and moss',
    ['#efebd4', '#f4f0d9', '#fdf6e3', '#fdf6e3'], ['#4f5b58', '#5f6c68', '#6e7a70'], '#8da101',
    ['#f85552', '#8da101', '#dfa000', '#df69ba']),
  theme('light', 'notion', 'Notion', 'warm white paper, ink text',
    ['#efefed', '#f7f6f3', '#ffffff', '#ffffff'], ['#37352f', '#5a5852', '#787774'], '#2383e2',
    ['#eb5757', '#448361', '#cb912f', '#9065b0']),
  theme('light', 'xcode', 'Xcode', 'clean light editor, system blue',
    ['#e8e8e8', '#f2f2f2', '#ffffff', '#ffffff'], ['#262626', '#4d4d4d', '#6e6e6e'], '#0b6bcb',
    ['#d12f1b', '#1f8a50', '#a36b00', '#9b2393']),
]

/** The built-ins: the hand-set themes and the packs. */
const THEMES: Theme[] = [...BASE_THEMES, ...PACKS]

const BY_ID = new Map(THEMES.map(t => [t.id, t]))
const DEFAULT = (BY_ID.get(DEFAULT_THEME) ?? THEMES[0])!

const GROUPS: { mode: Mode; title: string }[] = [
  { mode: 'dark', title: '☾ Dark themes' },
  { mode: 'light', title: '☀ Light themes' },
]

const LOOKS = new Map<string, ThemeSetArgs>()

/** The colors of one theme. Built-ins are made once and kept; a custom theme is made fresh, since its id can be saved over. */
function lookFor(p: Theme): ThemeSetArgs {
  if (BY_ID.get(p.id) !== p) {
    return look(p)
  }
  const hit = LOOKS.get(p.id)

  if (hit !== undefined) {
    return hit
  }
  const made = look(p)

  LOOKS.set(p.id, made)

  return made
}

/** A theme by id: the built-ins first, then the person's own. */
function themeById(id: string, custom: Theme[]): Theme | undefined {
  return BY_ID.get(id) ?? custom.find(t => t.id === id)
}

// "Rosé Pine", "rose_pine" and "rose-pine" all name the same theme.
const idOf = (text: string): string =>
  text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s_]+/g, '-')

/**
 * The code-highlighting theme to pair with a theme, by the name the app's highlighter knows. A name it
 * does not offer is ignored by the app, which keeps its own, so a wrong guess costs nothing.
 */
const CODE_THEMES: Record<string, string> = {
  ...PACK_CODE_THEMES,
  'catppuccin-mocha': 'catppuccin-mocha',
  'catppuccin-latte': 'catppuccin-latte',
  dracula: 'dracula',
  nord: 'nord',
  'tokyo-night': 'tokyo-night',
  'gruvbox-dark': 'gruvbox-dark-medium',
  'gruvbox-light': 'gruvbox-light-medium',
  'one-dark': 'one-dark-pro',
  'one-light': 'one-light',
  'rose-pine': 'rose-pine',
  'rose-pine-dawn': 'rose-pine-dawn',
  'solarized-dark': 'solarized-dark',
  'solarized-light': 'solarized-light',
  'github-dark': 'github-dark',
  'github-light': 'github-light',
  monokai: 'monokai',
  'ayu-dark': 'ayu-dark',
  'ayu-light': 'ayu-light',
  everforest: 'everforest-dark',
  'everforest-light': 'everforest-light',
  'material-ocean': 'material-theme-ocean',
  synthwave: 'synthwave-84',
  'night-owl': 'night-owl',
  'vscode-plus': 'dark-plus',
  xcode: 'light-plus',
}

type AutoCfg = { on: boolean; day: string; night: string; from: number; to: number }

const DEFAULT_AUTO: AutoCfg = { on: false, day: 'github-light', night: DEFAULT_THEME, from: 7, to: 19 }

/** Day between `from` and `to` o'clock (it may wrap past midnight); equal hours mean always day. */
function periodOf(cfg: AutoCfg, hour: number): 'day' | 'night' {
  if (cfg.from === cfg.to) {
    return 'day'
  }

  return (cfg.from < cfg.to ? hour >= cfg.from && hour < cfg.to : hour >= cfg.from || hour < cfg.to) ? 'day' : 'night'
}

const MAX_PROJECTS = 50
const PROJECTS_KEY = 'projects'

/** A folder as one stable key: slashes forward, no trailing slash, lower case. */
const projectKey = (cwd: string): string => cwd.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()

type Strength = 'subtle' | 'normal' | 'bold'
type Tone = 'accent' | 'pro'

const STRENGTHS: { value: Strength; label: string; k: number }[] = [
  { value: 'subtle', label: 'Subtle', k: 0.6 },
  { value: 'normal', label: 'Normal', k: 1 },
  { value: 'bold', label: 'Bold', k: 1.7 },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ground = any

/** The tints a pattern is drawn in: blends of the darkest surface with the accent (or the second color). */
function tints(p: Theme, strength: Strength, tone: Tone) {
  const k = STRENGTHS.find(s => s.value === strength)?.k ?? 1
  const [s0, s1, s2] = p.surfaces
  const base = tone === 'pro' ? p.roles.pro : p.accent
  const other = tone === 'pro' ? p.accent : p.roles.pro
  const t = (x: number) => Math.min(0.7, x * k)

  return {
    s0,
    s1,
    s2,
    line: mix(s0, base, t(0.22)),
    soft: mix(s0, base, t(0.14)),
    alt: mix(s0, other, t(0.16)),
    lift: mix(s2, base, t(0.12)),
    faint: mix(s1, base, t(0.05)),
    warm: mix(s0, p.roles.warning, t(0.2)),
  }
}

type Make = (c: ReturnType<typeof tints>) => Ground

/** Smooth color fields only, no lines or shapes: each is a gradient the app draws by itself. */
const GROUNDS: { value: string; label: string; make: Make }[] = [
  { value: 'glow', label: 'Glow', make: c => ({ gradient: { shape: 'radial', stops: [{ at: 0, color: c.lift }, { at: 0.55, color: c.faint }, { at: 1, color: c.s0 }] } }) },
  { value: 'sunrise', label: 'Sunrise', make: c => ({ gradient: { angle: 0, stops: [{ at: 0, color: mix(c.s0, c.line, 0.9) }, { at: 0.5, color: c.faint }, { at: 1, color: c.s0 }] } }) },
  { value: 'spotlight', label: 'Spotlight', make: c => ({ gradient: { shape: 'radial', stops: [{ at: 0, color: mix(c.lift, c.line, 0.6) }, { at: 0.35, color: c.faint }, { at: 1, color: c.s0 }] } }) },
  { value: 'duotone', label: 'Duotone', make: c => ({ gradient: { angle: 135, stops: [{ at: 0, color: mix(c.s0, c.line, 0.9) }, { at: 0.5, color: c.s0 }, { at: 1, color: mix(c.s0, c.alt, 0.9) }] } }) },
  { value: 'vignette', label: 'Vignette', make: c => ({ gradient: { shape: 'radial', stops: [{ at: 0, color: c.lift }, { at: 0.6, color: c.s1 }, { at: 1, color: mix(c.s0, '#000000', 0.45) }] } }) },
  { value: 'dusk', label: 'Dusk', make: c => ({ gradient: { angle: 180, stops: [{ at: 0, color: c.line }, { at: 0.5, color: c.s0 }, { at: 1, color: c.alt }] } }) },
  { value: 'twilight', label: 'Twilight', make: c => ({ gradient: { angle: 180, stops: [{ at: 0, color: c.s0 }, { at: 0.6, color: c.faint }, { at: 0.85, color: c.alt }, { at: 1, color: c.s0 }] } }) },
  { value: 'ember', label: 'Ember', make: c => ({ gradient: { angle: 0, stops: [{ at: 0, color: c.warm }, { at: 0.35, color: c.soft }, { at: 1, color: c.s0 }] } }) },
  { value: 'halo', label: 'Halo', make: c => ({ gradient: { shape: 'radial', stops: [{ at: 0, color: c.s0 }, { at: 0.5, color: c.line }, { at: 1, color: c.s0 }] } }) },
]

type BackdropStyle = string

const groundFor = (p: Theme, style: string, strength: Strength, tone: Tone): Ground =>
  (GROUNDS.find(g => g.value === style) ?? GROUNDS[0]!).make(tints(p, strength, tone))

/** A small picture of a ground, for choosing among them: the same gradient the app is given, drawn as an Svg. */
function groundThumb(p: Theme, g: Ground, w: number, h: number): string {
  const head = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">`
  const bg = `<rect width="${w}" height="${h}" fill="${p.surfaces[0]}"/>`
  let art = ''

  if (g.gradient !== undefined) {
    const gr = g.gradient
    const stops = (gr.stops as (string | { at: number; color: string })[])
      .map((s, i, a) => `<stop offset="${typeof s === 'string' ? i / (a.length - 1) : s.at}" stop-color="${typeof s === 'string' ? s : s.color}"/>`)
      .join('')

    if (gr.shape === 'radial') {
      art = `<defs><radialGradient id="g" cx="0.5" cy="0.5" r="0.7">${stops}</radialGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/>`
    } else {
      const a = ((gr.angle ?? 180) * Math.PI) / 180
      const dx = Math.sin(a)
      const dy = -Math.cos(a)

      art = `<defs><linearGradient id="g" x1="${0.5 - dx / 2}" y1="${0.5 - dy / 2}" x2="${0.5 + dx / 2}" y2="${0.5 + dy / 2}">${stops}</linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/>`
    }
  }

  return `${head}${bg}${art}</svg>`
}

function cleanProjects(raw: unknown, known: Set<string>): Record<string, string> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return {}
  }
  const out: [string, string][] = []

  for (const [k, v] of Object.entries(raw)) {
    if (k !== '' && typeof v === 'string' && known.has(v)) {
      out.push([k, v])
    }
  }

  return Object.fromEntries(out.slice(-MAX_PROJECTS))
}

type Tab = 'dark' | 'light' | 'favorites' | 'maker' | 'appearance' | 'settings'

type Draft = { name: string; accent: string; mode: Mode }

type Found = { label: string; uiTheme: string; path: string }

type State = {
  id: string
  tab: Tab
  q: string
  favs: string[]
  backdrop: boolean
  highContrast: boolean
  codePair: boolean
  reading: Reading
  /** 'day' or 'night' as last applied for "only at night" comfort; not saved. */
  nightPeriod: string
  auto: AutoCfg
  autoPeriod: string
  backdropStyle: BackdropStyle
  strength: Strength
  tone: Tone
  cwd: string
  projects: Record<string, string>
  custom: Theme[]
  draft: Draft
  msg: string
  importText: string
  off: boolean
  confirm: string
  follow: boolean
  tunes: Record<string, Tune>
  found: Found[]
  foundQ: string
  scanMsg: string
}

type Prefs = {
  favs: string[]
  backdrop: boolean
  highContrast: boolean
  codePair: boolean
  reading: Reading
  auto: AutoCfg
  backdropStyle: BackdropStyle
  strength: Strength
  tone: Tone
  off: boolean
  follow: boolean
  tunes: Record<string, Tune>
}

const MAX_FAVS = 12
const PREFS_KEY = 'prefs'

// Change the tag if the value's shape changes: it declines what an earlier version stored.
const current = atom(
  { plugin: 'desktop-themes', key: 'current' } as const,
  {
    id: DEFAULT_THEME,
    tab: 'dark',
    q: '',
    favs: [],
    backdrop: true,
    highContrast: false,
    codePair: true,
    reading: NO_READING,
    nightPeriod: '',
    auto: DEFAULT_AUTO,
    autoPeriod: '',
    backdropStyle: 'glow',
    strength: 'normal',
    tone: 'accent',
    cwd: '',
    projects: {},
    custom: [],
    draft: { name: '', accent: '#d98a4e', mode: 'dark' },
    msg: '',
    importText: '',
    off: false,
    confirm: '',
    follow: false,
    tunes: {},
    found: [],
    foundQ: '',
    scanMsg: '',
  } as State,
  { shape: 'current-13' },
)

/** Known theme ids only, no repeats, at most `max`: anything else a saved value held is dropped. */
function cleanIds(value: unknown, max: number, known: Set<string>): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return [...new Set(value.filter((x): x is string => typeof x === 'string' && known.has(x)))].slice(0, max)
}

function cleanPrefs(raw: unknown, known: Set<string>): Prefs {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const a = (typeof r.auto === 'object' && r.auto !== null ? r.auto : {}) as Record<string, unknown>
  const hour = (v: unknown, d: number) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 23 ? v : d)
  const id = (v: unknown, d: string) => (typeof v === 'string' && known.has(v) ? v : d)

  return {
    favs: cleanIds(r.favs, MAX_FAVS, known),
    backdrop: r.backdrop !== false,
    highContrast: r.highContrast === true,
    codePair: r.codePair !== false,
    reading: cleanReading(r.reading),
    backdropStyle: GROUNDS.some(x => x.value === r.backdropStyle) ? (r.backdropStyle as BackdropStyle) : 'glow',
    strength: STRENGTHS.some(x => x.value === r.strength) ? (r.strength as Strength) : 'normal',
    // The backdrop color choice is gone: it always uses the accent.
    tone: 'accent',
    auto: {
      on: a.on === true,
      day: id(a.day, DEFAULT_AUTO.day),
      night: id(a.night, DEFAULT_AUTO.night),
      from: hour(a.from, DEFAULT_AUTO.from),
      to: hour(a.to, DEFAULT_AUTO.to),
    },
    off: r.off === true,
    follow: r.follow === true && a.on !== true,
    tunes: cleanTunes(r.tunes, known),
  }
}

/** The color `t` of the way from `a` to `b` now lives in model.ts. */

/**
 * A small drawing of the app in one theme: sidebar, a message, a code line, the input and Send.
 * `live` adds a slow pulse on Send; it only runs where the surface draws the Svg interactively.
 */
function previewSvg(p: Theme, live: boolean): string {
  const [s0, s1, s2, s3] = p.surfaces
  const [t0, t1, t2] = p.text
  const accent = p.accent
  const pulse = live ? '<animate attributeName="opacity" values="1;0.6;1" dur="2.6s" repeatCount="indefinite"/>' : ''

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="264" height="132" viewBox="0 0 264 132">',
    `<rect width="264" height="132" rx="10" fill="${s0}"/>`,
    `<rect width="64" height="132" rx="10" fill="${s1}"/><rect x="40" width="24" height="132" fill="${s1}"/>`,
    `<rect x="10" y="14" width="30" height="5" rx="2.5" fill="${t0}"/>`,
    `<rect x="6" y="28" width="52" height="16" rx="6" fill="${s2}"/><rect x="6" y="32" width="3" height="8" rx="1.5" fill="${accent}"/>`,
    `<rect x="14" y="34" width="32" height="4" rx="2" fill="${t1}"/>`,
    `<rect x="14" y="54" width="36" height="4" rx="2" fill="${t2}"/>`,
    `<rect x="14" y="68" width="28" height="4" rx="2" fill="${t2}"/>`,
    `<circle cx="80" cy="14" r="3" fill="${p.roles.danger}"/><circle cx="90" cy="14" r="3" fill="${p.roles.warning}"/><circle cx="100" cy="14" r="3" fill="${p.roles.success}"/>`,
    `<rect x="76" y="26" width="176" height="36" rx="8" fill="${s2}"/>`,
    `<rect x="86" y="35" width="96" height="5" rx="2.5" fill="${t0}"/><rect x="86" y="47" width="64" height="4" rx="2" fill="${t2}"/>`,
    `<rect x="76" y="68" width="176" height="22" rx="6" fill="${s1}"/>`,
    `<rect x="86" y="77" width="22" height="4" rx="2" fill="${accent}"/><rect x="112" y="77" width="30" height="4" rx="2" fill="${t0}"/><rect x="146" y="77" width="38" height="4" rx="2" fill="${p.roles.success}"/>`,
    `<rect x="76" y="100" width="124" height="22" rx="11" fill="${s1}" stroke="${s3}"/>`,
    `<rect x="208" y="100" width="44" height="22" rx="11" fill="${accent}">${pulse}</rect>`,
    `<rect x="220" y="109" width="20" height="4" rx="2" fill="${s0}"/>`,
    '</svg>',
  ].join('')
}

/** The theme's five swatches as round dots, the accent ringed. */
function dotsSvg(p: Theme): string {
  const colors = [p.accent, p.roles.danger, p.roles.success, p.roles.warning, p.roles.pro]
  const circles = colors
    .map((c, i) => `<circle cx="${9 + i * 18}" cy="9" r="7" fill="${c}" stroke="${p.text[2]}" stroke-opacity="${i === 0 ? 0.9 : 0.25}" stroke-width="1"/>`)
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="18" viewBox="0 0 90 18">${circles}</svg>`
}

/** A slow gradient band in the theme's own colors, for the top of the pane. */
function bannerSvg(p: Theme): string {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="264" height="30" viewBox="0 0 264 30">',
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">',
    `<stop offset="0" stop-color="${p.accent}"><animate attributeName="stop-color" values="${p.accent};${p.roles.pro};${p.accent}" dur="9s" repeatCount="indefinite"/></stop>`,
    `<stop offset="1" stop-color="${p.surfaces[2]}"><animate attributeName="stop-color" values="${p.surfaces[2]};${p.surfaces[3]};${p.surfaces[2]}" dur="9s" repeatCount="indefinite"/></stop>`,
    '</linearGradient></defs>',
    '<rect width="264" height="30" rx="10" fill="url(#g)"/>',
    '</svg>',
  ].join('')
}

// ---- your own themes: built from an accent, saved, shared as a code ----

/** A whole palette from one accent: surfaces and text tinted by its hue, standard status colors. */
function buildCustom(name: string, accent: string, mode: Mode): Theme {
  const hue = hueOf(accent)
  const dark = mode === 'dark'
  const surfaces: Surfaces = dark
    ? [hslHex(hue, 22, 7), hslHex(hue, 22, 10), hslHex(hue, 22, 14), hslHex(hue, 22, 17)]
    : [hslHex(hue, 28, 93), hslHex(hue, 28, 96), hslHex(hue, 28, 99), hslHex(hue, 28, 99)]
  const text: Text3 = dark
    ? [hslHex(hue, 30, 92), hslHex(hue, 22, 77), hslHex(hue, 14, 62)]
    : [hslHex(hue, 38, 13), hslHex(hue, 28, 30), hslHex(hue, 23, 42)]
  let a = accent.toLowerCase()

  // The accent has to stand out from the page it sits on.
  for (let i = 0; i < 5 && contrast(a, surfaces[0]) < 3; i++) {
    a = mix(a, dark ? '#ffffff' : '#000000', 0.18)
  }

  return {
    id: `my-${slug(name)}`,
    name,
    note: `your ${mode} theme`,
    mode,
    surfaces,
    text,
    accent: a,
    roles: dark
      ? { danger: '#d1495b', success: '#5fa36a', warning: '#d4a02e', pro: '#9b7bc4' }
      : { danger: '#c0392b', success: '#2f7d4f', warning: '#9a6b00', pro: '#7a55a8' },
  }
}

function validateDraft(d: Draft): { theme: Theme; notes?: string[] } | { error: string } {
  const name = cleanName(d.name)

  if (name === '') {
    return { error: 'Give it a name.' }
  }
  const raw = d.accent.trim()
  const accent = /^[0-9a-f]{6}$/i.test(raw) ? `#${raw}` : raw

  if (!isHex(accent)) {
    return { error: 'The accent must be a six-digit hex color such as #d98a4e.' }
  }
  const theme = buildCustom(name, accent, d.mode === 'light' ? 'light' : 'dark')
  const error = validateTheme(theme)

  if (error === null) {
    return { theme }
  }
  // The palette would be refused as made: nudge it until the app accepts it, and say how.
  const fixed = fixTheme(theme)

  return validateTheme(fixed.theme) === null ? { theme: fixed.theme, notes: fixed.notes } : { error }
}

const MAX_CUSTOM = 24
const CUSTOM_KEY = 'custom'

function cleanCustom(raw: unknown): Theme[] {
  if (!Array.isArray(raw)) {
    return []
  }
  const seen = new Set<string>()
  const out: Theme[] = []

  for (const item of raw) {
    const t = sanitizeTheme(item)

    if (t !== null && !seen.has(t.id)) {
      seen.add(t.id)
      out.push(t)
    }
  }

  return out.slice(0, MAX_CUSTOM)
}

// The engine only follows `$` into top-level functions, so every helper that uses it is one.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function savePrefs($: any): Promise<void> {
  const s = await read($, current)

  await $.store.set(PREFS_KEY, {
    favs: s.favs,
    backdrop: s.backdrop,
    highContrast: s.highContrast,
    codePair: s.codePair,
    reading: s.reading,
    auto: s.auto,
    backdropStyle: s.backdropStyle,
    strength: s.strength,
    tone: s.tone,
    off: s.off,
    follow: s.follow,
    tunes: s.tunes,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function patch($: any, change: Partial<State>): Promise<void> {
  await update($, current, (s: State) => ({ ...s, ...change }))
}

// A line on screen; where there is no screen to show it on, nothing happens.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function say($: any, text: string): void {
  try {
    $.ui.toast(text)
  } catch {
    // no screen
  }
}

/** A theme with the person's tuning applied; the theme itself when nothing is tuned or tuning fails. */
function tunedOf(p: Theme, tunes: Record<string, Tune>): Theme {
  const t = tunes[p.id]

  if (t === undefined || !isTuned(t)) {
    return p
  }

  try {
    return tuneTheme(p, t).theme
  } catch {
    return p
  }
}

/**
 * The readability options as they stand now. "Only at night" switches night comfort off in the day,
 * by the hours of Day and night (those hours count even when Day and night itself is off).
 */
function readingFor(s: State, period?: 'day' | 'night'): Reading {
  const r = s.reading

  if (r.night === 0 || !r.nightOnly) {
    return r
  }
  const now = period ?? periodOf(s.auto, new Date().getHours())

  return now === 'night' ? r : { ...r, night: 0 }
}

/** What goes with the colors of one theme: the paired code theme and high contrast. */
function withExtras(base: ThemeSetArgs, p: Theme, s: State): ThemeSetArgs {
  const code = s.codePair ? CODE_THEMES[p.id] : undefined

  return {
    ...base,
    colors: {
      ...base.colors,
      ...(code === undefined ? {} : { codeTheme: { [p.mode]: code } }),
      ...(s.highContrast ? { contrast: 'more' } : {}),
    },
  } as ThemeSetArgs
}

function rerender($: any): void {
  // A scene is drawn from the theme's colors, so it is drawn again for the new one.
  try {
    $.ui.invalidate('ui.render')
  } catch {
    // nothing is drawn yet
  }
}

/** Follow system: a light theme under `light` and a dark theme under `dark`, no mode named, so the app picks by its own setting. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyFollow($: any): Promise<void> {
  const s = await read($, current)
  const day = themeById(s.auto.day, s.custom)
  const night = themeById(s.auto.night, s.custom)

  if (day === undefined || night === undefined) {
    return
  }

  try {
    // Following the system, "only at night" means the night theme only, since the app itself picks the look.
    const base = lookPair(
      readableOf(tunedOf(day, s.tunes), readingFor(s, 'day')),
      readableOf(tunedOf(night, s.tunes), readingFor(s, 'night')),
    )
    const light = s.codePair ? CODE_THEMES[day.id] : undefined
    const dark = s.codePair ? CODE_THEMES[night.id] : undefined
    const codeTheme = { ...(light === undefined ? {} : { light }), ...(dark === undefined ? {} : { dark }) }

    await $.theme.set({
      colors: {
        ...base.colors,
        ...(Object.keys(codeTheme).length === 0 ? {} : { codeTheme }),
        ...(s.highContrast ? { contrast: 'more' } : {}),
      },
    } as ThemeSetArgs)
  } catch {
    // a pair that cannot be built is skipped; the current look stays
    return
  }
  await patch($, { id: night.id, off: false })
  rerender($)
}

// Applies and remembers one choice; every path (card press, command) goes through here.
// `save` is true for the person's own pick.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apply($: any, id: string, save: boolean): Promise<void> {
  const before = await read($, current)
  const p0 = themeById(id, before.custom)

  if (p0 === undefined) {
    return
  }

  if (before.follow) {
    if (!save) {
      await applyFollow($)

      return
    }
    await patch($, { follow: false })
    say($, 'Follow system is off: you picked a theme.')
  }
  const now = await read($, current)
  const p = readableOf(tunedOf(p0, now.tunes), readingFor(now))

  try {
    const chosen = withExtras(lookFor(p), p, now)

    // Nothing is reported if no client draws themes yet; the theme still stands for one that attaches.
    try {
      const backdrop = !now.backdrop ? undefined : groundFor(p, now.backdropStyle, now.strength, now.tone)

      await $.theme.set(backdrop === undefined ? chosen : ({ ...chosen, backdrop } as ThemeSetArgs))
    } catch {
      // A surface that refuses the backdrop still gets the colors.
      await $.theme.set(chosen)
    }
  } catch {
    // A palette that cannot be built is skipped; the current look stays.
    return
  }
  await update($, current, (s: State) => ({ ...s, id, off: false }))
  rerender($)

  if (save) {
    await $.store.set(STORE_KEY, id)
    await savePrefs($)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function toggleFavorite($: any, id: string): Promise<void> {
  await update($, current, (s: State) => ({
    ...s,
    favs: s.favs.includes(id) ? s.favs.filter(f => f !== id) : [id, ...s.favs].slice(0, MAX_FAVS),
  }))
  await savePrefs($)
}

/** The person's pick for this folder, or null for none. Only the id is kept, under the folder's key. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function setProject($: any, id: string | null): Promise<void> {
  const s = await read($, current)
  const key = projectKey(s.cwd)

  if (key === '') {
    return
  }
  const next: Record<string, string> = { ...s.projects }

  if (id === null) {
    delete next[key]
  } else {
    delete next[key]
    next[key] = id

    // The oldest pick makes room.
    for (const old of Object.keys(next).slice(0, Math.max(0, Object.keys(next).length - MAX_PROJECTS))) {
      delete next[old]
    }
  }
  await patch($, { projects: next })
  await $.store.set(PROJECTS_KEY, next)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function setBackdrop($: any, change: Partial<Pick<State, 'backdropStyle' | 'strength' | 'tone'>>): Promise<void> {
  const s = await read($, current)

  await patch($, change)
  await apply($, s.id, false)
  await savePrefs($)
}

type Flag = 'backdrop' | 'codePair' | 'highContrast'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function toggleFlag($: any, key: Flag): Promise<void> {
  const s = await read($, current)

  await patch($, { [key]: !s[key] } as Partial<State>)
  await apply($, s.id, false)
  await savePrefs($)
}

/** One readability option changed: remember it and draw the theme again. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function setReading($: any, change: Partial<Reading> | null): Promise<void> {
  const s = await read($, current)

  await patch($, { reading: change === null ? NO_READING : { ...s.reading, ...change } })
  await savePrefs($)
  await apply($, s.id, false)
}

/** "Only at night" comfort: draws the theme again when the clock crosses from day to night or back. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshNight($: any): Promise<void> {
  const s = await read($, current)

  if (s.reading.night === 0 || !s.reading.nightOnly || s.off) {
    return
  }
  const period = periodOf(s.auto, new Date().getHours())

  if (s.nightPeriod === period) {
    return
  }
  await patch($, { nightPeriod: period })
  await apply($, s.id, false)
}

// ---- day and night, follow system ----

/** Applies the day or night theme when the period has changed since it was last applied (or when `force`). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runAuto($: any, force: boolean): Promise<void> {
  const s = await read($, current)

  if (!s.auto.on || s.follow || s.off) {
    return
  }

  // A theme chosen for this folder is not replaced by the clock.
  if (themeById(s.projects[projectKey(s.cwd)] ?? '', s.custom) !== undefined) {
    return
  }
  const period = periodOf(s.auto, new Date().getHours())

  if (!force && s.autoPeriod === period) {
    return
  }
  await patch($, { autoPeriod: period })
  const id = period === 'day' ? s.auto.day : s.auto.night

  const next = themeById(id, s.custom)

  if (next !== undefined && id !== s.id) {
    await apply($, id, false)

    // Only a switch the clock made on its own is announced, not one the person just asked for.
    if (!force) {
      say($, `Day and night: switched to ${next.name}.`)
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function setAuto($: any, change: Partial<AutoCfg>): Promise<void> {
  await update($, current, (s: State) => ({
    ...s,
    auto: { ...s.auto, ...change },
    follow: change.on === true ? false : s.follow,
  }))
  await savePrefs($)
  const s = await read($, current)

  if (s.follow) {
    await applyFollow($)
  } else {
    await runAuto($, true)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function setFollow($: any, on: boolean): Promise<void> {
  const s = await read($, current)

  await patch($, { follow: on, auto: on ? { ...s.auto, on: false } : s.auto })
  await savePrefs($)

  if (on) {
    await applyFollow($)
  } else {
    await apply($, s.id, false)
  }
}

// ---- reset ----

const DEFAULT_SETTINGS: Partial<State> = {
  backdrop: true,
  highContrast: false,
  codePair: true,
  reading: NO_READING,
  auto: DEFAULT_AUTO,
  autoPeriod: '',
  backdropStyle: 'glow',
  strength: 'normal',
  tone: 'accent',
  off: false,
  follow: false,
  tunes: {},
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function useAppLook($: any): Promise<void> {
  try {
    await $.theme.clear()
  } catch {
    // nothing was set
  }
  await patch($, { off: true, confirm: '', msg: "The app's own look is back. Pick any theme to use one again." })
  await savePrefs($)
  rerender($)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resetSettings($: any): Promise<void> {
  const s = await read($, current)

  await patch($, { ...DEFAULT_SETTINGS, confirm: '', msg: 'Settings are back to their defaults. Your themes, favorites and folder choices are kept.' })
  await savePrefs($)
  await apply($, s.id, false)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function eraseAll($: any): Promise<void> {
  await patch($, {
    ...DEFAULT_SETTINGS,
    favs: [],
    custom: [],
    projects: {},
    id: DEFAULT_THEME,
    confirm: '',
    msg: 'Everything is erased: your themes, favorites and folder choices. The default theme is on.',
  })
  await $.store.set(CUSTOM_KEY, [])
  await $.store.set(PROJECTS_KEY, {})
  await apply($, DEFAULT_THEME, true)
}

// A destructive reset takes two presses: the first only asks.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function confirmReset($: any, kind: 'settings' | 'all'): Promise<void> {
  const s = await read($, current)

  if (s.confirm !== kind) {
    await patch($, { confirm: kind, msg: 'Press again to confirm.' })

    return
  }

  if (kind === 'settings') {
    await resetSettings($)
  } else {
    await eraseAll($)
  }
}

// ---- tuning ----

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function storeTune($: any, id: string, t: Tune): Promise<void> {
  const s = await read($, current)
  const tunes: Record<string, Tune> = { ...s.tunes }

  if (isTuned(t)) {
    tunes[id] = t
  } else {
    delete tunes[id]
  }
  await patch($, { tunes })
  await savePrefs($)
  await apply($, s.id, false)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function stepTune($: any, key: keyof Tune, delta: number): Promise<void> {
  const s = await read($, current)
  const t = s.tunes[s.id] ?? NO_TUNE

  await storeTune($, s.id, { ...t, [key]: Math.max(-TUNE_MAX, Math.min(TUNE_MAX, t[key] + delta)) })
}

// ---- your own themes: saved, imported, shared ----

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveCustom($: any): Promise<void> {
  const s = await read($, current)

  await $.store.set(CUSTOM_KEY, s.custom)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function addCustom($: any, t: Theme, notes: string[] = []): Promise<void> {
  await update($, current, (s: State) => ({
    ...s,
    custom: [t, ...s.custom.filter(c => c.id !== t.id)].slice(0, MAX_CUSTOM),
  }))
  await saveCustom($)
  await apply($, t.id, true)
  await patch($, { msg: `Saved "${t.name}" and applied it.${notes.length === 0 ? '' : ` Adjusted so the app accepts it: ${notes.join(', ')}.`}` })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveDraft($: any): Promise<void> {
  const s = await read($, current)
  const made = validateDraft(s.draft)

  if ('error' in made) {
    await patch($, { msg: made.error })

    return
  }
  await addCustom($, made.theme, made.notes ?? [])
}

/** The person's home folder (USERPROFILE on Windows, HOME on Mac and Linux), or '' when it cannot be read. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function homeDir($: any): Promise<string> {
  try {
    return String((await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME')) ?? '')
  } catch {
    return ''
  }
}

/** `~/themes/x.json` becomes the full path; anything else is returned as it is. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function expandHome($: any, path: string): Promise<string> {
  if (!/^~[\\/]/.test(path)) {
    return path
  }
  const home = (await homeDir($)).replace(/[\\/]+$/, '')

  return home === '' ? path : `${home}/${path.slice(2)}`
}

/** One box for everything: a code, a share link, a web address of a theme file, or a file on this computer. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function importAny($: any, input: string): Promise<void> {
  const text = await expandHome($, input.trim().replace(/^"(.*)"$/, '$1'))

  if (text === '') {
    return
  }
  let made: { theme: Theme; notes?: string[] } | { error: string }

  try {
    if (/^claude-themes:/.test(text) || /#v1\./.test(text) || /^v1\./.test(text)) {
      made = parseAny(text)
    } else if (/^https?:\/\//i.test(text)) {
      const res = await $.http.fetch(text)

      made = res.ok === true ? readThemeFile(String(res.text), text) : { error: `That address answered ${String(res.status)}.` }
    } else {
      made = readThemeFile(String(await $.fs.read(text)), text)
    }
  } catch {
    made = { error: 'That could not be read here. Check the path or address, or paste a theme code or link.' }
  }

  if ('error' in made) {
    await patch($, { msg: made.error })

    return
  }
  await addCustom($, made.theme, made.notes ?? [])
  await patch($, { importText: '' })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function removeCustom($: any, id: string): Promise<void> {
  const s = await read($, current)

  await update($, current, (st: State) => ({
    ...st,
    custom: st.custom.filter(c => c.id !== id),
    favs: st.favs.filter(f => f !== id),
    auto: {
      ...st.auto,
      day: st.auto.day === id ? DEFAULT_AUTO.day : st.auto.day,
      night: st.auto.night === id ? DEFAULT_AUTO.night : st.auto.night,
    },
    tunes: Object.fromEntries(Object.entries(st.tunes).filter(([k]) => k !== id)),
  }))
  await saveCustom($)
  await savePrefs($)

  const kept = Object.fromEntries(Object.entries((await read($, current)).projects).filter(([, v]) => v !== id))

  await patch($, { projects: kept })
  await $.store.set(PROJECTS_KEY, kept)

  if (s.id === id) {
    await apply($, DEFAULT_THEME, true)
  }
  await patch($, { msg: 'Deleted.' })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function setDraft($: any, change: Partial<Draft>): Promise<void> {
  await update($, current, (s: State) => ({ ...s, draft: { ...s.draft, ...change }, msg: '' }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function copyText($: any, surface: string, text: string, done: string): Promise<void> {
  try {
    const result = await $.ui.copy({ text, surface })

    await patch($, { msg: result?.isCopied === false ? 'Could not copy here.' : done })
  } catch {
    await patch($, { msg: 'Could not copy here.' })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function copyCode($: any, surface: string): Promise<void> {
  const s = await read($, current)
  const t = tunedOf(themeById(s.id, s.custom) ?? DEFAULT, s.tunes)

  await copyText($, surface, themeToCode(t), `Copied the code for ${t.name}.`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function copyLink($: any, surface: string): Promise<void> {
  const s = await read($, current)
  const t = tunedOf(themeById(s.id, s.custom) ?? DEFAULT, s.tunes)

  await copyText($, surface, themeToLink(t), `Copied the link for ${t.name}.`)
}

// ---- themes installed in VS Code ----

const MAX_FOUND = 400

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function scanVsCode($: any): Promise<void> {
  const home = await homeDir($)

  if (home === '') {
    await patch($, { scanMsg: 'Could not find your home folder here. Type a theme file path instead.' })

    return
  }
  const found: Found[] = []
  let seen = 0

  for (const root of vsCodeExtensionRoots(home.replace(/\\/g, '/'), '')) {
    let entries: { name: string; kind: string }[] = []

    try {
      entries = await $.fs.list(root)
    } catch {
      continue
    }

    for (const entry of entries) {
      if (entry.kind !== 'dir' || found.length >= MAX_FOUND || seen++ > 800) {
        continue
      }

      try {
        const pkg = String(await $.fs.read(`${root}/${entry.name}/package.json`))

        for (const t of listVsCodeThemes(pkg)) {
          found.push({ label: t.label, uiTheme: t.uiTheme, path: `${root}/${entry.name}/${t.path.replace(/^\.?[\\/]/, '').replace(/\\/g, '/')}` })
        }
      } catch {
        // not an extension with themes
      }
    }
  }
  await patch($, {
    found: found.slice(0, MAX_FOUND),
    scanMsg: found.length === 0 ? 'No installed VS Code themes were found. Type a theme file path instead.' : `Found ${found.length} themes installed in VS Code.`,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function importFound($: any, index: number): Promise<void> {
  const s = await read($, current)
  const f = s.found[index]

  if (f === undefined) {
    return
  }
  let made: { theme: Theme; notes?: string[] } | { error: string }

  try {
    made = parseVsCode(String(await $.fs.read(f.path)), { label: f.label, uiTheme: f.uiTheme })
  } catch {
    made = { error: 'That theme file could not be read.' }
  }

  if ('error' in made) {
    await patch($, { msg: made.error })

    return
  }
  await addCustom($, made.theme, made.notes ?? [])
}

type Switch = 'off' | 'hour' | 'system'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function setSwitch($: any, mode: Switch): Promise<void> {
  if (mode === 'system') {
    await setFollow($, true)

    return
  }
  const s = await read($, current)

  if (s.follow) {
    await setFollow($, false)
  }
  await setAuto($, { on: mode === 'hour' })
}

const MAX_OPTIONS = 64

/**
 * The choices for a theme picker. The app's Select takes at most 64, so a long list keeps the chosen
 * theme, the favorites, your own themes and the preferred mode first, then fills up in the gallery's order.
 */
function themeOptions(list: Theme[], selected: string, favs: string[], prefer?: Mode): { value: string; label: string }[] {
  if (list.length <= MAX_OPTIONS) {
    return list.map(p => ({ value: p.id, label: p.name }))
  }
  const chosen = new Set<string>()
  const add = (p: Theme | undefined) => {
    if (p !== undefined && chosen.size < MAX_OPTIONS) {
      chosen.add(p.id)
    }
  }

  add(list.find(p => p.id === selected))
  favs.forEach(id => add(list.find(p => p.id === id)))
  list.filter(p => p.id.startsWith('my-')).forEach(add)
  list.filter(p => prefer === undefined || p.mode === prefer).forEach(add)
  list.forEach(add)

  return list.filter(p => chosen.has(p.id)).map(p => ({ value: p.id, label: p.name }))
}

/** Copies the current theme (with its tuning) as another tool's theme file. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function copyExport($: any, surface: string, format: ExportFormat): Promise<void> {
  const s = await read($, current)
  const t = tunedOf(themeById(s.id, s.custom) ?? DEFAULT, s.tunes)
  const label = EXPORTS.find(f => f.id === format)?.label ?? format

  await copyText($, surface, exportTheme(t, format), `Copied ${t.name} as a ${label} theme. Paste it into a file named ${exportFileName(t, format)}.`)
}

/** Nine stops on a line with a dot at the current one: `──●──`. */
const tuneBar = (v: number): string => Array.from({ length: 2 * TUNE_MAX + 1 }, (_, i) => (i === v + TUNE_MAX ? '●' : '─')).join('')

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // Registered first so a failure while restoring the theme cannot leave /claude-themes missing.
    await $.command.register({
      name: 'claude-themes',
      description: 'Open the theme gallery: /claude-themes, or /claude-themes <name> to switch directly (import, export, follow and reset also work)',
      argumentHint: '[theme name | import <code, link or file> | export <vscode|base16|wt> | follow on/off | reset look/settings/all]',
      immediate: true,
    })
    const saved = await $.store.get(STORE_KEY)
    const custom = cleanCustom(await $.store.get(CUSTOM_KEY))
    const known = new Set([...BY_ID.keys(), ...custom.map(t => t.id)])
    const id = typeof saved === 'string' && known.has(saved) ? saved : DEFAULT_THEME
    const prefs = cleanPrefs(await $.store.get(PREFS_KEY), known)

    // Your own themes, favorites and the backdrop switch come back before the theme is drawn.
    await patch($, {
      ...prefs,
      custom,
      cwd: typeof e.cwd === 'string' ? e.cwd : '',
      projects: cleanProjects(await $.store.get(PROJECTS_KEY), known),
      id,
      confirm: '',
      msg: '',
    })

    // "The app's own look" stays chosen across sessions until a theme is picked.
    if (prefs.off) {
      return next(e)
    }
    await apply($, id, false)
    await runAuto($, true)

    // This folder's own theme comes last, so it wins over the saved one and the clock.
    const here = await read($, current)
    const mine = themeById(here.projects[projectKey(here.cwd)] ?? '', here.custom)

    if (!here.follow && mine !== undefined && mine.id !== here.id) {
      await apply($, mine.id, false)
      say($, `This folder: using ${mine.name}.`)
    }

    return next(e)
  })

  // The day and night switch is checked as each prompt is sent; a failure here never holds a prompt back.
  on('prompt.submit', async ($, e, next) => {
    try {
      await runAuto($, false)
      await refreshNight($)
    } catch {
      // the next prompt tries again
    }

    return next(e)
  })

  // The command is the person's own ask, so the pane is placed at any width.
  on('command.run', { command: 'claude-themes' }, async ($, e) => {
    const args = e.args.trim()
    const [verb = '', ...rest] = args.split(/\s+/)
    const tail = args.slice(verb.length).trim()
    const state = await read($, current)

    if (verb === 'reset') {
      const what = rest[0] ?? ''

      if (what === 'look') {
        await useAppLook($)

        return { text: "The app's own look is back." }
      }

      if (what === 'settings') {
        await resetSettings($)

        return { text: 'Settings are back to their defaults.' }
      }

      if (what === 'all') {
        await eraseAll($)

        return { text: 'Everything is erased and the default theme is on.' }
      }

      return { text: 'Reset what? /claude-themes reset look (the app\'s own look), settings (defaults, your themes stay), or all (erase everything).' }
    }

    if (verb === 'import' && tail !== '') {
      await importAny($, tail)

      return { text: (await read($, current)).msg }
    }

    if (verb === 'export') {
      const format = formatOf(rest.join(' '))

      if (format === undefined) {
        return { text: `Export as what? /claude-themes export ${EXPORTS.map(f => f.id).join(' | ')}` }
      }
      const t = tunedOf(themeById(state.id, state.custom) ?? DEFAULT, state.tunes)

      return { text: `${t.name} as ${exportFileName(t, format)}:\n\n${exportTheme(t, format)}` }
    }

    if (verb === 'follow') {
      const on2 = rest[0] !== 'off'

      await setFollow($, on2)

      return { text: on2 ? 'Following the system: the day theme in light mode, the night theme in dark mode (pick both in Settings).' : 'Follow system is off.' }
    }
    const want = idOf(args)

    if (want !== '') {
      const mine = state.custom
      const found = themeById(want, mine)

      if (found === undefined) {
        return { text: `No theme called "${args}". Try: ${[...THEMES, ...mine].map(p => p.id).join(', ')}` }
      }
      await apply($, found.id, true)

      return { text: `Theme: ${found.name} (${found.mode})` }
    }
    await $.ui.open({ id: PANE, title: 'Claude Themes' })

    return { text: '' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Link } = $.ui.resolve(e)
    // The terminal has no Svg; it keeps a preview and dots built from text.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Svg = e.surface === 'terminal' ? undefined : ($.ui.resolve(e) as any).Svg
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Input = ($.ui.resolve(e) as any).Input
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Select = ($.ui.resolve(e) as any).Select
    const now = await read($, current)
    const all = [...THEMES, ...now.custom]
    const byId = (id: string) => themeById(id, now.custom)
    const cur = byId(now.id) ?? DEFAULT
    const curT = readableOf(tunedOf(cur, now.tunes), readingFor(now))
    const [c0, c1, c2] = cur.surfaces
    const tab: Tab = now.tab === 'light' || now.tab === 'settings' || now.tab === 'appearance' || now.tab === 'favorites' || now.tab === 'maker' ? now.tab : 'dark'
    const q = now.q.trim().toLowerCase()
    const matches = (p: Theme) => q === '' || `${p.name} ${p.note} ${p.id} ${p.mode}`.toLowerCase().includes(q)

    const pick = (id: string) => async () => {
      await apply($, id, true)
    }
    const goTab = (t: Tab) => async () => {
      await patch($, { tab: t, confirm: '', msg: '' })
    }

    const star = (id: string) => async () => {
      await toggleFavorite($, id)
    }

    // One section failing to draw must not take the rest of the pane with it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const guard = (name: string, draw: () => any): any => {
      try {
        return draw()
      } catch {
        return <Text dimColor>{name} could not be drawn.</Text>
      }
    }

    const row = (p: Theme, section: string) => {
      const isCurrent = p.id === now.id
      const isFav = now.favs.includes(p.id)
      const [s0, s1, , s3] = p.surfaces
      const dots = [p.accent, p.roles.danger, p.roles.success, p.roles.warning, p.roles.pro]

      return (
        <Box
          key={`row-${section}-${p.id}`}
          alignItems="center"
          gap={1}
          padding={1}
          borderStyle={isCurrent ? 'bold' : 'round'}
          borderColor={isCurrent ? p.accent : s3}
          backgroundColor={s0}
          hover={{ borderColor: p.accent, backgroundColor: s1 }}
        >
          {Svg === undefined ? null : (
            <Svg source={previewSvg(p, false)} alt={`${p.name} preview`} width={128} height={64} />
          )}
          <Box flexDirection="column" alignItems="center" flexGrow={1} gap={1}>
            {/* The desktop draws a Button in the app's current theme and ignores a Text color inside it, so a button on a row sits on a plate of that same theme: it stays readable on a row of the other mode. */}
            <Box backgroundColor={c2}>
              <Button key={`pick-${section}-${p.id}`} variant={isCurrent ? 'primary' : 'secondary'} onPress={pick(p.id)}>
                {isCurrent ? '✓ ' : ''}
                {p.name}
              </Button>
            </Box>
            {Svg === undefined ? (
              <Text>
                {dots.map((c, i) => (
                  <Text key={`dot${i}`} color={c}>●</Text>
                ))}
              </Text>
            ) : (
              <Svg source={dotsSvg(p)} alt={`${p.name} colors`} width={90} height={18} />
            )}
            <Text color={p.text[2]}>{p.note}</Text>
          </Box>
          <Box backgroundColor={c2}>
            <Button key={`fav-${section}-${p.id}`} onPress={star(p.id)}>
              {isFav ? '★' : '☆'}
            </Button>
          </Box>
        </Box>
      )
    }

    const hero = (
      <Box flexDirection="column" alignItems="center" gap={1} padding={1} borderStyle="bold" borderColor={cur.accent} backgroundColor={c0}>
        {Svg === undefined ? (
          <Box>
            <Box flexDirection="column" width={16} paddingX={1} backgroundColor={c1}>
              <Text color={cur.text[0]} weight="bold">Chats</Text>
              <Text color={cur.text[0]} backgroundColor={c2}>Release notes</Text>
              <Text color={cur.text[2]}>Trip ideas</Text>
            </Box>
            <Box flexDirection="column" flexGrow={1} paddingX={1}>
              <Box backgroundColor={c2} paddingX={1}>
                <Text color={cur.text[0]}>Here is the fix.</Text>
              </Box>
              <Box gap={1}>
                <Text color={c0} backgroundColor={cur.accent}> Send </Text>
                <Text color={cur.roles.danger}>Error</Text>
                <Text color={cur.roles.warning}>Warning</Text>
              </Box>
            </Box>
          </Box>
        ) : (
          <Svg source={previewSvg(curT, true)} alt={`${cur.name} preview`} width={360} height={180} />
        )}
        <Text weight="bold" color={cur.text[0]}>
          {now.off
            ? "Active: the app's own look"
            : now.follow
              ? `Following the system: ${byId(now.auto.day)?.name ?? 'day'} by day, ${byId(now.auto.night)?.name ?? 'night'} by night`
              : `Active: ${cur.name} (${cur.mode})${isTuned(now.tunes[cur.id] ?? NO_TUNE) ? ', tuned' : ''}`}
        </Text>
      </Box>
    )

    const modeTab = (mode: Mode) => () => {
      const shown = all.filter(p => p.mode === mode && matches(p))

      return (
        <Box flexDirection="column" gap={1}>
          {Input === undefined ? null : (
            <Input
              key="search"
              placeholder={`Search ${mode} themes`}
              value={now.q}
              onInput={async (value: string) => {
                await patch($, { q: value.slice(0, 40) })
              }}
              onSubmit={async (value: string) => {
                await patch($, { q: value.slice(0, 40) })
              }}
            />
          )}

          {shown.length === 0 ? (
            <Text dimColor>{q === '' ? `No ${mode} themes.` : `No ${mode} theme matches "${now.q.trim()}".`}</Text>
          ) : (
            shown.map(p => guard(p.name, () => row(p, 'all')))
          )}
        </Box>
      )
    }

    const favoritesTab = () => {
      const favs = now.favs.map(id => byId(id)).filter((p): p is Theme => p !== undefined)

      return favs.length === 0 ? (
        <Text dimColor>No favorites yet. Press ☆ on a theme to keep it here.</Text>
      ) : (
        <Box flexDirection="column" gap={1}>
          {favs.map(p => guard(p.name, () => row(p, 'fav')))}
        </Box>
      )
    }

    const makerTab = () => {
      const c3 = cur.surfaces[3]
      // Until a name is typed the preview uses a stand-in; the missing name is only pointed out when saving.
      const built = validateDraft({ ...now.draft, name: now.draft.name.trim() === '' ? 'My theme' : now.draft.name })
      const draftAccent = /^#[0-9a-f]{6}$/i.test(now.draft.accent.trim()) ? now.draft.accent.trim() : /^[0-9a-f]{6}$/i.test(now.draft.accent.trim()) ? `#${now.draft.accent.trim()}` : ''
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const card = (key: string, title: string, children: any) => (
        <Box key={`card-${key}`} flexDirection="column" gap={1} padding={1} borderStyle="round" borderColor={c3} backgroundColor={c0}>
          <Text weight="bold" size="heading">{title}</Text>
          {children}
        </Box>
      )
      // A label above its box, so every box starts at the same edge.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const field = (key: string, label: string, placeholder: string, value: string, change: (v: string) => Promise<void>, submit: (v: string) => Promise<void>, hint?: any): any =>
        Input === undefined ? null : (
          <Box key={`field-${key}`} flexDirection="column" alignItems="stretch" flexGrow={1}>
            <Box gap={1} alignItems="center">
              <Text dimColor>{label}</Text>
              {hint}
            </Box>
            <Input key={key} placeholder={placeholder} value={value} onInput={change} onSubmit={submit} />
          </Box>
        )
      const setName = async (v: string) => {
        await setDraft($, { name: v.slice(0, 24) })
      }
      const setAccent = async (v: string) => {
        await setDraft($, { accent: v.slice(0, 9) })
      }
      const setImport = async (v: string) => {
        await patch($, { importText: v.slice(0, 2000) })
      }
      const runImport = async (v: string) => {
        await importAny($, v)
      }
      const good = /^(Saved|Copied|Deleted)/.test(now.msg)

      const preview =
        'error' in built ? (
          <Text color={cur.roles.danger}>{built.error}</Text>
        ) : (
          <Box flexDirection="column" alignItems="center" gap={1}>
            {Svg === undefined ? (
              <Text>
                {[built.theme.accent, built.theme.roles.danger, built.theme.roles.success, built.theme.roles.warning, built.theme.roles.pro].map((c, i) => (
                  <Text key={`mk${i}`} color={c}>●</Text>
                ))}
              </Text>
            ) : (
              <Svg source={previewSvg(built.theme, false)} alt={`${built.theme.name} preview`} width={264} height={132} />
            )}
            <Text dimColor>{`${built.theme.name} · ${built.theme.mode} · ${built.theme.accent}`}</Text>
          </Box>
        )

      const make = card(
        'make',
        'Your theme',
        <Box flexDirection="column" gap={1}>
          {preview}
          <Box gap={1} flexWrap="wrap">
            {field('maker-name', 'Name', 'My theme', now.draft.name, setName, setName)}
            {field(
              'maker-accent',
              'Accent',
              '#d98a4e',
              now.draft.accent,
              setAccent,
              setAccent,
              Svg === undefined || draftAccent === '' ? null : (
                <Svg
                  source={`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="${draftAccent}" stroke="#808080" stroke-opacity="0.5"/></svg>`}
                  alt={`Accent ${draftAccent}`}
                  width={14}
                  height={14}
                />
              ),
            )}
          </Box>
          <Text dimColor>Base</Text>
          <Box gap={1} flexWrap="wrap">
            <Button
              key="maker-dark"
              variant={now.draft.mode === 'dark' ? 'primary' : 'secondary'}
              onPress={async () => {
                await setDraft($, { mode: 'dark' })
              }}
            >
              ☾ Dark
            </Button>
            <Button
              key="maker-light"
              variant={now.draft.mode === 'light' ? 'primary' : 'secondary'}
              onPress={async () => {
                await setDraft($, { mode: 'light' })
              }}
            >
              ☀ Light
            </Button>
          </Box>
          <Box gap={1} alignItems="center" flexWrap="wrap">
            <Button
              key="maker-save"
              variant="primary"
              onPress={async () => {
                await saveDraft($)
              }}
            >
              Save and apply
            </Button>
            {now.msg === '' ? null : <Text color={good ? cur.roles.success : cur.roles.danger}>{now.msg}</Text>}
          </Box>
        </Box>,
      )

      const mine = card(
        'mine',
        'My themes',
        now.custom.length === 0 ? (
          <Text dimColor>No themes of your own yet. Make one above, or import a code below.</Text>
        ) : (
          <Box flexDirection="column" gap={1}>
            {now.custom.map(t => (
              <Box key={`mine-${t.id}`} alignItems="center" gap={1} padding={1} borderStyle="round" borderColor={t.id === now.id ? t.accent : c3}>
                {Svg === undefined ? null : <Svg source={previewSvg(t, false)} alt={`${t.name} preview`} width={96} height={48} />}
                <Box flexDirection="column" flexGrow={1}>
                  <Text weight="bold">{t.name}</Text>
                  <Text dimColor>{`${t.mode} · ${t.accent}`}</Text>
                </Box>
                <Button key={`maker-use-${t.id}`} variant={t.id === now.id ? 'primary' : 'secondary'} onPress={pick(t.id)}>
                  {t.id === now.id ? '✓ Using' : 'Use'}
                </Button>
                <Button
                  key={`maker-del-${t.id}`}
                  onPress={async () => {
                    await removeCustom($, t.id)
                  }}
                >
                  ✕
                </Button>
              </Box>
            ))}
          </Box>
        ),
      )

      const share = card(
        'share',
        'Share',
        <Box flexDirection="column" gap={1}>
          <Text dimColor>
            Copy a link or a code for the theme you are on. To add one, paste a code, a link, a web address of a theme file or the path of a file below and press Enter. VS Code themes, base16 or base24 schemes and terminal schemes (Windows Terminal, iTerm2) work too.
          </Text>
          <Box gap={1} flexWrap="wrap">
            <Button
              key="share-link"
              onPress={async (press: { surface: string }) => {
                await copyLink($, press.surface)
              }}
            >
              Copy link
            </Button>
            <Button
              key="share-copy"
              onPress={async (press: { surface: string }) => {
                await copyCode($, press.surface)
              }}
            >
              Copy code
            </Button>
          </Box>
          <Text dimColor>Export the theme you are on as a file for another tool; it is copied to the clipboard.</Text>
          <Box gap={1} flexWrap="wrap">
            {EXPORTS.map(f => (
              <Button
                key={`export-${f.id}`}
                onPress={async (press: { surface: string }) => {
                  await copyExport($, press.surface, f.id)
                }}
              >
                {f.label}
              </Button>
            ))}
          </Box>
          {field('share-import', 'Import', 'Code, link, web address or file path', now.importText, setImport, runImport)}
        </Box>,
      )

      return (
        <Box flexDirection="column" gap={1}>
          {guard('The maker', () => make)}
          {guard('My themes', () => mine)}
          {guard('Share', () => share)}
        </Box>
      )
    }

    // The Appearance tab holds the look and behaviour cards; the Settings tab holds the VS Code import, the folder theme, Reset and About.
    const settingsTab = (which: 'appearance' | 'settings') => () => {
      const c3 = cur.surfaces[3]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const card = (key: string, title: string, children: any) => (
        <Box key={`card-${key}`} flexDirection="column" gap={1} padding={1} borderStyle="round" borderColor={c3} backgroundColor={c0}>
          <Text weight="bold" size="heading">{title}</Text>
          {children}
        </Box>
      )
      // A title and its one line on the left, one compact switch on the right.
      const toggleRow = (key: string, title: string, about: string, isOn: boolean, toggle: () => Promise<void>, plain = false) => (
        <Box key={`row-${key}`} alignItems="center" gap={1}>
          <Box flexDirection="column" flexGrow={1}>
            {plain ? <Text>{`${title}. ${about}`}</Text> : <Text weight="bold">{title}</Text>}
            {plain ? null : <Text dimColor>{about}</Text>}
          </Box>
          <Button key={key} variant={isOn ? 'primary' : 'secondary'} onPress={toggle}>
            {isOn ? 'On' : 'Off'}
          </Button>
        </Box>
      )
      const hourOptions = Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: `${String(h).padStart(2, '0')}:00` }))
      const picker = (key: string, label: string, options: { value: string; label: string }[], value: string, set: (v: string) => Promise<void>) => (
        <Select key={key} label={label} options={options} value={value} onSelect={set} />
      )

      const appearance = card(
        'appearance',
        'Backdrop',
        <Box flexDirection="column" gap={1}>
          {toggleRow('backdrop-toggle', 'Soft color behind the chat', "Drawn in the theme's colors.", now.backdrop, async () => {
            await toggleFlag($, 'backdrop')
          }, true)}
          {!now.backdrop ? null : (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>Style</Text>
              <Box gap={1} flexWrap="wrap">
                {GROUNDS.map(st => {
                  const selected = now.backdropStyle === st.value

                  return (
                    <Box
                      key={`style-${st.value}`}
                      flexDirection="column"
                      alignItems="center"
                      gap={1}
                      padding={1}
                      borderStyle={selected ? 'bold' : 'round'}
                      borderColor={selected ? cur.accent : c3}
                    >
                      {Svg === undefined ? null : (
                        <Svg source={groundThumb(cur, st.make(tints(cur, now.strength, now.tone)), 84, 52)} alt={`${st.label} backdrop`} width={84} height={52} />
                      )}
                      <Button
                        key={`backdrop-style-${st.value}`}
                        variant={selected ? 'primary' : 'secondary'}
                        onPress={async () => {
                          await setBackdrop($, { backdropStyle: st.value })
                        }}
                      >
                        {st.label}
                      </Button>
                    </Box>
                  )
                })}
              </Box>
              <Text dimColor>Strength</Text>
              <Box gap={1} flexWrap="wrap">
                {STRENGTHS.map(x => (
                  <Button
                    key={`backdrop-strength-${x.value}`}
                    variant={now.strength === x.value ? 'primary' : 'secondary'}
                    onPress={async () => {
                      await setBackdrop($, { strength: x.value })
                    }}
                  >
                    {x.label}
                  </Button>
                ))}
              </Box>
            </Box>
          )}
        </Box>,
      )

      const t = now.tunes[cur.id] ?? NO_TUNE
      // A label above its box, so every box starts at the same edge.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const field = (key: string, label: string, placeholder: string, value: string, change: (v: string) => Promise<void>, submit: (v: string) => Promise<void>): any =>
        Input === undefined ? null : (
          <Box key={`field-${key}`} flexDirection="column" alignItems="stretch" flexGrow={1}>
            <Text dimColor>{label}</Text>
            <Input key={key} placeholder={placeholder} value={value} onInput={change} onSubmit={submit} />
          </Box>
        )
      const setFoundQ = async (v: string) => {
        await patch($, { foundQ: v.slice(0, 40) })
      }
      const needle = now.foundQ.trim().toLowerCase()
      const foundShown = now.found
        .map((f, index) => ({ f, index }))
        .filter(({ f }) => needle === '' || f.label.toLowerCase().includes(needle))
        .slice(0, 10)

      const vscode = card(
        'vscode',
        'From VS Code',
        <Box flexDirection="column" gap={1}>
          <Text dimColor>Lists the color themes of the editors installed on this computer (VS Code, Cursor and others); one press adds a theme here.</Text>
          <Box gap={1} alignItems="center" flexWrap="wrap">
            <Button
              key="vscode-scan"
              onPress={async () => {
                await scanVsCode($)
              }}
            >
              Find my VS Code themes
            </Button>
            {now.scanMsg === '' ? null : <Text dimColor>{now.scanMsg}</Text>}
          </Box>
          {now.found.length === 0 ? null : (
            <Box flexDirection="column" gap={1}>
              {field('vscode-search', 'Search', 'Name of a theme', now.foundQ, setFoundQ, setFoundQ)}
              {foundShown.map(({ f, index }) => (
                <Box key={`found-${index}`} alignItems="center" gap={1}>
                  <Box flexDirection="column" flexGrow={1}>
                    <Text weight="bold">{f.label}</Text>
                    <Text dimColor>{f.uiTheme === 'vs' ? 'light' : 'dark'}</Text>
                  </Box>
                  <Button
                    key={`found-add-${index}`}
                    onPress={async () => {
                      await importFound($, index)
                    }}
                  >
                    Add
                  </Button>
                </Box>
              ))}
              {foundShown.length === 0 ? <Text dimColor>No theme matches that.</Text> : null}
            </Box>
          )}
        </Box>,
      )

      const tune = card(
        'tune',
        `Tune ${cur.name}`,
        <Box flexDirection="column" gap={1}>
          <Box flexWrap="wrap" gap={1}>
            {TUNE_AXES.map(ax => {
              const v = t[ax.key]

              return (
                <Box
                  key={`tune-row-${ax.key}`}
                  flexDirection="column"
                  flexGrow={1}
                  width="48%"
                  minWidth={22}
                  paddingX={1}
                  borderStyle="round"
                  borderColor={c3}
                >
                  <Box justifyContent="space-between">
                    <Text weight="bold">{ax.label}</Text>
                    <Text dimColor={v === 0}>{`${v > 0 ? '+' : ''}${v}`}</Text>
                  </Box>
                  <Box alignItems="center" justifyContent="space-between">
                    <Button
                      key={`tune-${ax.key}-down`}
                      onPress={async () => {
                        await stepTune($, ax.key, -1)
                      }}
                    >
                      −
                    </Button>
                    <Text dimColor>{tuneBar(v)}</Text>
                    <Button
                      key={`tune-${ax.key}-up`}
                      onPress={async () => {
                        await stepTune($, ax.key, 1)
                      }}
                    >
                      +
                    </Button>
                  </Box>
                  <Text dimColor>{`${ax.low} ↔ ${ax.high}`}</Text>
                </Box>
              )
            })}
          </Box>
          {!isTuned(t) ? null : (
            <Box>
              <Button
                key="tune-reset"
                onPress={async () => {
                  await storeTune($, cur.id, NO_TUNE)
                }}
              >
                Reset this theme
              </Button>
            </Box>
          )}
        </Box>,
      )

      const reset = card(
        'reset',
        'Reset',
        <Box flexDirection="column" gap={1}>
          <Box alignItems="center" gap={1}>
            <Box flexDirection="column" flexGrow={1}>
              <Text weight="bold">The app's own look</Text>
              <Text dimColor>Takes the theme off. Pick any theme to bring one back.</Text>
            </Box>
            <Button
              key="reset-look"
              variant={now.off ? 'primary' : 'secondary'}
              onPress={async () => {
                await useAppLook($)
              }}
            >
              {now.off ? 'Using it' : 'Use it'}
            </Button>
          </Box>
          <Box alignItems="center" gap={1}>
            <Box flexDirection="column" flexGrow={1}>
              <Text weight="bold">Reset settings</Text>
              <Text dimColor>Back to the defaults. Your themes, favorites, folder choices and rules stay.</Text>
            </Box>
            <Button
              key="reset-settings"
              variant={now.confirm === 'settings' ? 'primary' : 'secondary'}
              onPress={async () => {
                await confirmReset($, 'settings')
              }}
            >
              {now.confirm === 'settings' ? 'Press again' : 'Reset'}
            </Button>
          </Box>
          <Box alignItems="center" gap={1}>
            <Box flexDirection="column" flexGrow={1}>
              <Text weight="bold">Erase everything</Text>
              <Text dimColor>Also deletes your themes, favorites, folder choices and rules.</Text>
            </Box>
            <Button
              key="reset-all"
              variant={now.confirm === 'all' ? 'primary' : 'secondary'}
              onPress={async () => {
                await confirmReset($, 'all')
              }}
            >
              {now.confirm === 'all' ? 'Press again' : 'Erase'}
            </Button>
          </Box>
        </Box>,
      )

      const readability = card(
        'readability',
        'Readability',
        <Box flexDirection="column" gap={1}>
          {toggleRow('code-toggle', 'Code colors', 'Pairs the code highlighting in replies with the theme where the app has a matching one.', now.codePair, async () => {
            await toggleFlag($, 'codePair')
          })}
          {toggleRow('contrast-toggle', 'High contrast', 'Stronger borders and focus rings, useful on the light themes.', now.highContrast, async () => {
            await toggleFlag($, 'highContrast')
          })}
          {toggleRow('read-glare', 'Soften glare', 'Dims bright whites: the main text on dark themes, the lightest surfaces on light themes.', now.reading.glare > 0, async () => {
            await setReading($, { glare: now.reading.glare > 0 ? 0 : 2 })
          })}
          {toggleRow('read-night', 'Night comfort', 'A warmer cast with less blue light.', now.reading.night > 0, async () => {
            await setReading($, { night: now.reading.night > 0 ? 0 : 2 })
          })}
          {now.reading.night === 0
            ? null
            : toggleRow(
                'read-night-only',
                'Only at night',
                `Uses the hours set in Day and night: night starts at ${String(now.auto.to).padStart(2, '0')}:00 and ends at ${String(now.auto.from).padStart(2, '0')}:00. Checked when you send a prompt.`,
                now.reading.nightOnly,
                async () => {
                  await setReading($, { nightOnly: !now.reading.nightOnly })
                },
              )}
        </Box>,
      )

      const choice: Switch = now.follow ? 'system' : now.auto.on ? 'hour' : 'off'
      const dayNight = card(
        'daynight',
        'Day and night',
        <Box flexDirection="column" gap={1}>
          <Text dimColor>
            Switch themes by the clock (checked when a session starts and when you send a prompt), or follow the app's own light and dark setting. A theme you pick yourself stays until the next switch.
          </Text>
          <Box gap={1} flexWrap="wrap">
            {(['off', 'hour', 'system'] as Switch[]).map(m => (
              <Button
                key={`switch-${m}`}
                variant={choice === m ? 'primary' : 'secondary'}
                onPress={async () => {
                  await setSwitch($, m)
                }}
              >
                {m === 'off' ? 'Off' : m === 'hour' ? 'By the hour' : 'Follow system'}
              </Button>
            ))}
          </Box>
          {choice === 'off' ? null : Select === undefined ? (
            <Text dimColor>Pickers are not available here.</Text>
          ) : (
            <Box flexDirection="column" gap={1}>
              <Box gap={1} flexWrap="wrap">
                {picker('auto-day', 'Day theme', themeOptions(all, now.auto.day, now.favs, 'light'), now.auto.day, async v => {
                  await setAuto($, { day: v })
                })}
                {picker('auto-night', 'Night theme', themeOptions(all, now.auto.night, now.favs, 'dark'), now.auto.night, async v => {
                  await setAuto($, { night: v })
                })}
              </Box>
              {choice === 'system' ? (
                <Text dimColor>The backdrop is off while following the system, since one backdrop cannot suit both looks.</Text>
              ) : (
                <Box gap={1} flexWrap="wrap">
                  {picker('auto-from', 'Day starts', hourOptions, String(now.auto.from), async v => {
                    await setAuto($, { from: Number(v) })
                  })}
                  {picker('auto-to', 'Night starts', hourOptions, String(now.auto.to), async v => {
                    await setAuto($, { to: Number(v) })
                  })}
                </Box>
              )}
            </Box>
          )}
        </Box>,
      )

      const folder = projectKey(now.cwd)
      const mineHere = folder === '' ? undefined : themeById(now.projects[folder] ?? '', now.custom)
      const project =
        folder === ''
          ? null
          : card(
              'project',
              'Theme for this folder',
              <Box flexDirection="column" gap={1}>
                <Text dimColor>
                  {`This folder: ${mineHere === undefined ? 'no theme of its own yet.' : `uses ${mineHere.name} whenever a session starts here.`}`}
                </Text>
                <Box gap={1} flexWrap="wrap">
                  <Button
                    key="project-use"
                    onPress={async () => {
                      await setProject($, now.id)
                    }}
                  >
                    {`Use ${cur.name} in this folder`}
                  </Button>
                  {mineHere === undefined ? null : (
                    <Button
                      key="project-clear"
                      onPress={async () => {
                        await setProject($, null)
                      }}
                    >
                      Remove this folder's theme
                    </Button>
                  )}
                </Box>
              </Box>,
            )

      const about = card(
        'about',
        'About',
        <Box flexDirection="column" gap={1}>
          <Text dimColor>
            {`Claude Themes: ${all.length} themes${now.custom.length === 0 ? '' : `, ${now.custom.length} of them yours`}.`}
          </Text>
          <Text dimColor>
            Documents and source code: <Link href={REPO_URL}>{REPO_URL}</Link>
          </Text>
        </Box>,
      )

      if (which === 'settings') {
        return (
          <Box flexDirection="column" gap={1}>
            {guard('Import from VS Code', () => vscode)}
            {project === null ? null : guard('Theme for this folder', () => project)}
            {guard('Reset', () => reset)}
            {guard('About', () => about)}
          </Box>
        )
      }

      return (
        <Box flexDirection="column" gap={1}>
          {guard('Tune', () => tune)}
          {guard('Backdrop', () => appearance)}
          {guard('Readability', () => readability)}
          {guard('Day and night', () => dayNight)}
        </Box>
      )
    }

    return (
      <Box flexDirection="column" gap={1} paddingX={1}>
        {Svg === undefined ? null : (
          <Svg source={bannerSvg(cur)} alt="Animated band in the current theme's colors" width={264} height={30} />
        )}
        <Box flexDirection="column" alignItems="center">
          <Text weight="bold" size="title">Claude Themes</Text>
          <Text dimColor>{all.length} themes. Each one sets the app to its own dark or light look.</Text>
        </Box>

        {guard('The current theme', () => hero)}


        <Box gap={1} flexWrap="wrap">
          <Button key="tab-dark" variant={tab === 'dark' ? 'primary' : 'secondary'} onPress={goTab('dark')}>
            ☾ Dark
          </Button>
          <Button key="tab-light" variant={tab === 'light' ? 'primary' : 'secondary'} onPress={goTab('light')}>
            ☀ Light
          </Button>
          <Button key="tab-favorites" variant={tab === 'favorites' ? 'primary' : 'secondary'} onPress={goTab('favorites')}>
            ★ Favorites
          </Button>
          <Button key="tab-maker" variant={tab === 'maker' ? 'primary' : 'secondary'} onPress={goTab('maker')}>
            ✎ Theme Maker
          </Button>
          <Button key="tab-appearance" variant={tab === 'appearance' ? 'primary' : 'secondary'} onPress={goTab('appearance')}>
            ◐ Appearance
          </Button>
          <Button key="tab-settings" variant={tab === 'settings' ? 'primary' : 'secondary'} onPress={goTab('settings')}>
            ⚙ Settings
          </Button>
        </Box>

        {guard(
          tab === 'dark' ? 'Dark themes' : tab === 'light' ? 'Light themes' : tab === 'favorites' ? 'Favorites' : tab === 'maker' ? 'The theme maker' : tab === 'appearance' ? 'Appearance' : 'Settings',
          tab === 'dark' ? modeTab('dark') : tab === 'light' ? modeTab('light') : tab === 'favorites' ? favoritesTab : tab === 'maker' ? makerTab : tab === 'appearance' ? settingsTab('appearance') : settingsTab('settings'),
        )}
      </Box>
    )
  })
}
