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
function host(on: any, saved: { prefs?: unknown; theme?: unknown; custom?: unknown } = {}, calls: string[] = []) {
  on('command.register', () => ({ value: { command: 'claude-themes' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('store.get', (_: unknown, e: { key: string }) => ({
    value: e.key === 'prefs' ? saved.prefs : e.key === 'theme' ? saved.theme : e.key === 'custom' ? saved.custom : undefined,
  }))
  on('store.set', () => ({ value: undefined }))
  on('theme.set', (_: unknown, e: unknown) => {
    calls.push(JSON.stringify(e))

    return { value: undefined }
  })
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

test('favorites are kept in their own tab', async ($, on) => {
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

    // There is no Recent bar any more.
    await ui.press({ key: 'tab-dark' })
    await ui.press({ key: 'pick-all-nord' })
    expect(await ui.find({ type: 'Text', text: /Recent/ })).toBeUndefined()

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
    prefs: { favs: [1, 2, 'not-a-theme', 'nord', 'nord'], backdrop: 'yes' },
  })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(await ui.find({ type: 'Button', text: /Dracula/ })).toBeDefined()
    // The one valid favorite survives; the rest were dropped.
    await ui.press({ key: 'tab-favorites' })
    expect(await ui.find({ key: 'pick-fav-nord' })).toBeDefined()
    // The tab is session state, so the next surface starts from the Dark tab again.
    await ui.press({ key: 'tab-dark' })
    await ui.unmount()
  }
})

const IMPORTED = `claude-themes:${JSON.stringify({
  name: 'Imported One',
  mode: 'dark',
  surfaces: ['#21222c', '#282a36', '#343746', '#3c3f50'],
  text: ['#f8f8f2', '#d6deeb', '#9aa3d0'],
  accent: '#bd93f9',
  roles: { danger: '#ff5555', success: '#50fa7b', warning: '#ffb86c', pro: '#ff79c6' },
})}`

test('the maker saves a theme of your own, refuses bad input and deletes it', async ($, on) => {
  host(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })

    await ui.press({ key: 'tab-maker' })
    expect(await ui.find({ key: 'maker-save' })).toBeDefined()
    // No name yet: nothing is said until Save is pressed.
    expect(await ui.find({ type: 'Text', text: /Give it a name/ })).toBeUndefined()
    await ui.input({ key: 'maker-name', text: '' })
    await ui.press({ key: 'maker-save' })
    expect(await ui.find({ type: 'Text', text: /Give it a name/ })).toBeDefined()

    // A bad accent is explained and nothing is saved.
    await ui.input({ key: 'maker-name', text: 'Test Blue' })
    await ui.input({ key: 'maker-accent', text: 'nope' })
    await ui.press({ key: 'maker-save' })
    expect(await ui.find({ type: 'Text', text: /six-digit hex/ })).toBeDefined()
    expect(await ui.find({ key: 'maker-del-my-test-blue' })).toBeUndefined()

    // A good one is saved, applied, listed under My themes and in the Dark tab.
    await ui.input({ key: 'maker-accent', text: '#3b82f6' })
    await ui.press({ key: 'maker-save' })
    expect(await ui.find({ type: 'Text', text: /Saved "Test Blue"/ })).toBeDefined()
    expect(await ui.find({ key: 'maker-del-my-test-blue' })).toBeDefined()
    await ui.press({ key: 'tab-dark' })
    expect(await ui.find({ type: 'Button', text: /Test Blue/ })).toBeDefined()

    // Deleting takes it out of both places.
    await ui.press({ key: 'tab-maker' })
    await ui.press({ key: 'maker-del-my-test-blue' })
    expect(await ui.find({ key: 'maker-del-my-test-blue' })).toBeUndefined()
    await ui.press({ key: 'tab-dark' })
    expect(await ui.find({ type: 'Button', text: /Test Blue/ })).toBeUndefined()
    await ui.unmount()
  }
})

test('a theme code can be imported, and a bad code is explained', async ($, on) => {
  host(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })

    await ui.press({ key: 'tab-maker' })
    await ui.input({ key: 'share-import', text: 'hello' })
    expect(await ui.find({ type: 'Text', text: /not a theme code/ })).toBeDefined()
    await ui.input({ key: 'share-import', text: 'claude-themes:{broken' })
    expect(await ui.find({ type: 'Text', text: /damaged/ })).toBeDefined()

    // Text too faint to read is refused rather than applied.
    const faint = IMPORTED.replace('"#f8f8f2"', '"#2a2a35"')
    await ui.input({ key: 'share-import', text: faint })
    expect(await ui.find({ type: 'Text', text: /refuse/ })).toBeDefined()

    await ui.input({ key: 'share-import', text: IMPORTED })
    expect(await ui.find({ key: 'maker-del-my-imported-one' })).toBeDefined()
    await ui.press({ key: 'maker-del-my-imported-one' })

    // The copy button answers either way, and never breaks the pane.
    await ui.press({ key: 'share-copy' })
    expect(await ui.find({ key: 'share-copy' })).toBeDefined()
    await ui.press({ key: 'tab-dark' })
    await ui.unmount()
  }
})

