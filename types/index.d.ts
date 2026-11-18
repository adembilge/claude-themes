export type ThemeId = string

export type ThemeState = {
  id: ThemeId
  tab: 'dark' | 'light' | 'favorites' | 'settings'
  q: string
  favs: ThemeId[]
  backdrop: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'desktop-themes': { current: Shaped<ThemeState> }
  }
}
