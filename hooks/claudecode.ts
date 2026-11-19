import { mix } from './model.js'
import type { Theme } from './model.js'

// Writes a Theme as a Claude Code (terminal) custom theme. Pure: returns text, touches nothing.
// The file goes to ~/.claude/themes/ and is chosen once in the terminal's /theme list.

/** The slug Claude Code uses for the file (its name without .json); one fixed file so the terminal keeps following. */
export const TERMINAL_SLUG = 'claude-themes'

/** Where the file lives, relative to the home folder. */
export const TERMINAL_PATH = `.claude/themes/${TERMINAL_SLUG}.json`

const WHITE = '#ffffff'
const BLACK = '#000000'

/** The overrides Claude Code reads: accent, text, status, borders, diffs and message backgrounds. */
export function terminalOverrides(t: Theme): Record<string, string> {
  const [s0, s1, s2, s3] = t.surfaces
  const [t0, t1, t2] = t.text
  const { danger, success, warning, pro } = t.roles
  const edge = t.mode === 'dark' ? WHITE : BLACK
  // The lighter stop of a spinner gradient.
  const shimmer = (c: string): string => mix(c, edge, 0.3)
  const plan = mix(t.accent, success, 0.5)
  const border = mix(s0, t2, 0.55)

  return {
    claude: t.accent,
    claudeShimmer: shimmer(t.accent),
    text: t0,
    inverseText: s0,
    inactive: t2,
    inactiveShimmer: mix(t2, t0, 0.3),
    subtle: mix(s0, t2, 0.4),
    suggestion: t.accent,
    permission: t.accent,
    permissionShimmer: shimmer(t.accent),
    remember: pro,

    success,
    error: danger,
    warning,
    warningShimmer: shimmer(warning),
    merged: pro,

    promptBorder: border,
    promptBorderShimmer: mix(border, t0, 0.35),
    planMode: plan,
    autoAccept: pro,
    bashBorder: warning,
    fastMode: warning,
    fastModeShimmer: shimmer(warning),

    diffAdded: mix(s0, success, 0.28),
    diffRemoved: mix(s0, danger, 0.28),
    diffAddedDimmed: mix(s0, success, 0.14),
    diffRemovedDimmed: mix(s0, danger, 0.14),
    diffAddedWord: mix(s0, success, 0.5),
    diffRemovedWord: mix(s0, danger, 0.5),

    userMessageBackground: s1,
    userMessageBackgroundHover: s2,
    bashMessageBackgroundColor: s2,
    memoryBackgroundColor: s2,
    selectionBg: mix(s0, t.accent, 0.35),
    composerSidebarBackground: s1,

    rate_limit_fill: t.accent,
    rate_limit_empty: s3,
    briefLabelYou: t1,
    briefLabelClaude: t.accent,
  }
}

/** The file's text: `{ name, base, overrides }`. */
export function toClaudeCode(t: Theme): string {
  return `${JSON.stringify(
    { name: `Claude Themes (${t.name})`, base: t.mode, overrides: terminalOverrides(t) },
    null,
    2,
  )}\n`
}
