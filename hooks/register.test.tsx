import { expect, test } from 'claude-code/testing'

import { parseCode } from './model.js'
import { themeToLink } from './share.js'

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

// What a Button says right now, by its key: the switches read On or Off.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function labelOf(ui: any, key: string): Promise<string | undefined> {
  return (await ui.find({ key }))?.text
}

// The host's answers, as a fresh session sees them. `prefs` and `theme` are what the store holds.
function host(
  on: any,
  saved: { prefs?: unknown; theme?: unknown; custom?: unknown; projects?: unknown} = {},
  calls: string[] = [],
  stored: Record<string, unknown> = {},
  files: Record<string, string> = {},
) {
  on('command.register', () => ({ value: { command: 'claude-themes' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('store.get', (_: unknown, e: { key: string }) => ({
    value: e.key === 'prefs' ? saved.prefs : e.key === 'theme' ? saved.theme : e.key === 'custom' ? saved.custom : e.key === 'projects' ? saved.projects : undefined,
  }))
  on('store.set', (_: unknown, e: { key: string; value: unknown }) => {
    stored[e.key] = e.value

    return { value: undefined }
  })
  on('ui.toast', () => ({ value: undefined }))
  on('theme.clear', () => {
    calls.push('clear')

    return { value: undefined }
  })
  on('fs.read', (_: unknown, e: { path: string }) => {
    // On Mac and Linux the engine resolves "C:/x" against the working folder (/work/C:/x), so a key also matches the end of the path.
    const path = e.path.split('\\').join('/')
    const text = files[path] ?? Object.entries(files).find(([k]) => path.endsWith(`/${k}`))?.[1]

    if (text === undefined) {
      throw new Error(`no such file ${JSON.stringify(e)}`)
    }

    return { value: text }
  })
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
    // One GitHub row in each mode, never "GitHub Light" or "GitHub Dark".
    expect(await ui.find({ type: 'Button', text: /GitHub/ })).toBeDefined()
    expect(await ui.find({ type: 'Button', text: /GitHub (Light|Dark)/ })).toBeUndefined()
    expect(await ui.find({ type: 'Button', text: /Solarized (Light|Dark)/ })).toBeUndefined()
    await ui.press({ key: 'tab-light' })
    expect(await ui.find({ type: 'Button', text: /GitHub/ })).toBeDefined()
    expect(await ui.find({ type: 'Button', text: /GitHub (Light|Dark)/ })).toBeUndefined()
    expect(await ui.find({ type: 'Button', text: /Dracula/ })).toBeUndefined()
    await ui.press({ key: 'tab-dark' })

    // Tabs are offered; the link to the docs and source is on the Settings tab only.
    expect(await ui.find({ key: 'tab-dark' })).toBeDefined()
    expect(await ui.find({ key: 'tab-light' })).toBeDefined()
    expect(await ui.find({ key: 'tab-favorites' })).toBeDefined()
    expect(await ui.find({ key: 'tab-appearance' })).toBeDefined()
    expect(await ui.find({ type: 'Link' })).toBeUndefined()
    await ui.press({ key: 'tab-appearance' })
    expect(await ui.find({ type: 'Link' })).toBeUndefined()
    expect(await ui.find({ key: 'backdrop-toggle' })).toBeDefined()
    // The Settings tab holds the VS Code import, Reset and About (with the link), not the backdrop.
    await ui.press({ key: 'tab-settings' })
    expect(await ui.find({ key: 'vscode-scan' })).toBeDefined()
    expect(await ui.find({ key: 'reset-settings' })).toBeDefined()
    expect(await ui.find({ type: 'Link', text: /github\.com\/adembilge\/claude-themes/ })).toBeDefined()
    expect(await ui.find({ key: 'backdrop-toggle' })).toBeUndefined()
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

    await ui.press({ key: 'tab-appearance' })
    expect(await labelOf(ui, 'backdrop-toggle')).toContain('On')
    await ui.press({ key: 'backdrop-toggle' })
    expect(await labelOf(ui, 'backdrop-toggle')).toContain('Off')
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
    expect(await ui.find({ type: 'Text', text: /not a color I can read/ })).toBeDefined()
    expect(await ui.find({ key: 'maker-del-my-test-blue' })).toBeUndefined()

    // The accent box reads rgb(), hsl() and names (Enter turns them into the plain hex); the theme saves as usual.
    for (const typed of ['rgb(59, 130, 246)', 'hsl(217, 91%, 60%)', 'dodgerblue']) {
      await ui.input({ key: 'maker-accent', text: typed })
      await ui.press({ key: 'maker-save' })
      expect(await ui.find({ type: 'Text', text: /Saved "Test Blue"/ }), typed).toBeDefined()
    }

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

    // Import lives on the Settings tab and Share (the copy buttons) at the bottom of the Maker.
    await ui.press({ key: 'tab-maker' })
    expect(await ui.find({ key: 'share-import' })).toBeUndefined()
    await ui.press({ key: 'tab-settings' })
    expect(await ui.find({ key: 'share-copy' })).toBeUndefined()
    // Anything that is not a code or link is read as a file or address, and says when it cannot be.
    await ui.input({ key: 'share-import', text: 'hello' })
    expect(await ui.find({ type: 'Text', text: /could not be read/ })).toBeDefined()
    await ui.input({ key: 'share-import', text: 'claude-themes:{broken' })
    expect(await ui.find({ type: 'Text', text: /damaged/ })).toBeDefined()

    // Text too faint to read is refused rather than applied.
    const faint = IMPORTED.replace('"#f8f8f2"', '"#2a2a35"')
    await ui.input({ key: 'share-import', text: faint })
    expect(await ui.find({ type: 'Text', text: /refuse/ })).toBeDefined()

    await ui.input({ key: 'share-import', text: IMPORTED })

    await ui.press({ key: 'tab-maker' })
    expect(await ui.find({ key: 'maker-del-my-imported-one' })).toBeDefined()
    await ui.press({ key: 'maker-del-my-imported-one' })

    // The Share card offers the link, the code and each file format; the copy buttons answer either way and never break the pane.
    for (const key of ['share-link', 'share-copy', 'export-vscode', 'export-base16', 'export-wt']) {
      expect(await ui.find({ key })).toBeDefined()
    }
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

  await ui.press({ key: 'tab-appearance' })
  expect(await labelOf(ui, 'code-toggle')).toContain('On')
  expect(await labelOf(ui, 'contrast-toggle')).toContain('Off')

  await ui.press({ key: 'contrast-toggle' })
  expect(await labelOf(ui, 'contrast-toggle')).toContain('On')
  expect(calls[calls.length - 1]).toContain('"contrast":"more"')

  // A theme with a matching code theme sends it for its own mode.
  await ui.press({ key: 'tab-dark' })
  await ui.press({ key: 'pick-all-dracula' })
  expect(calls[calls.length - 1]).toContain('"codeTheme":{"dark":"dracula"}')

  // Switched off, the app keeps its own.
  await ui.press({ key: 'tab-appearance' })
  await ui.press({ key: 'code-toggle' })
  expect(await labelOf(ui, 'code-toggle')).toContain('Off')
  expect(calls[calls.length - 1]).not.toContain('codeTheme')
  await ui.unmount()
})

test('day and night applies the theme for the hour, and changes with the hours', async ($, on) => {
  host(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })

    await ui.press({ key: 'tab-appearance' })
    expect(await ui.find({ key: 'auto-day' })).toBeUndefined()
    await ui.press({ key: 'switch-hour' })
    expect(await ui.find({ key: 'auto-day' })).toBeDefined()

    // Equal start and end hours mean it is always day.
    await ui.select({ key: 'auto-day', value: 'github-light' })
    await ui.select({ key: 'auto-from', value: '0' })
    await ui.select({ key: 'auto-to', value: '0' })
    expect(await ui.find({ type: 'Text', text: /Active: GitHub [(]light[)]/ })).toBeDefined()

    // Hours that start next hour make it night now.
    const h = new Date().getHours()
    await ui.select({ key: 'auto-night', value: 'dracula' })
    await ui.select({ key: 'auto-from', value: String((h + 1) % 24) })
    await ui.select({ key: 'auto-to', value: String((h + 2) % 24) })
    expect(await ui.find({ type: 'Text', text: /Active: Dracula/ })).toBeDefined()

    await ui.press({ key: 'switch-off' })
    expect(await ui.find({ key: 'auto-day' })).toBeUndefined()
    await ui.press({ key: 'tab-dark' })
    await ui.unmount()
  }
})

test('soften glare and night comfort are plain switches that change the theme and are saved', async ($, on) => {
  const calls: string[] = []
  const stored: Record<string, unknown> = {}
  host(on, {}, calls, stored)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  await ui.press({ key: 'tab-appearance' })
  expect(await labelOf(ui, 'read-glare')).toContain('Off')
  expect(await labelOf(ui, 'read-night')).toContain('Off')
  const plain = calls[calls.length - 1]

  await ui.press({ key: 'read-glare' })
  expect(await labelOf(ui, 'read-glare')).toContain('On')
  expect(calls[calls.length - 1]).not.toBe(plain)
  expect((stored.prefs as { reading: unknown }).reading).toEqual({ glare: 2, night: 0, nightOnly: false })

  // "Only at night" is offered once night comfort is on.
  expect(await ui.find({ key: 'read-night-only' })).toBeUndefined()
  await ui.press({ key: 'read-night' })
  expect(await labelOf(ui, 'read-night-only')).toContain('Off')
  await ui.press({ key: 'read-night-only' })
  expect(await labelOf(ui, 'read-night-only')).toContain('On')
  expect((stored.prefs as { reading: unknown }).reading).toEqual({ glare: 2, night: 2, nightOnly: true })

  // Off again, and the theme is as it was.
  await ui.press({ key: 'read-glare' })
  await ui.press({ key: 'read-night' })
  expect(calls[calls.length - 1]).toBe(plain)
  expect(await ui.find({ key: 'read-night-only' })).toBeUndefined()
  await ui.unmount()
})

test('saved readability options are applied at the start, and damaged or removed ones are ignored', async ($, on) => {
  host(on, { prefs: { reading: { glare: 1, night: 'x', colorblind: 'redgreen', muted: 2, focus: 2 } } })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  await ui.press({ key: 'tab-appearance' })
  expect(await labelOf(ui, 'read-glare')).toContain('On')
  expect(await labelOf(ui, 'read-night')).toContain('Off')
  await ui.unmount()
})

test('corrupted saved settings fall back to the defaults', async ($, on) => {
  host(on, { prefs: { auto: { on: 'x', day: 'nope', night: 5, from: 99, to: -1 }, highContrast: 'yes', codePair: 3 } })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  await ui.press({ key: 'tab-appearance' })
  expect(await ui.find({ key: 'auto-day' })).toBeUndefined()
  expect(await labelOf(ui, 'contrast-toggle')).toContain('Off')
  expect(await labelOf(ui, 'code-toggle')).toContain('On')
  await ui.unmount()
})

test('backdrop styles reach the theme as still grounds', async ($, on) => {
  const calls: string[] = []
  host(on, {}, calls)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  await ui.press({ key: 'tab-appearance' })
  expect(await ui.find({ key: 'backdrop-style-glow' })).toBeDefined()
  // Every style is a smooth gradient the app draws by itself.
  for (const style of ['glow', 'sunrise', 'spotlight', 'duotone', 'vignette', 'dusk', 'twilight', 'ember', 'halo']) {
    await ui.press({ key: `backdrop-style-${style}` })
    expect(calls[calls.length - 1]).toContain('"gradient"')
    expect(calls[calls.length - 1]).not.toContain('"vector"')
  }
  expect(await ui.find({ key: 'backdrop-style-grid' })).toBeUndefined()

  // Strength changes what is handed over, and the color choice is gone.
  await ui.press({ key: 'backdrop-style-dusk' })
  const normal = calls[calls.length - 1]
  await ui.press({ key: 'backdrop-strength-bold' })
  expect(calls[calls.length - 1]).not.toBe(normal)
  expect(await ui.find({ key: 'backdrop-tone-pro' })).toBeUndefined()
  expect(await ui.find({ key: 'backdrop-tone-accent' })).toBeUndefined()

  await ui.press({ key: 'backdrop-style-glow' })
  expect(calls[calls.length - 1]).toContain('"gradient"')
  expect(calls[calls.length - 1]).not.toContain('"scene"')

  // Switched off, there is no backdrop at all.
  await ui.press({ key: 'backdrop-toggle' })
  expect(calls[calls.length - 1]).not.toContain('"backdrop"')
  expect(await ui.find({ key: 'backdrop-style-glow' })).toBeUndefined()
  await ui.unmount()
})

test('a folder keeps its own theme, and the clock does not replace it', async ($, on) => {
  host(on, { projects: { '/work/app': 'dracula', '/work/gone': 'not-a-theme' } })
  await $.session.start({ cwd: '/Work/App/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  // Folder keys ignore case and the trailing slash.
  expect(await ui.find({ type: 'Text', text: /Active: Dracula/ })).toBeDefined()
  await ui.press({ key: 'tab-settings' })
  expect(await ui.find({ type: 'Text', text: /This folder: uses Dracula/ })).toBeDefined()
  expect(await ui.find({ key: 'project-clear' })).toBeDefined()

  await ui.press({ key: 'project-clear' })
  expect(await ui.find({ type: 'Text', text: /no theme of its own/ })).toBeDefined()
  expect(await ui.find({ key: 'project-clear' })).toBeUndefined()

  await ui.press({ key: 'project-use' })
  expect(await ui.find({ type: 'Text', text: /uses Dracula/ })).toBeDefined()
  await ui.unmount()
})

test('reset: the app look, settings and everything each work, and the last two ask twice', async ($, on) => {
  const calls: string[] = []
  const stored: Record<string, unknown> = {}
  host(on, {}, calls, stored)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  await ui.press({ key: 'tab-appearance' })
  await ui.press({ key: 'contrast-toggle' })
  expect(await labelOf(ui, 'contrast-toggle')).toContain('On')

  // Reset lives on the Settings tab. The first press only asks.
  await ui.press({ key: 'tab-settings' })
  await ui.press({ key: 'reset-settings' })
  expect(await labelOf(ui, 'reset-settings')).toContain('Press again')
  await ui.press({ key: 'reset-settings' })
  await ui.press({ key: 'tab-appearance' })
  expect(await labelOf(ui, 'contrast-toggle')).toContain('Off')

  await ui.press({ key: 'tab-settings' })

  await ui.press({ key: 'reset-look' })
  expect(calls[calls.length - 1]).toBe('clear')
  expect(await ui.find({ type: 'Text', text: /app's own look/ })).toBeDefined()

  // Picking any theme brings a theme back.
  await ui.press({ key: 'tab-dark' })
  await ui.press({ key: 'pick-all-nord' })
  expect(await ui.find({ type: 'Text', text: /Active: Nord/ })).toBeDefined()

  await ui.press({ key: 'tab-settings' })
  await ui.press({ key: 'reset-all' })
  expect(await labelOf(ui, 'reset-all')).toContain('Press again')
  await ui.press({ key: 'reset-all' })
  expect(await ui.find({ type: 'Text', text: /Active: Catppuccin/ })).toBeDefined()
  await ui.unmount()
})

test('follow system builds one look with both modes and no backdrop', async ($, on) => {
  const calls: string[] = []
  host(on, {}, calls)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  await ui.press({ key: 'tab-appearance' })
  await ui.press({ key: 'switch-system' })
  expect(await ui.find({ type: 'Text', text: /Following the system/ })).toBeDefined()
  const last = calls[calls.length - 1] ?? ''

  expect(last).toContain('"light"')
  expect(last).toContain('"dark"')
  expect(last).not.toContain('"backdrop"')
  expect(last).not.toContain('overrideColorScheme')

  // A theme picked by hand turns following off.
  await ui.press({ key: 'tab-dark' })
  await ui.press({ key: 'pick-all-nord' })
  expect(await ui.find({ type: 'Text', text: /Active: Nord/ })).toBeDefined()
  await ui.press({ key: 'tab-appearance' })
  expect(await ui.find({ key: 'auto-day' })).toBeUndefined()
  await ui.unmount()
})

test('tuning steps shift one theme, say so, and reset', async ($, on) => {
  const calls: string[] = []
  host(on, {}, calls)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  await ui.press({ key: 'tab-appearance' })
  const plain = calls[calls.length - 1]

  await ui.press({ key: 'tune-warmth-up' })
  await ui.press({ key: 'tune-warmth-up' })
  expect(calls[calls.length - 1]).not.toBe(plain)
  expect(await ui.find({ type: 'Text', text: /Active: Catppuccin \(dark\), tuned/ })).toBeDefined()

  // More dials than warmth: each reaches the theme.
  for (const dial of ['tint', 'accent', 'status']) {
    const before = calls[calls.length - 1]

    await ui.press({ key: `tune-${dial}-up` })
    expect(`${dial}: ${calls[calls.length - 1] !== before}`).toBe(`${dial}: true`)
  }

  await ui.press({ key: 'tune-reset' })
  expect(calls[calls.length - 1]).toBe(plain)
  expect(await ui.find({ key: 'tune-reset' })).toBeUndefined()
  await ui.unmount()
})

test('a share link imports like a code', async ($, on) => {
  host(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const parsed = parseCode(IMPORTED)

  if ('error' in parsed) {
    throw new Error('the fixture must parse')
  }
  await ui.press({ key: 'tab-settings' })
  await ui.input({ key: 'share-import', text: themeToLink(parsed.theme) })
  await ui.press({ key: 'tab-maker' })
  expect(await ui.find({ key: 'maker-del-my-imported-one' })).toBeDefined()
  await ui.press({ key: 'maker-del-my-imported-one' })
  await ui.unmount()
})

// The same stub paths on every system (see the fs.read stub).
const THEME_DIR = 'C:/themes'

test('a theme file on this computer can be imported', async ($, on) => {
  const files: Record<string, string> = {
    [`${THEME_DIR}/dracula.json`]: JSON.stringify({
      name: 'Dracula Pro',
      type: 'dark',
      colors: {
        'editor.background': '#282a36',
        'sideBar.background': '#21222c',
        'editor.foreground': '#f8f8f2',
        focusBorder: '#6272a4',
        'button.background': '#bd93f9',
        errorForeground: '#ff5555',
        'terminal.ansiGreen': '#50fa7b',
        'terminal.ansiYellow': '#f1fa8c',
        'terminal.ansiMagenta': '#ff79c6',
      },
    }),
  }
  host(on, {}, [], undefined, files)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  await ui.press({ key: 'tab-settings' })
  await ui.input({ key: 'share-import', text: `${THEME_DIR}/missing.json` })
  expect(await ui.find({ type: 'Text', text: /could not be read/ })).toBeDefined()
  await ui.input({ key: 'share-import', text: `${THEME_DIR}/dracula.json` })
  await ui.press({ key: 'tab-maker' })
  expect(await ui.find({ key: 'maker-del-my-dracula-pro' })).toBeDefined()
  await ui.unmount()
})

test('the Dark and Light buttons switch a theme to its other version, and leave a one-mode theme alone', async ($, on) => {
  const calls: string[] = []
  const stored: Record<string, unknown> = {}
  host(on, {}, calls, stored)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  // GitHub has a dark and a light version under one name.
  await ui.press({ key: 'pick-all-github-dark' })
  expect(await ui.find({ type: 'Text', text: /Active: GitHub [(]dark[)]/ })).toBeDefined()
  await ui.press({ key: 'tab-light' })
  expect(await ui.find({ type: 'Text', text: /Active: GitHub [(]light[)]/ })).toBeDefined()
  expect(stored.theme).toBe('github-light')
  await ui.press({ key: 'tab-dark' })
  expect(await ui.find({ type: 'Text', text: /Active: GitHub [(]dark[)]/ })).toBeDefined()
  expect(stored.theme).toBe('github-dark')

  // Dracula has no light version: the button shows the light list and keeps Dracula.
  await ui.press({ key: 'pick-all-dracula' })
  await ui.press({ key: 'tab-light' })
  expect(await ui.find({ type: 'Text', text: /Active: Dracula [(]dark[)]/ })).toBeDefined()
  expect(await ui.find({ type: 'Button', text: /Dracula/ })).toBeUndefined()
  await ui.press({ key: 'tab-dark' })
  expect(await ui.find({ type: 'Button', text: /Dracula/ })).toBeDefined()
  await ui.unmount()
})

test('a theme can be named without its mode on the command line', async ($, on) => {
  const stored: Record<string, unknown> = {}
  host(on, {}, [], stored)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const run = (args: string) =>
    $.command.run({ command: 'claude-themes', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })

  // On a dark theme, "github" means the dark version; after a light one, the light version.
  await run('github')
  expect(stored.theme).toBe('github-dark')
  await run('github light')
  expect(stored.theme).toBe('github-light')
  await run('rose pine')
  expect(stored.theme).toBe('rose-pine-dawn')
  await run('dracula')
  expect(stored.theme).toBe('dracula')
  const result = await run('nonsense')

  expect(String(result.text)).toContain('No theme called')
  expect(String(result.text)).not.toMatch(/github-light|github-dark/)
})
