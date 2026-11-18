import { atom, read, update } from 'claude-code'
import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'

const PANE = 'desktop-themes'
const REPO_URL = 'https://github.com/adembilge/claude-themes'
const STORE_KEY = 'theme'
const DEFAULT_THEME = 'catppuccin-mocha'

type Mode = 'dark' | 'light'

type Surfaces = [string, string, string, string]
type Text3 = [string, string, string]

type Roles = { danger: string; success: string; warning: string; pro: string }

/**
 * One well-known UI theme. A theme is either dark or light; picking it sets the app's mode too.
 * Surfaces run page -> card -> panel -> menu. Dark ones get lighter along the list; light ones
 * get lighter too, and the last two are one color (make-colors requires it).
 */
type Theme = {
  id: string
  name: string
  note: string
  mode: Mode
  surfaces: Surfaces
  text: Text3
  accent: string
  roles: Roles
}

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

const THEMES: Theme[] = [
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
  theme('dark', 'everforest', 'Everforest', 'calm forest greens, easy on the eyes',
    ['#232a2e', '#2d353b', '#343f44', '#3d484d'], ['#d3c6aa', '#b5ab93', '#9da9a0'], '#a7c080',
    ['#e67e80', '#a7c080', '#dbbc7f', '#d699b6']),
  theme('dark', 'material-ocean', 'Material Ocean', 'deep navy, soft blue',
    ['#090b10', '#0f111a', '#1a1c25', '#292d3e'], ['#eeffff', '#b0bec5', '#8f93a2'], '#82aaff',
    ['#f07178', '#c3e88d', '#ffcb6b', '#c792ea']),
  theme('dark', 'kanagawa-wave', 'Kanagawa Wave', 'ink and indigo',
    ['#16161d', '#1f1f28', '#2a2a37', '#363646'], ['#dcd7ba', '#c8c093', '#9c9a82'], '#7e9cd8',
    ['#e46876', '#98bb6c', '#e6c384', '#957fb8']),
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
  theme('light', 'everforest-light', 'Everforest Light', 'warm cream with moss green',
    ['#efebd4', '#f4f0d9', '#fdf6e3', '#fdf6e3'], ['#4f5b58', '#5f6c68', '#6e7a70'], '#8da101',
    ['#f85552', '#8da101', '#dfa000', '#df69ba']),
  theme('light', 'notion', 'Notion', 'warm white paper, ink text',
    ['#efefed', '#f7f6f3', '#ffffff', '#ffffff'], ['#37352f', '#5a5852', '#787774'], '#2383e2',
    ['#eb5757', '#448361', '#cb912f', '#9065b0']),
  theme('light', 'xcode', 'Xcode', 'clean light editor, system blue',
    ['#e8e8e8', '#f2f2f2', '#ffffff', '#ffffff'], ['#262626', '#4d4d4d', '#6e6e6e'], '#0b6bcb',
    ['#d12f1b', '#1f8a50', '#a36b00', '#9b2393']),
]

const BY_ID = new Map(THEMES.map(t => [t.id, t]))
const DEFAULT = BY_ID.get(DEFAULT_THEME) ?? THEMES[0]

const GROUPS: { mode: Mode; title: string }[] = [
  { mode: 'dark', title: '☾ Dark themes' },
  { mode: 'light', title: '☀ Light themes' },
]

