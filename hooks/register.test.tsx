import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'desktop-themes',
  component: 'Pane',
  requestId: 'desktop-themes',
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
  on('command.register', () => ({ value: { command: 'claude-themes' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('theme.set', () => ({ value: undefined }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    // A dark and a light theme are both listed, and each is one press.
    // The terminal has no Svg: its rows name each theme on the button. Elsewhere a drawn card is
    // followed by one Apply button, and the current theme reads Applied.
    if (surface === 'terminal') {
      expect(await ui.find({ type: 'Button', text: /Dracula/ })).toBeDefined()
      expect(await ui.find({ type: 'Button', text: /GitHub Light/ })).toBeDefined()
    } else {
      expect(await ui.find({ type: 'Button', text: /Apply/ })).toBeDefined()
      expect(await ui.find({ type: 'Button', text: /Applied/ })).toBeDefined()
    }

    // The dock ends with a link to the docs and source.
    expect(await ui.find({ type: 'Link', text: /github\.com\/adembilge\/claude-themes/ })).toBeDefined()

    // The terminal has no Svg and keeps a preview built from boxes.
    if (surface === 'terminal') {
      expect(await ui.find({ type: 'Text', text: /Release notes/ })).toBeDefined()
    } else {
      expect(await ui.find({ type: 'Svg' })).toBeDefined()
    }
    await ui.unmount()
  }
})
