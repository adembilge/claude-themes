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
  // ---- light ----
  theme('light', 'catppuccin-latte', 'Catppuccin Latte', 'soft pastels on cream',
    ['#dce0e8', '#e6e9ef', '#eff1f5', '#eff1f5'], ['#4c4f69', '#5c5f77', '#6c6f85'], '#8839ef',
    ['#d20f39', '#40a02b', '#df8e1d', '#1e66f5']),
  theme('light', 'github-light', 'GitHub Light', 'crisp white, familiar blue',
    ['#eaeef2', '#f6f8fa', '#ffffff', '#ffffff'], ['#1f2328', '#424a53', '#656d76'], '#0969da',
    ['#cf222e', '#1a7f37', '#9a6700', '#8250df']),
  theme('light', 'solarized-light', 'Solarized Light', 'warm cream, calibrated contrast',
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

function lookFor(id: string): ThemeSetArgs | undefined {
  const hit = LOOKS.get(id)

  if (hit !== undefined) {
    return hit
  }
  const p = BY_ID.get(id)

  if (p === undefined) {
    return undefined
  }
  const made = look(p)

  LOOKS.set(id, made)

  return made
}

// "Rosé Pine", "rose_pine" and "rose-pine" all name the same theme.
const idOf = (text: string): string =>
  text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s_]+/g, '-')

type State = { id: string }

// Change the tag if the value's shape changes: it declines what an earlier version stored.
const current = atom({ plugin: 'desktop-themes', key: 'current' } as const, { id: DEFAULT_THEME } as State, {
  shape: 'current-3',
})

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

// Applies and remembers one choice; every path (card press, command) goes through here.
// Declared at the top of the file because the engine only follows `$` into top-level functions.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apply($: any, id: string, save: boolean): Promise<void> {
  const chosen = lookFor(id)

  if (chosen !== undefined) {
    // Nothing is reported if no client draws themes yet; the theme still stands for one that attaches.
    await $.theme.set(chosen)
  }
  await update($, current, () => ({ id }))

  if (save) {
    await $.store.set(STORE_KEY, id)
  }
}

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
    const id = typeof saved === 'string' && BY_ID.has(saved) ? saved : DEFAULT_THEME

    await apply($, id, false)

    return next(e)
  })

  // The command is the person's own ask, so the pane is placed at any width.
  on('command.run', { command: 'claude-themes' }, async ($, e) => {
    const want = idOf(e.args)

    if (want !== '') {
      const found = BY_ID.get(want)

      if (found === undefined) {
        return { text: `No theme called "${e.args.trim()}". Try: ${THEMES.map(p => p.id).join(', ')}` }
      }
      await apply($, found.id, true)

      return { text: `Theme: ${found.name} (${found.mode})` }
    }
    await $.ui.open({ id: PANE, title: 'Themes' })

    return { text: '' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Link } = $.ui.resolve(e)
    // The terminal has no Svg; it keeps a preview and dots built from text.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Svg = e.surface === 'terminal' ? undefined : ($.ui.resolve(e) as any).Svg
    const now = await read($, current)
    const cur = BY_ID.get(now.id) ?? DEFAULT
    const [c0, c1, c2, c3] = cur.surfaces

    const pick = (id: string) => async () => {
      await apply($, id, true)
    }

    return (
      <Box flexDirection="column" gap={1} paddingX={1}>
        {Svg === undefined ? null : (
          <Svg source={bannerSvg(cur)} alt="Animated band in the current theme's colors" width={264} height={30} />
        )}
        <Box flexDirection="column">
          <Text weight="bold" size="heading">Themes</Text>
          <Text dimColor>{THEMES.length} themes. Each one sets the app to its own dark or light look.</Text>
        </Box>

        <Box flexDirection="column" alignItems="flex-start" gap={1} padding={1} borderStyle="bold" borderColor={cur.accent} backgroundColor={c0}>
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
            <Svg source={previewSvg(cur, true)} alt={`${cur.name} preview`} width={264} height={132} />
          )}
          <Text weight="bold" color={cur.text[0]}>Active: {cur.name} ({cur.mode})</Text>
        </Box>

        {GROUPS.map(g => (
          <Box key={`group-${g.mode}`} flexDirection="column" gap={1}>
            <Text weight="bold">{g.title}</Text>
            {THEMES.filter(p => p.mode === g.mode).map(p => {
              const isCurrent = p.id === now.id
              const [s0, s1, , s3] = p.surfaces
              const dots = [p.accent, p.roles.danger, p.roles.success, p.roles.warning, p.roles.pro]

              return (
                <Box
                  key={`row-${p.id}`}
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
                    {/* The desktop draws a Button in the app's current theme and ignores a Text color inside it, so the name button sits on a rounded plate of that same theme: it stays readable on a row of the other mode. */}
                    <Box backgroundColor={c2} borderStyle="round" borderColor={c2}>
                      <Button key={`pick-${p.id}`} variant={isCurrent ? 'primary' : 'secondary'} onPress={pick(p.id)}>
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
                </Box>
              )
            })}
          </Box>
        ))}

        <Text dimColor>
          Documents and source code: <Link href={REPO_URL}>{REPO_URL}</Link>
        </Text>
      </Box>
    )
  })
}
