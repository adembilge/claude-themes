export type ThemeId = string

declare module 'claude-code' {
  interface PluginState {
    'desktop-themes': { current: Shaped<{ id: ThemeId }> }
  }
}
