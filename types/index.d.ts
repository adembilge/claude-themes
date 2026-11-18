export type ThemeId = string

export type CustomTheme = {
  id: ThemeId
  name: string
  note: string
  mode: 'dark' | 'light'
  surfaces: [string, string, string, string]
  text: [string, string, string]
  accent: string
  roles: { danger: string; success: string; warning: string; pro: string }
  family?: string
}

export type TuneState = {
  warmth: number
  sat: number
  bright: number
  contrast: number
  tint: number
  accent: number
  status: number
}

export type ReadingState = {
  glare: 0 | 1 | 2
  night: 0 | 1 | 2
  nightOnly: boolean
}

export type ThemeState = {
  id: ThemeId
  tab: 'dark' | 'light' | 'favorites' | 'maker' | 'appearance' | 'settings'
  q: string
  favs: ThemeId[]
  backdrop: boolean
  highContrast: boolean
  codePair: boolean
  reading: ReadingState
  nightPeriod: string
  auto: { on: boolean; day: ThemeId; night: ThemeId; from: number; to: number }
  autoPeriod: string
  backdropStyle: string
  strength: 'subtle' | 'normal' | 'bold'
  tone: 'accent' | 'pro'
  cwd: string
  projects: Record<string, ThemeId>
  custom: CustomTheme[]
  draft: { name: string; accent: string; mode: 'dark' | 'light' }
  msg: string
  importText: string
  off: boolean
  confirm: string
  follow: boolean
  tunes: Record<string, TuneState>
  found: { label: string; uiTheme: string; path: string }[]
  foundQ: string
  scanMsg: string
}

declare module 'claude-code' {
  interface PluginState {
    'desktop-themes': { current: Shaped<ThemeState> }
  }
}