function look(p: Theme): ThemeSetArgs {
  const { theme: colors } = makeColors({
    label: p.name,
    only: p.mode,
    roles: { accent: p.accent, ...p.roles },
    [p.mode]: {
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

  return { colors }
}

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
  'kanagawa-wave': 'kanagawa-wave',
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

type BackdropStyle = 'glow' | 'grid' | 'dots' | 'waves' | 'stars' | 'aurora'

const STYLES: { value: BackdropStyle; label: string }[] = [
  { value: 'glow', label: 'Glow' },
  { value: 'grid', label: 'Grid' },
  { value: 'dots', label: 'Dots' },
  { value: 'waves', label: 'Waves' },
  { value: 'stars', label: 'Stars' },
  { value: 'aurora', label: 'Aurora' },
]
const BLURS = [0, 8, 16, 24, 32]
// How solid the frosted panels are over a scene: lower shows more of it.
const OPACITIES = [0.2, 0.4, 0.6, 0.8]
const MAX_PROJECTS = 50
const PROJECTS_KEY = 'projects'

/** A folder as one stable key: slashes forward, no trailing slash, lower case. */
const projectKey = (cwd: string): string => cwd.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()

/** The last part of a folder's path, for showing. */
const folderName = (cwd: string): string => cwd.replace(/\\/g, '/').replace(/\/+$/, '').split('/').pop() || cwd

/**
 * A scene behind the conversation, drawn in the theme's own colors. It fills the window (`slice`), and
 * the app frosts its panels over it. Everything but the glow is a scene; the glow is a plain gradient.
 */
function sceneSvg(p: Theme, style: Exclude<BackdropStyle, 'glow'>): string {
  const [s0, s1] = p.surfaces
  const head = '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">'
  // The panels are frosted over the scene, so it has to be bold enough to show through them.
  const base = `<defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(s1, p.accent, 0.12)}"/><stop offset="1" stop-color="${s0}"/></linearGradient></defs><rect width="1600" height="1000" fill="url(#b)"/>`
  let art = ''

  if (style === 'grid') {
    const lines: string[] = []

    for (let x = 0; x <= 1600; x += 64) {
      lines.push(`M${x} 0V1000`)
    }

    for (let y = 0; y <= 1000; y += 64) {
      lines.push(`M0 ${y}H1600`)
    }
    art = `<path d="${lines.join('')}" stroke="${p.accent}" stroke-opacity="0.5" stroke-width="3" fill="none"/>`
  } else if (style === 'dots') {
    const dots: string[] = []

    for (let y = 32; y < 1000; y += 48) {
      for (let x = 32; x < 1600; x += 48) {
        dots.push(`M${x} ${y}h0.1`)
      }
    }
    art = `<path d="${dots.join('')}" stroke="${p.accent}" stroke-opacity="0.6" stroke-width="7" stroke-linecap="round" fill="none"/>`
  } else if (style === 'waves') {
    // Each layer repeats every 800 and slides one period, so the loop has no seam.
    const wave = (y: number, amp: number, color: string, op: number, dur: number) => {
      let d = `M-800 ${y}`

      for (let i = 0; i < 9; i++) {
        d += `Q${-800 + i * 400 + 200} ${y + (i % 2 === 0 ? -amp : amp)} ${-800 + (i + 1) * 400} ${y}`
      }

      return `<path d="${d}V1000H-800Z" fill="${color}" fill-opacity="${op}"><animateTransform attributeName="transform" type="translate" values="0 0;-800 0" dur="${dur}s" repeatCount="indefinite"/></path>`
    }

    art = wave(560, 90, p.accent, 0.22, 38) + wave(690, 75, p.roles.pro, 0.24, 52) + wave(820, 60, p.accent, 0.3, 70)
  } else if (style === 'stars') {
    // A fixed scatter, so the sky is the same every time; some of the stars slowly twinkle.
    let seed = 7
    const rand = () => {
      seed = (seed * 16807) % 2147483647

      return seed / 2147483647
    }
    const stars: string[] = []

    for (let i = 0; i < 130; i++) {
      const x = Math.round(rand() * 1600)
      const y = Math.round(rand() * 1000)
      const r = (0.8 + rand() * 2.2).toFixed(1)
      const color = i % 5 === 0 ? p.accent : p.text[0]
      const twinkle =
        i % 3 === 0
          ? `<animate attributeName="fill-opacity" values="0.85;0.2;0.85" dur="${(3 + rand() * 5).toFixed(1)}s" begin="${(rand() * 4).toFixed(1)}s" repeatCount="indefinite"/>`
          : ''

      stars.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" fill-opacity="0.7">${twinkle}</circle>`)
    }
    art = stars.join('')
  } else {
    const blob = (cx: number, cy: number, rx: number, ry: number, color: string, op: number, dx: number, dur: number) =>
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${color}" fill-opacity="${op}"><animate attributeName="cx" values="${cx};${cx + dx};${cx}" dur="${dur}s" repeatCount="indefinite"/></ellipse>`

    art =
      '<defs><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="80"/></filter></defs><g filter="url(#f)">' +
      blob(420, 300, 520, 200, p.accent, 0.6, 360, 24) +
      blob(1150, 520, 480, 220, p.roles.pro, 0.5, -380, 31) +
      blob(800, 820, 580, 180, p.roles.success, 0.38, 300, 40) +
      '</g>'
  }

  return `${head}${base}${art}</svg>`
}

/** The glow as a picture, the same radial blend the glow backdrop paints. */
function glowSvg(p: Theme): string {
  const [s0, s1, s2] = p.surfaces

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="g" cx="0.5" cy="0.5" r="0.7"><stop offset="0" stop-color="${mix(s2, p.accent, 0.12)}"/><stop offset="0.55" stop-color="${mix(s1, p.accent, 0.04)}"/><stop offset="1" stop-color="${s0}"/></radialGradient></defs><rect width="1600" height="1000" fill="url(#g)"/></svg>`
}

/** A small picture of one backdrop style in a theme, for choosing among them. */
function thumbSvg(p: Theme, style: BackdropStyle): string {
  const full = style === 'glow' ? glowSvg(p) : sceneSvg(p, style)

  return full.replace('width="1600" height="1000"', 'width="84" height="52"')
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

type Tab = 'dark' | 'light' | 'favorites' | 'maker' | 'settings'

type Draft = { name: string; accent: string; mode: Mode }

type State = {
  id: string
  tab: Tab
  q: string
  favs: string[]
  backdrop: boolean
  highContrast: boolean
  codePair: boolean
  auto: AutoCfg
  autoPeriod: string
  backdropStyle: BackdropStyle
  glassBlur: number
  glassOpacity: number
  issue: string
  cwd: string
  projects: Record<string, string>
  custom: Theme[]
  draft: Draft
  msg: string
  importText: string
}

type Prefs = {
  favs: string[]
  backdrop: boolean
  highContrast: boolean
  codePair: boolean
  auto: AutoCfg
  backdropStyle: BackdropStyle
  glassBlur: number
  glassOpacity: number
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
    auto: DEFAULT_AUTO,
    autoPeriod: '',
    backdropStyle: 'glow',
    glassBlur: 0,
    glassOpacity: 0.4,
    issue: '',
    cwd: '',
    projects: {},
    custom: [],
    draft: { name: '', accent: '#d98a4e', mode: 'dark' },
    msg: '',
    importText: '',
  } as State,
  { shape: 'current-8' },
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
    backdropStyle: STYLES.some(x => x.value === r.backdropStyle) ? (r.backdropStyle as BackdropStyle) : 'glow',
    glassBlur: BLURS.includes(r.glassBlur as number) ? (r.glassBlur as number) : 0,
    glassOpacity: OPACITIES.includes(r.glassOpacity as number) ? (r.glassOpacity as number) : 0.4,
    auto: {
      on: a.on === true,
      day: id(a.day, DEFAULT_AUTO.day),
      night: id(a.night, DEFAULT_AUTO.night),
      from: hour(a.from, DEFAULT_AUTO.from),
      to: hour(a.to, DEFAULT_AUTO.to),
    },
  }
}

/** The color `t` of the way from `a` to `b`, both six-digit hex. */
function mix(a: string, b: string, t: number): `#${string}` {
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16)
  const out = [0, 1, 2].map(i => Math.round(ch(a, i) * (1 - t) + ch(b, i) * t).toString(16).padStart(2, '0')).join('')

  return `#${out}`
}

/** A soft glow of the theme's accent, centered on the page, easing out to its darkest surface. */
function backdropFor(p: Theme): ThemeSetArgs['backdrop'] {
  const [s0, s1, s2] = p.surfaces

  return {
    gradient: {
      shape: 'radial',
      stops: [
        { at: 0, color: mix(s2, p.accent, 0.12) },
        { at: 0.55, color: mix(s1, p.accent, 0.04) },
        { at: 1, color: s0 as `#${string}` },
      ],
    },
  }
}

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

const HEX = /^#[0-9a-f]{6}$/i
const isHex = (v: unknown): v is string => typeof v === 'string' && HEX.test(v)
const CODE_PREFIX = 'claude-themes:'

const rgbOf = (h: string): [number, number, number] =>
  [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]

function lum(h: string): number {
  const [r, g, b] = rgbOf(h).map(v => {
    const c = v / 255

    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio of two six-digit hex colors. */
function contrast(a: string, b: string): number {
  const x = lum(a)
  const y = lum(b)

  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

function hslHex(h: number, s: number, l: number): string {
  const sat = s / 100
  const lig = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sat * Math.min(lig, 1 - lig)
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))

  return `#${[f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('')}`
}

function hueOf(hex: string): number {
  const [r, g, b] = rgbOf(hex).map(v => v / 255) as [number, number, number]
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)

  if (d === 0) {
    return 0
  }
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4

  return (h * 60 + 360) % 360
}

const slug = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24) || 'theme'

const cleanName = (name: string): string => name.replace(/[^\p{L}\p{N} _.&'-]/gu, '').trim().slice(0, 24)

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

/** Why a palette would be refused, or null when it is fine. */
function validateTheme(t: Theme): string | null {
  if (![...t.surfaces, ...t.text, t.accent, ...Object.values(t.roles)].every(isHex)) {
    return 'Every color must be a six-digit hex such as #d98a4e.'
  }

  if (t.surfaces.some(s => contrast(t.text[0], s) < 4.5) || t.surfaces.some(s => contrast(t.text[2], s) < 3)) {
    return 'The text would be too faint on that background. Try another accent or the other base.'
  }

  try {
    look(t)
  } catch {
    return 'The app would refuse this palette: surfaces must run from the page to the menu, each one lighter.'
  }

  return null
}

function validateDraft(d: Draft): { theme: Theme } | { error: string } {
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

  return error === null ? { theme } : { error }
}

/** A theme from anything that holds one: a saved value or a pasted code. Null when it is not a safe palette. */
function sanitizeTheme(o: unknown): Theme | null {
  if (typeof o !== 'object' || o === null) {
    return null
  }
  const r = o as Record<string, unknown>
  const name = typeof r.name === 'string' ? cleanName(r.name) : ''
  const roles = (typeof r.roles === 'object' && r.roles !== null ? r.roles : {}) as Record<string, unknown>
  const { danger, success, warning, pro } = roles
  const mode = r.mode

  if (name === '' || (mode !== 'dark' && mode !== 'light')) {
    return null
  }

  if (!Array.isArray(r.surfaces) || r.surfaces.length !== 4 || !r.surfaces.every(isHex)) {
    return null
  }

  if (!Array.isArray(r.text) || r.text.length !== 3 || !r.text.every(isHex)) {
    return null
  }

  if (!isHex(r.accent) || !isHex(danger) || !isHex(success) || !isHex(warning) || !isHex(pro)) {
    return null
  }
  const low = (v: string) => v.toLowerCase()
  const t: Theme = {
    id: `my-${slug(name)}`,
    name,
    note: `your ${mode} theme`,
    mode,
    surfaces: r.surfaces.map(low) as Surfaces,
    text: r.text.map(low) as Text3,
    accent: low(r.accent),
    roles: { danger: low(danger), success: low(success), warning: low(warning), pro: low(pro) },
  }

  return validateTheme(t) === null ? t : null
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

/** The shareable text of a theme: a prefix and its palette as JSON. */
function themeToCode(t: Theme): string {
  return `${CODE_PREFIX}${JSON.stringify({ name: t.name, mode: t.mode, surfaces: t.surfaces, text: t.text, accent: t.accent, roles: t.roles })}`
}

function parseCode(text: string): { theme: Theme } | { error: string } {
  const code = text.trim()

  if (!code.startsWith(CODE_PREFIX)) {
    return { error: `That is not a theme code. It starts with "${CODE_PREFIX}".` }
  }
  let data: unknown

  try {
    data = JSON.parse(code.slice(CODE_PREFIX.length))
  } catch {
    return { error: 'The code is damaged: it could not be read.' }
  }
  const theme = sanitizeTheme(data)

  return theme === null
    ? { error: 'The code holds a palette the app would refuse. Check its colors and the text contrast.' }
    : { theme }
}

// The engine only follows `$` into top-level functions, so every helper that uses it is one.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function savePrefs($: any): Promise<void> {
  const s = await read($, current)

  await $.store.set(PREFS_KEY, { favs: s.favs, backdrop: s.backdrop, highContrast: s.highContrast, codePair: s.codePair, auto: s.auto, backdropStyle: s.backdropStyle, glassBlur: s.glassBlur, glassOpacity: s.glassOpacity })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function patch($: any, change: Partial<State>): Promise<void> {
  await update($, current, (s: State) => ({ ...s, ...change }))
}

// Applies and remembers one choice; every path (card press, command) goes through here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apply($: any, id: string, save: boolean): Promise<void> {
  const before = await read($, current)
  const p = themeById(id, before.custom)

  if (p === undefined) {
    return
  }

  try {
    const base = lookFor(p)
    const code = before.codePair ? CODE_THEMES[p.id] : undefined
    const chosen = {
      ...base,
      colors: {
        ...base.colors,
        ...(code === undefined ? {} : { codeTheme: { [p.mode]: code } }),
        ...(before.highContrast ? { contrast: 'more' } : {}),
      },
    } as ThemeSetArgs

    // Nothing is reported if no client draws themes yet; the theme still stands for one that attaches.
    try {
      const backdrop = !before.backdrop
        ? undefined
        : before.backdropStyle === 'glow'
          ? backdropFor(p)
          : { scene: `style-${before.backdropStyle}`, glass: { blur: before.glassBlur, opacity: before.glassOpacity } }

      const result = await $.theme.set(backdrop === undefined ? chosen : ({ ...chosen, backdrop } as ThemeSetArgs))

      // An answer that says nothing draws it is kept, to be shown, instead of being lost.
      await patch($, { issue: result?.isDrawn === false ? `not drawn: ${String(result.reason ?? '').slice(0, 140)}` : `drawn as ${String(result?.requestId ?? '?')}` })
    } catch (err) {
      // A surface that refuses the backdrop still gets the colors, and the person gets to see why.
      await patch($, { issue: `refused: ${String(err).slice(0, 140)}` })
      await $.theme.set(chosen)
    }
  } catch {
    // A palette that cannot be built is skipped; the current look stays.
    return
  }
  await update($, current, (s: State) => ({ ...s, id }))

  // A scene is drawn from the theme's colors, so it is drawn again for the new one.
  try {
    $.ui.invalidate('ui.render')
  } catch {
    // nothing is drawn yet
  }

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
async function setBackdrop($: any, change: Partial<Pick<State, 'backdropStyle' | 'glassBlur' | 'glassOpacity'>>): Promise<void> {
  const s = await read($, current)

  await patch($, change)
  await apply($, s.id, false)
  await savePrefs($)
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

type Flag = 'backdrop' | 'codePair' | 'highContrast'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function toggleFlag($: any, key: Flag): Promise<void> {
  const s = await read($, current)

  await patch($, { [key]: !s[key] } as Partial<State>)
  await apply($, s.id, false)
  await savePrefs($)
}

/** Applies the day or night theme when the period has changed since it was last applied (or when `force`). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runAuto($: any, force: boolean): Promise<void> {
  const s = await read($, current)

  if (!s.auto.on) {
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
  await update($, current, (s: State) => ({ ...s, auto: { ...s.auto, ...change } }))
  await savePrefs($)
  await runAuto($, true)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveCustom($: any): Promise<void> {
  const s = await read($, current)

  await $.store.set(CUSTOM_KEY, s.custom)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function addCustom($: any, t: Theme): Promise<void> {
  await update($, current, (s: State) => ({
    ...s,
    custom: [t, ...s.custom.filter(c => c.id !== t.id)].slice(0, MAX_CUSTOM),
  }))
  await saveCustom($)
  await apply($, t.id, true)
  await patch($, { msg: `Saved "${t.name}" and applied it.` })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveDraft($: any): Promise<void> {
  const s = await read($, current)
  const made = validateDraft(s.draft)

  if ('error' in made) {
    await patch($, { msg: made.error })

    return
  }
  await addCustom($, made.theme)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function importCode($: any, text: string): Promise<void> {
  const made = parseCode(text)

  if ('error' in made) {
    await patch($, { msg: made.error })

    return
  }
  await addCustom($, made.theme)
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
async function copyCode($: any, surface: string): Promise<void> {
  const s = await read($, current)
  const t = themeById(s.id, s.custom) ?? DEFAULT

  try {
    const result = await $.ui.copy({ text: themeToCode(t), surface })

    await patch($, { msg: result?.isCopied === false ? 'Could not copy here.' : `Copied the code for ${t.name}.` })
  } catch {
    await patch($, { msg: 'Could not copy here.' })
  }
}

// How many times the app has asked this mod to draw a scene, and for which: shown in Settings, so a
// backdrop that stays blank can be told apart from one the app never asked for.
let sceneAsks = 0
let lastAsk = ''

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // Registered first so a failure while restoring the theme cannot leave /claude-themes missing.
    await $.command.register({
      name: 'claude-themes',
      description: 'Open the theme gallery: /claude-themes, or /claude-themes <name> to switch directly',
      argumentHint: '[theme name]',
      immediate: true,
    })
    const saved = await $.store.get(STORE_KEY)
    const custom = cleanCustom(await $.store.get(CUSTOM_KEY))
    const known = new Set([...BY_ID.keys(), ...custom.map(t => t.id)])
    const id = typeof saved === 'string' && known.has(saved) ? saved : DEFAULT_THEME

    // Your own themes, favorites and the backdrop switch come back before the theme is drawn.
    await patch($, {
      ...cleanPrefs(await $.store.get(PREFS_KEY), known),
      custom,
      cwd: typeof e.cwd === 'string' ? e.cwd : '',
      projects: cleanProjects(await $.store.get(PROJECTS_KEY), known),
    })
    await apply($, id, false)
    await runAuto($, true)

    // This folder's own theme comes last, so it wins over the saved one and the clock.
    const here = await read($, current)
    const mine = themeById(here.projects[projectKey(here.cwd)] ?? '', here.custom)

    if (mine !== undefined && mine.id !== here.id) {
      await apply($, mine.id, false)
      say($, `${folderName(here.cwd)}: using ${mine.name}.`)
    }

    return next(e)
  })

  // The day and night switch is checked as each prompt is sent; a failure here never holds a prompt back.
  on('prompt.submit', async ($, e, next) => {
    try {
      await runAuto($, false)
    } catch {
      // the next prompt tries again
    }

    return next(e)
  })

  // The scene behind the conversation, in the current theme's colors. Another mod's scene is left alone.
  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.props.plugin !== 'desktop-themes' || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }
    sceneAsks += 1
    lastAsk = `${e.surface} / ${String(e.props.scene)}`
    const now = await read($, current)
    const p = themeById(now.id, now.custom) ?? DEFAULT
    const style = STYLES.find(x => x.value === now.backdropStyle && x.value !== 'glow')?.value ?? 'grid'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { Svg } = $.ui.resolve(e) as any

    return <Svg source={sceneSvg(p, style as Exclude<BackdropStyle, 'glow'>)} alt={`${p.name} backdrop`} />
  })

  // The command is the person's own ask, so the pane is placed at any width.
  on('command.run', { command: 'claude-themes' }, async ($, e) => {
    const want = idOf(e.args)

    if (want !== '') {
      const mine = (await read($, current)).custom
      const found = themeById(want, mine)

      if (found === undefined) {
        return { text: `No theme called "${e.args.trim()}". Try: ${[...THEMES, ...mine].map(p => p.id).join(', ')}` }
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
    const [c0, c1, c2] = cur.surfaces
    const tab: Tab = now.tab === 'light' || now.tab === 'settings' || now.tab === 'favorites' || now.tab === 'maker' ? now.tab : 'dark'
    const q = now.q.trim().toLowerCase()
    const matches = (p: Theme) => q === '' || `${p.name} ${p.note} ${p.id} ${p.mode}`.toLowerCase().includes(q)

    const pick = (id: string) => async () => {
      await apply($, id, true)
    }
    const goTab = (t: Tab) => async () => {
      await patch($, { tab: t })
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
          <Svg source={previewSvg(cur, true)} alt={`${cur.name} preview`} width={360} height={180} />
        )}
        <Text weight="bold" color={cur.text[0]}>Active: {cur.name} ({cur.mode})</Text>
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
        await importCode($, v)
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
          <Text dimColor>Copy the code of the theme you are on to share it, or paste a code below and press Enter to add one.</Text>
          <Box>
            <Button
              key="share-copy"
              onPress={async (press: { surface: string }) => {
                await copyCode($, press.surface)
              }}
            >
              Copy current theme code
            </Button>
          </Box>
          {field('share-import', 'Import', 'Paste a code, press Enter', now.importText, setImport, runImport)}
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

    const settingsTab = () => {
      const c3 = cur.surfaces[3]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const card = (key: string, title: string, children: any) => (
        <Box key={`card-${key}`} flexDirection="column" gap={1} padding={1} borderStyle="round" borderColor={c3} backgroundColor={c0}>
          <Text weight="bold" size="heading">{title}</Text>
          {children}
        </Box>
      )
      // A title and its one line on the left, one compact switch on the right.
      const toggleRow = (key: string, title: string, about: string, isOn: boolean, toggle: () => Promise<void>) => (
        <Box key={`row-${key}`} alignItems="center" gap={1}>
          <Box flexDirection="column" flexGrow={1}>
            <Text weight="bold">{title}</Text>
            <Text dimColor>{about}</Text>
          </Box>
          <Button key={key} variant={isOn ? 'primary' : 'secondary'} onPress={toggle}>
            {isOn ? 'On' : 'Off'}
          </Button>
        </Box>
      )
      const themeOptions = all.map(p => ({ value: p.id, label: p.name }))
      const hourOptions = Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: `${String(h).padStart(2, '0')}:00` }))
      const picker = (key: string, label: string, options: { value: string; label: string }[], value: string, set: (v: string) => Promise<void>) => (
        <Select key={key} label={label} options={options} value={value} onSelect={set} />
      )

      const appearance = card(
        'appearance',
        'Appearance',
        <Box flexDirection="column" gap={1}>
          {toggleRow('backdrop-toggle', 'Backdrop', "Something soft behind the conversation, in the theme's colors.", now.backdrop, async () => {
            await toggleFlag($, 'backdrop')
          })}
          {!now.backdrop || now.issue === '' ? null : (
            <Text color={/^(not drawn|refused)/.test(now.issue) ? cur.roles.danger : undefined} dimColor={!/^(not drawn|refused)/.test(now.issue)}>
              {`The app said: ${now.issue}. Scene requests so far: ${sceneAsks}${lastAsk === '' ? '' : ` (last: ${lastAsk})`}.`}
            </Text>
          )}
          {!now.backdrop ? null : (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>Style</Text>
              <Box gap={1} flexWrap="wrap">
                {STYLES.map(st => {
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
                      {Svg === undefined ? null : <Svg source={thumbSvg(cur, st.value)} alt={`${st.label} backdrop`} width={84} height={52} />}
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
              {now.backdropStyle === 'glow' ? null : (
                <Box flexDirection="column" gap={1}>
                  <Text dimColor>Panel opacity: lower shows more of the scene</Text>
                  <Box gap={1} flexWrap="wrap">
                    {OPACITIES.map(o => (
                      <Button
                        key={`glass-opacity-${Math.round(o * 100)}`}
                        variant={now.glassOpacity === o ? 'primary' : 'secondary'}
                        onPress={async () => {
                          await setBackdrop($, { glassOpacity: o })
                        }}
                      >
                        {`${Math.round(o * 100)}%`}
                      </Button>
                    ))}
                  </Box>
                  <Text dimColor>Panel blur</Text>
                  <Box gap={1} flexWrap="wrap">
                    {BLURS.map(b => (
                      <Button
                        key={`glass-blur-${b}`}
                        variant={now.glassBlur === b ? 'primary' : 'secondary'}
                        onPress={async () => {
                          await setBackdrop($, { glassBlur: b })
                        }}
                      >
                        {b === 0 ? 'None' : String(b)}
                      </Button>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
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
        </Box>,
      )

      const dayNight = card(
        'daynight',
        'Day and night',
        <Box flexDirection="column" gap={1}>
          {toggleRow('auto-toggle', 'Switch by the hour', 'Checked when a session starts and when you send a prompt. A theme you pick yourself stays until the next switch.', now.auto.on, async () => {
            await setAuto($, { on: !now.auto.on })
          })}
          {!now.auto.on ? null : Select === undefined ? (
            <Text dimColor>Pickers are not available here.</Text>
          ) : (
            <Box flexDirection="column" gap={1}>
              <Box gap={1} flexWrap="wrap">
                {picker('auto-day', 'Day theme', themeOptions, now.auto.day, async v => {
                  await setAuto($, { day: v })
                })}
                {picker('auto-night', 'Night theme', themeOptions, now.auto.night, async v => {
                  await setAuto($, { night: v })
                })}
              </Box>
              <Box gap={1} flexWrap="wrap">
                {picker('auto-from', 'Day starts', hourOptions, String(now.auto.from), async v => {
                  await setAuto($, { from: Number(v) })
                })}
                {picker('auto-to', 'Night starts', hourOptions, String(now.auto.to), async v => {
                  await setAuto($, { to: Number(v) })
                })}
              </Box>
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
              'This project',
              <Box flexDirection="column" gap={1}>
                <Text dimColor>
                  {`${folderName(now.cwd)}: ${mineHere === undefined ? 'no theme of its own.' : `uses ${mineHere.name} whenever a session starts here.`}`}
                </Text>
                <Box gap={1} flexWrap="wrap">
                  <Button
                    key="project-use"
                    onPress={async () => {
                      await setProject($, now.id)
                    }}
                  >
                    {`Use ${cur.name} here`}
                  </Button>
                  {mineHere === undefined ? null : (
                    <Button
                      key="project-clear"
                      onPress={async () => {
                        await setProject($, null)
                      }}
                    >
                      Stop using one here
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

      return (
        <Box flexDirection="column" gap={1}>
          {guard('Appearance', () => appearance)}
          {guard('Readability', () => readability)}
          {guard('Day and night', () => dayNight)}
          {project === null ? null : guard('This project', () => project)}
          {guard('About', () => about)}
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
            ✎ Maker
          </Button>
          <Button key="tab-settings" variant={tab === 'settings' ? 'primary' : 'secondary'} onPress={goTab('settings')}>
            Settings
          </Button>
        </Box>

        {guard(
          tab === 'dark' ? 'Dark themes' : tab === 'light' ? 'Light themes' : tab === 'favorites' ? 'Favorites' : tab === 'maker' ? 'The maker' : 'Settings',
          tab === 'dark' ? modeTab('dark') : tab === 'light' ? modeTab('light') : tab === 'favorites' ? favoritesTab : tab === 'maker' ? makerTab : settingsTab,
        )}
      </Box>
    )
  })
}
