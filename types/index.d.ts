export type ThemeId = string

export type ThemeState = {
  id: ThemeId
  tab: 'themes' | 'favorites' | 'settings'
  q: string
  favs: ThemeId[]
  recents: ThemeId[]
  backdrop: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'desktop-themes': { current: Shaped<ThemeState> }
  }
}
