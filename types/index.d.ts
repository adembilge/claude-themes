export type ThemeId = string

declare module 'claude-code' {
  interface PluginState {
    deskmod: { current: Shaped<ThemeId> }
  }
}

