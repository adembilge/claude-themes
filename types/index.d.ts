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
}

export type ThemeState = {
  id: ThemeId
  tab: 'dark' | 'light' | 'favorites' | 'maker' | 'settings'
  q: string
  favs: ThemeId[]
  backdrop: boolean
  highContrast: boolean
  codePair: boolean
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
}

declare module 'claude-code' {
  interface PluginState {
    'desktop-themes': { current: Shaped<ThemeState> }
  }
}
