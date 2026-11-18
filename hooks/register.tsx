import { atom, read, update } from 'claude-code'
import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'

const PANE = 'deskmod'
const STORE_KEY = 'theme'
const MODE_KEY = 'mode'
const AUTO_KEY = 'auto'
const DEFAULT_THEME = 'espresso'
const DEFAULT_MODE: Mode = 'dark'

// Auto mode: dark from 19:00 until 07:00, light in between.
const NIGHT_FROM = 19
const NIGHT_TO = 7
const CHECK_EVERY_MS = 60_000

type Mode = 'dark' | 'light'

type Surfaces = [string, string, string, string]
type Text3 = [string, string, string]

type Palette = {
  id: string
  name: string
  note: string
  dark: { surfaces: Surfaces; text: Text3 }
  light: { surfaces: Surfaces; text: Text3 }
  accent: { dark: string; light: string }
  roles: { danger: string; success: string; warning: string; pro: string }
}

// ---- colour helpers: the light variants and the new themes are derived from a hue ----

function hsl(h: number, s: number, l: number): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100)
  const f = (n: number): string => {
    const k = (n + h / 30) % 12
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))

    return Math.round(c * 255)
      .toString(16)
      .padStart(2, '0')
  }

  return `#${f(0)}${f(8)}${f(4)}`
}

function darken(hex: string, by: number): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  let h = 0

  if (d !== 0) {
    if (max === r) {
      h = ((g - b) / d) % 6
    } else if (max === g) {
      h = (b - r) / d + 2
    } else {
      h = (r - g) / d + 4
    }
  }

  return hsl((h * 60 + 360) % 360, s * 100, Math.max(0, l * 100 - by))
}

const ROLES = { danger: '#d1495b', success: '#5fa36a', warning: '#d4a02e', pro: '#9b7bc4' }

/**
 * Light surfaces and text tinted by one hue. In light mode the design system runs
 * page (darkest) -> surface-1 -> surface-2 = surface-3 (lightest, one color), and
 * make-colors rejects anything else.
 */
function lightOf(hue: number, sat: number): Palette['light'] {
  const card = hsl(hue, sat, 99)

  return {
    surfaces: [hsl(hue, sat, 93), hsl(hue, sat, 96), card, card],
    text: [hsl(hue, sat + 10, 13), hsl(hue, sat, 30), hsl(hue, sat - 5, 42)],
  }
}

/** A theme made from a hue and an accent, dark and light. */
function fromHue(id: string, name: string, note: string, hue: number, sat: number, accent: string): Palette {
  return {
    id,
    name,
    note,
    dark: {
      surfaces: [hsl(hue, sat, 7), hsl(hue, sat, 10), hsl(hue, sat, 14), hsl(hue, sat, 17)],
      text: [hsl(hue, 30, 92), hsl(hue, 22, 77), hsl(hue, 14, 62)],
    },
    light: lightOf(hue, sat),
    accent: { dark: accent, light: darken(accent, 14) },
    roles: ROLES,
  }
}

/** One of the hand-tuned dark browns; its light variant comes from the hue. */
function brown(
  id: string,
  name: string,
  note: string,
  hue: number,
  surfaces: Surfaces,
  text: Text3,
  accent: string,
  roles: Palette['roles'],
): Palette {
  return {
    id,
    name,
    note,
    dark: { surfaces, text },
    light: lightOf(hue, 28),
    accent: { dark: accent, light: darken(accent, 14) },
    roles,
  }
}

