import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'deskmod',
  component: 'Pane',
  requestId: 'deskmod',
  props: {
    title: 'Themes',
    isFocused: false,
    bodyColumns: 100,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

test('the gallery draws a card for every theme, on every surface', async ($, on) => {
  on('command.register', () => ({ value: { command: 'claude-deskmod' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('theme.set', () => ({ value: undefined }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    const dark = await ui.find({ type: 'Button', text: /Dark/ })

    expect(dark).toBeDefined()
    await ui.unmount()
  }
})