test('corrupted saved themes are dropped on load', async ($, on) => {
  host(on, {
    custom: [
      { name: 'Ok One', mode: 'dark', surfaces: ['#21222c', '#282a36', '#343746', '#3c3f50'], text: ['#f8f8f2', '#d6deeb', '#9aa3d0'], accent: '#bd93f9', roles: { danger: '#ff5555', success: '#50fa7b', warning: '#ffb86c', pro: '#ff79c6' } },
      { name: 'Broken', mode: 'dark', surfaces: 'nope' },
      42,
      null,
      { name: 'Faint', mode: 'dark', surfaces: ['#21222c', '#282a36', '#343746', '#3c3f50'], text: ['#30303a', '#30303a', '#30303a'], accent: '#bd93f9', roles: { danger: '#ff5555', success: '#50fa7b', warning: '#ffb86c', pro: '#ff79c6' } },
    ],
  })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  await ui.press({ key: 'tab-maker' })
  expect(await ui.find({ key: 'maker-del-my-ok-one' })).toBeDefined()
  expect(await ui.find({ key: 'maker-del-my-broken' })).toBeUndefined()
  expect(await ui.find({ key: 'maker-del-my-faint' })).toBeUndefined()
  await ui.unmount()
})

test('high contrast and code colors reach the theme that is set', async ($, on) => {
  const calls: string[] = []
  host(on, {}, calls)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  await ui.press({ key: 'tab-settings' })
  expect(await ui.find({ type: 'Button', text: /Code colors: on/ })).toBeDefined()
  expect(await ui.find({ type: 'Button', text: /High contrast: off/ })).toBeDefined()

  await ui.press({ key: 'contrast-toggle' })
  expect(await ui.find({ type: 'Button', text: /High contrast: on/ })).toBeDefined()
  expect(calls[calls.length - 1]).toContain('"contrast":"more"')

  // A theme with a matching code theme sends it for its own mode.
  await ui.press({ key: 'tab-dark' })
  await ui.press({ key: 'pick-all-dracula' })
  expect(calls[calls.length - 1]).toContain('"codeTheme":{"dark":"dracula"}')

  // Switched off, the app keeps its own.
  await ui.press({ key: 'tab-settings' })
  await ui.press({ key: 'code-toggle' })
  expect(await ui.find({ type: 'Button', text: /Code colors: off/ })).toBeDefined()
  expect(calls[calls.length - 1]).not.toContain('codeTheme')
  await ui.unmount()
})

test('day and night applies the theme for the hour, and changes with the hours', async ($, on) => {
  host(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })

    await ui.press({ key: 'tab-settings' })
    expect(await ui.find({ type: 'Button', text: /Day and night: off/ })).toBeDefined()
    await ui.press({ key: 'auto-toggle' })
    expect(await ui.find({ type: 'Button', text: /Day and night: on/ })).toBeDefined()

    // Equal start and end hours mean it is always day.
    await ui.select({ key: 'auto-day', value: 'github-light' })
    await ui.select({ key: 'auto-from', value: '0' })
    await ui.select({ key: 'auto-to', value: '0' })
    expect(await ui.find({ type: 'Text', text: /Active: GitHub Light/ })).toBeDefined()

    // Hours that start next hour make it night now.
    const h = new Date().getHours()
    await ui.select({ key: 'auto-night', value: 'dracula' })
    await ui.select({ key: 'auto-from', value: String((h + 1) % 24) })
    await ui.select({ key: 'auto-to', value: String((h + 2) % 24) })
    expect(await ui.find({ type: 'Text', text: /Active: Dracula/ })).toBeDefined()

    await ui.press({ key: 'auto-toggle' })
    expect(await ui.find({ type: 'Button', text: /Day and night: off/ })).toBeDefined()
    await ui.press({ key: 'tab-dark' })
    await ui.unmount()
  }
})

test('corrupted saved settings fall back to the defaults', async ($, on) => {
  host(on, { prefs: { auto: { on: 'x', day: 'nope', night: 5, from: 99, to: -1 }, highContrast: 'yes', codePair: 3 } })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  await ui.press({ key: 'tab-settings' })
  expect(await ui.find({ type: 'Button', text: /Day and night: off/ })).toBeDefined()
  expect(await ui.find({ type: 'Button', text: /High contrast: off/ })).toBeDefined()
  expect(await ui.find({ type: 'Button', text: /Code colors: on/ })).toBeDefined()
  await ui.unmount()
})