const PALETTES: Palette[] = [
  brown('espresso', 'Espresso', 'near-black brown, amber', 25,
    ['#17110d', '#1f1712', '#281e17', '#2d221a'], ['#f1e6da', '#cfbfae', '#a8978a'], '#d98a4e',
    { danger: '#c2453a', success: '#6b9a4d', warning: '#c99a2e', pro: '#9b78b8' }),
  brown('walnut', 'Walnut', 'medium warm brown, terracotta', 24,
    ['#1d1612', '#261d17', '#30251d', '#352a21'], ['#f0e4d4', '#cbb9a3', '#a3917d'], '#c47a52',
    { danger: '#bf4a3d', success: '#6f9a55', warning: '#c4952e', pro: '#977bb5' }),
  brown('terracotta', 'Terracotta', 'warm charcoal, clay orange', 22,
    ['#1c1816', '#252019', '#2e2822', '#36302a'], ['#f2e9e0', '#d0c4b8', '#ab9e91'], '#c4623a',
    { danger: '#b8323a', success: '#4f8a4b', warning: '#b8860b', pro: '#7a5fa8' }),
  brown('mocha-rose', 'Mocha rose', 'reddish brown, dusty rose', 355,
    ['#1b1415', '#251b1c', '#2f2324', '#35282a'], ['#f3e5e0', '#d1bab5', '#a99591'], '#cf7d70',
    { danger: '#c4403f', success: '#73986a', warning: '#c79a4a', pro: '#a07cb4' }),
  brown('coffee-olive', 'Coffee olive', 'greenish brown, gold', 45,
    ['#1a1710', '#231f15', '#2d281b', '#332e20'], ['#efe8d2', '#c9c1a6', '#a29a80'], '#c09a4a',
    { danger: '#bf4a3a', success: '#7f9f4b', warning: '#cda23a', pro: '#9a7cb0' }),
  brown('chestnut-ember', 'Chestnut ember', 'deep red brown, copper', 15,
    ['#1a0f0c', '#231612', '#2d1d17', '#33211a'], ['#f4e4d8', '#d2bba9', '#a8917f'], '#d2703f',
    { danger: '#c8403a', success: '#6e9650', warning: '#d09a30', pro: '#a07ab8' }),
  fromHue('slate-blue', 'Slate blue', 'cool blue-grey, sky', 215, 22, '#6aa0e8'),
  fromHue('forest', 'Forest', 'deep green, leaf', 140, 20, '#5fb27a'),
  fromHue('midnight-indigo', 'Midnight indigo', 'blue-violet night, periwinkle', 245, 28, '#8a8cf0'),
  fromHue('plum', 'Plum', 'dark purple, orchid', 305, 22, '#c27ad6'),
  fromHue('teal-sea', 'Teal sea', 'deep teal, aqua', 180, 24, '#3fb8b0'),
  fromHue('graphite', 'Graphite', 'neutral grey, steel', 220, 5, '#9aa4b2'),
  fromHue('sage', 'Sage', 'muted grey-green, moss', 100, 14, '#9db577'),
  fromHue('rose-quartz', 'Rose quartz', 'soft pink-grey, rose', 340, 18, '#e58fae'),
  fromHue('lavender-dusk', 'Lavender dusk', 'dusty violet, lilac', 270, 20, '#a98be0'),
  fromHue('crimson-night', 'Crimson night', 'dark wine, crimson', 350, 30, '#e0505f'),
]

const BY_ID = new Map(PALETTES.map(p => [p.id, p]))

function look(p: Palette, mode: Mode): ThemeSetArgs {
  const v = p[mode]
  const { theme } = makeColors({
    label: p.name,
    only: mode,
    roles: { accent: p.accent[mode], ...p.roles },
    [mode]: {
      gray: {
        anchors: {
          'surface-0': v.surfaces[0],
          'surface-1': v.surfaces[1],
          'surface-2': v.surfaces[2],
          'surface-3': v.surfaces[3],
          'text-primary': v.text[0],
          'text-secondary': v.text[1],
          'text-muted': v.text[2],
        },
      },
    },
  })

  return { colors: theme }
}

const LOOKS = new Map<string, ThemeSetArgs>()

function lookFor(id: string, mode: Mode): ThemeSetArgs | undefined {
  const key = `${id}:${mode}`
  const hit = LOOKS.get(key)

  if (hit !== undefined) {
    return hit
  }
  const p = BY_ID.get(id)

  if (p === undefined) {
    return undefined
  }
  const made = look(p, mode)

  LOOKS.set(key, made)

  return made
}

// "Mocha rose", "mocha_rose" and "mocha-rose" all name the same theme.
const idOf = (text: string): string => text.trim().toLowerCase().replace(/[\s_]+/g, '-')

