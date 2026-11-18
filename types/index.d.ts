export type ThemeId = string

declare module 'claude-code' {
  interface PluginState {
    deskmod: { current: Shaped<{ id: ThemeId; mode: 'dark' | 'light'; auto: boolean }> }
  }
}
