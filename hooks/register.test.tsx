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

const SURFACES = ['terminal', 'desktop', 'vscode', 'mobile'] as const

// The host's answers, as a fresh session sees them. `prefs` and `theme` are what the store holds.
function host(on: any, saved: { prefs?: unknown; theme?: unknown } = {}) {
  on('command.register', () => ({ value: { command: 'claude-themes' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('store.get', (_: unknown, e: { key: string }) => ({
    value: e.key === 'prefs' ? saved.prefs : e.key === 'theme' ? saved.theme : undefined,
  }))
  on('store.set', () => ({ value: undefined }))
  on('theme.set', () => ({ value: undefined }))
}

test('the gallery draws a card for every theme, on every surface', async ($, on) => {
  host(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    // The Dark tab opens first, and each theme is one press; the Light tab holds the light ones.
    expect(await ui.find({ type: 'Button', text: /Dracula/ })).toBeDefined()
    expect(await ui.find({ type: 'Button', text: /Espresso/ })).toBeDefined()
    expect(await ui.find({ type: 'Button', text: /GitHub Light/ })).toBeUndefined()
    await ui.press({ key: 'tab-light' })
    expect(await ui.find({ type: 'Button', text: /GitHub Light/ })).toBeDefined()
    expect(await ui.find({ type: 'Button', text: /Dracula/ })).toBeUndefined()
    await ui.press({ key: 'tab-dark' })

    // Four tabs are offered; the link to the docs and source is on the Settings tab only.
    expect(await ui.find({ key: 'tab-dark' })).toBeDefined()
    expect(await ui.find({ key: 'tab-light' })).toBeDefined()
    expect(await ui.find({ key: 'tab-favorites' })).toBeDefined()
    expect(await ui.find({ key: 'tab-settings' })).toBeDefined()
    expect(await ui.find({ type: 'Link' })).toBeUndefined()
    await ui.press({ key: 'tab-settings' })
    expect(await ui.find({ type: 'Link', text: /github\.com\/adembilge\/claude-themes/ })).toBeDefined()
    await ui.press({ key: 'tab-dark' })

    // The terminal has no Svg and keeps a preview built from boxes.
    if (surface === 'terminal') {
      expect(await ui.find({ type: 'Text', text: /Release notes/ })).toBeDefined()
    } else {
      expect(await ui.find({ type: 'Svg' })).toBeDefined()
    }
    await ui.unmount()
  }
})

test('favorites and recents appear when used', async ($, on) => {
  host(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })

    await ui.press({ key: 'tab-favorites' })
    expect(await ui.find({ type: 'Text', text: /No favorites yet/ })).toBeDefined()

    await ui.press({ key: 'tab-dark' })
    await ui.press({ key: 'fav-all-dracula' })
    // The list on the Themes tab carries no Favorites section; the tab holds them.
    expect(await ui.find({ key: 'pick-fav-dracula' })).toBeUndefined()
    await ui.press({ key: 'tab-favorites' })
    expect(await ui.find({ key: 'pick-fav-dracula' })).toBeDefined()

    await ui.press({ key: 'tab-dark' })
    await ui.press({ key: 'pick-all-nord' })
    expect(await ui.find({ key: 'recent-nord' })).toBeDefined()

    // Pressing the star again takes it out.
    await ui.press({ key: 'tab-favorites' })
    await ui.press({ key: 'fav-fav-dracula' })
    expect(await ui.find({ type: 'Text', text: /No favorites yet/ })).toBeDefined()
    await ui.unmount()
  }
})

test('search filters the list and says when nothing matches', async ($, on) => {
  host(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })

    await ui.input({ key: 'search', text: 'zzzz' })
    expect(await ui.find({ type: 'Text', text: /theme matches/ })).toBeDefined()

    await ui.input({ key: 'search', text: 'drac' })
    expect(await ui.find({ type: 'Button', text: /Dracula/ })).toBeDefined()
    expect(await ui.find({ type: 'Button', text: /Nord/ })).toBeUndefined()
    await ui.unmount()
  }
})

test('the settings tab switches the backdrop and the list comes back', async ($, on) => {
  host(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })

    await ui.press({ key: 'tab-settings' })
    expect(await ui.find({ type: 'Button', text: /Backdrop: on/ })).toBeDefined()
    await ui.press({ key: 'backdrop-toggle' })
    expect(await ui.find({ type: 'Button', text: /Backdrop: off/ })).toBeDefined()
    await ui.press({ key: 'backdrop-toggle' })

    await ui.press({ key: 'tab-dark' })
    expect(await ui.find({ type: 'Button', text: /Dracula/ })).toBeDefined()
    await ui.unmount()
  }
})

test('a corrupted saved value cannot break the gallery', async ($, on) => {
  host(on, {
    theme: 42,
    prefs: { favs: 'nope', recents: [1, 2, 'not-a-theme', 'nord', 'nord'], backdrop: 'yes' },
  })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(await ui.find({ type: 'Button', text: /Dracula/ })).toBeDefined()
    // The one valid recent survives; the rest were dropped.
    expect(await ui.find({ key: 'recent-nord' })).toBeDefined()
    await ui.unmount()
  }
})