type State = { id: string; mode: Mode; auto: boolean }

// Change the tag if the value's shape changes: it declines what an earlier version stored.
const current = atom(
  { plugin: 'deskmod', key: 'current' } as const,
  { id: DEFAULT_THEME, mode: DEFAULT_MODE, auto: false } as State,
  { shape: 'current-2' },
)

const modeAt = (hour: number): Mode => (hour >= NIGHT_FROM || hour < NIGHT_TO ? 'dark' : 'light')

/**
 * A small drawing of the app in one theme: sidebar, a message, a code line, the input and Send.
 * `live` adds a slow pulse on Send; it only runs where the surface draws the Svg interactively.
 */
function previewSvg(p: Palette, mode: Mode, live: boolean): string {
  const v = p[mode]
  const [s0, s1, s2, s3] = v.surfaces
  const [t0, t1, t2] = v.text
  const accent = p.accent[mode]
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

// Applies and remembers one choice; every path (buttons, command, timer) goes through here.
// Declared at the top of the file because the engine only follows `$` into top-level functions.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apply($: any, next: State, save: boolean): Promise<void> {
  const chosen = lookFor(next.id, next.mode)

  if (chosen !== undefined) {
    // Nothing is reported if no client draws themes yet; the theme still stands for one that attaches.
    await $.theme.set(chosen)
  }
  await update($, current, () => next)

  if (save) {
    await $.store.set(STORE_KEY, next.id)
    await $.store.set(MODE_KEY, next.mode)
    await $.store.set(AUTO_KEY, next.auto)
  }
}

export const register: Register = on => {

  on('session.start', async ($, e, next) => {
    // Registered first so a failure while restoring the theme cannot leave /claude-deskmod missing.
    await $.command.register({
      name: 'claude-deskmod',
      description: 'Open the theme gallery: /claude-deskmod, or /claude-deskmod <name> [light|dark] to switch directly',
      argumentHint: '[name] [light | dark]',
      immediate: true,
    })
    const savedId = await $.store.get(STORE_KEY)
    const savedMode = await $.store.get(MODE_KEY)
    const savedAuto = await $.store.get(AUTO_KEY)
    const id = typeof savedId === 'string' && BY_ID.has(savedId) ? savedId : DEFAULT_THEME
    const auto = savedAuto === true
    let mode: Mode = savedMode === 'light' ? 'light' : DEFAULT_MODE

    if (auto) {
      mode = modeAt(new Date(await $.clock.now()).getHours())
    }
    await apply($, { id, mode, auto }, false)

    if (auto) {
      // Re-check each minute; a manual pick turns auto off, which ends the work here.
      $.clock.every(CHECK_EVERY_MS, async () => {
        const now = await read($, current)

        if (!now.auto) {
          return
        }
        const wanted = modeAt(new Date(await $.clock.now()).getHours())

        if (wanted !== now.mode) {
          await apply($, { ...now, mode: wanted }, false)
        }
      })
    }

    return next(e)
  })

  // The command is the person's own ask, so the pane is placed at any width.
  on('command.run', { command: 'claude-deskmod' }, async ($, e) => {
    const words = e.args.trim().split(/\s+/).filter(w => w !== '')
    const last = words[words.length - 1]?.toLowerCase()
    const asMode: Mode | undefined = last === 'light' || last === 'dark' ? last : undefined
    const want = idOf((asMode === undefined ? words : words.slice(0, -1)).join(' '))
    const now = await read($, current)

    if (want !== '' || asMode !== undefined) {
      const id = want === '' ? now.id : want

      if (!BY_ID.has(id)) {
        return { text: `No theme called "${want}". Try: ${PALETTES.map(p => p.id).join(', ')}` }
      }
      await apply($, { id, mode: asMode ?? now.mode, auto: false }, true)

      return { text: `Theme: ${id} (${asMode ?? now.mode})` }
    }
    await $.ui.open({ id: PANE, title: 'Themes' })

    return { text: '' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    // The terminal has no Svg; it keeps a preview built from boxes.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Svg = e.surface === 'terminal' ? undefined : ($.ui.resolve(e) as any).Svg
    const now = await read($, current)

    const pick = (id: string) => async () => {
      await apply($, { ...now, id, auto: false }, true)
    }
    const setMode = (mode: Mode) => async () => {
      await apply($, { ...now, mode, auto: false }, true)
    }
    const toggleAuto = async () => {
      const auto = !now.auto
      const mode = auto ? modeAt(new Date(await $.clock.now()).getHours()) : now.mode

      await apply($, { ...now, mode, auto }, true)
    }

    return (
      <Box flexDirection="column" gap={1} paddingX={1}>
        <Box flexDirection="column">
          <Text weight="bold" size="heading">Themes</Text>
          <Text dimColor>{PALETTES.length} themes, dark and light. Pick one to recolor the whole app.</Text>
        </Box>
        <Box flexDirection="column" gap={1}>
          <Box gap={1} flexWrap="wrap">
            <Button key="mode-dark" variant={!now.auto && now.mode === 'dark' ? 'primary' : 'secondary'} onPress={setMode('dark')}>
              ☾ Dark
            </Button>
            <Button key="mode-light" variant={!now.auto && now.mode === 'light' ? 'primary' : 'secondary'} onPress={setMode('light')}>
              ☀ Light
            </Button>
            <Button key="mode-auto" variant={now.auto ? 'primary' : 'secondary'} onPress={toggleAuto}>
              ◔ Auto
            </Button>
          </Box>
          <Text dimColor>
            {now.auto ? `Auto is on: dark ${NIGHT_FROM}:00 to ${NIGHT_TO}:00, light otherwise.` : 'Auto switches by the time of day.'}
          </Text>
        </Box>
        <Box flexDirection="column" gap={2}>
          {PALETTES.map(p => {
            const v = p[now.mode]
            const [s0, s1, s2, s3] = v.surfaces
            const accent = p.accent[now.mode]
            const isCurrent = p.id === now.id
            const dots = [accent, p.roles.danger, p.roles.success, p.roles.warning, p.roles.pro]

            return (
              <Box
                key={`card-${p.id}`}
                flexDirection="column"
                alignItems="flex-start"
                gap={1}
                padding={1}
                borderStyle="round"
                borderColor={isCurrent ? accent : s3}
                backgroundColor={s0}
                hover={{ borderColor: accent, backgroundColor: s1 }}
              >
                {Svg === undefined ? (
                  <Box flexDirection="column" gap={0}>
                    <Box>
                      <Box flexDirection="column" width={16} paddingX={1} backgroundColor={s1}>
                        <Text color={v.text[0]} weight="bold">Chats</Text>
                        <Text color={v.text[0]} backgroundColor={s2}>Release notes</Text>
                        <Text color={v.text[2]}>Trip ideas</Text>
                      </Box>
                      <Box flexDirection="column" flexGrow={1} paddingX={1}>
                        <Box backgroundColor={s2} paddingX={1}>
                          <Text color={v.text[0]}>Here is the fix.</Text>
                        </Box>
                        <Box gap={1}>
                          <Text color={s0} backgroundColor={accent}> Send </Text>
                          <Text color={p.roles.danger}>Error</Text>
                          <Text color={p.roles.warning}>Warning</Text>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Svg
                    source={previewSvg(p, now.mode, isCurrent)}
                    alt={`${p.name} preview`}
                    width={264}
                    height={132}
                    isInteractive={isCurrent}
                  />
                )}
                {/* One press target per card: the name row. The dots sit outside it, because a Button does not keep a Text's color. */}
                <Box alignItems="center" gap={1} flexWrap="wrap">
                  <Button key={`pick-${p.id}`} variant={isCurrent ? 'primary' : 'secondary'} onPress={pick(p.id)}>
                    {isCurrent ? '✓ ' : ''}
                    {p.name} · {p.note}
                  </Button>
                  <Text>
                    {dots.map((c, i) => (
                      <Text key={`dot${i}`} color={c}>●</Text>
                    ))}
                  </Text>
                </Box>
              </Box>
            )
          })}
        </Box>
      </Box>
    )
  })
}
