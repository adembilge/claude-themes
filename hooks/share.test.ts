import { expect, test } from 'claude-code/testing'

import type { Theme } from './model.js'

import { themeToCode } from './model.js'
import { SHARE_URL, parseAny, parseLink, shareHint, themeToLink } from './share.js'

const DARK: Theme = {
  id: 'my-cafe-noir',
  name: 'Café Noir',
  note: 'your dark theme',
  mode: 'dark',
  surfaces: ['#14110f', '#1b1714', '#231e1a', '#2b2520'],
  text: ['#f3ece4', '#cfc4b8', '#a39689'],
  accent: '#d98a4e',
  roles: { danger: '#d1495b', success: '#5fa36a', warning: '#d4a02e', pro: '#9b7bc4' },
}

const LIGHT: Theme = {
  id: 'my-paper',
  name: 'Paper',
  note: 'your light theme',
  mode: 'light',
  surfaces: ['#f3efe6', '#f8f5ee', '#fdfbf7', '#fdfbf7'],
  text: ['#221e18', '#4a4337', '#6b6253'],
  accent: '#a8501f',
  roles: { danger: '#c0392b', success: '#2f7d4f', warning: '#9a6b00', pro: '#7a55a8' },
}

const same = (a: Theme, b: Theme) => {
  expect(b.name).toBe(a.name)
  expect(b.mode).toBe(a.mode)
  expect(b.surfaces).toEqual(a.surfaces)
  expect(b.text).toEqual(a.text)
  expect(b.accent).toBe(a.accent)
  expect(b.roles).toEqual(a.roles)
}

const payloadOf = (link: string) => link.slice(link.indexOf('#v1.') + 4)

// Independent minimal decoder, written here on purpose.
function decode(payload: string): string {
  const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  const bytes: number[] = []
  let acc = 0
  let bits = 0

  for (const ch of payload) {
    acc = (acc << 6) | abc.indexOf(ch)
    bits += 6

    if (bits >= 8) {
      bits -= 8
      bytes.push((acc >> bits) & 255)
      acc &= (1 << bits) - 1
    }
  }

  return decodeURIComponent(bytes.map(b => `%${b.toString(16).padStart(2, '0')}`).join(''))
}

// base64url of a string, written out here so damaged payloads can be built.
function enc(s: string): string {
  const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  const bytes = [...encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)))].map(c => c.charCodeAt(0))
  let out = ''

  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i]! << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0)

    out += abc[(n >> 18) & 63]! + abc[(n >> 12) & 63]! + (i + 1 < bytes.length ? abc[(n >> 6) & 63]! : '') + (i + 2 < bytes.length ? abc[n & 63]! : '')
  }

  return out
}

test('a dark theme with accents survives a link', () => {
  const link = themeToLink(DARK)

  expect(link.startsWith(`${SHARE_URL}#v1.`)).toBe(true)
  expect(link.length).toBeLessThan(400)
  const r = parseLink(link)

  expect('theme' in r).toBe(true)
  same(DARK, (r as { theme: Theme }).theme)
})

test('a light theme survives a link, even with spaces and newlines around it', () => {
  const link = themeToLink(LIGHT)

  expect(link.length).toBeLessThan(300)
  const r = parseLink(`\n  ${link} \n`)

  same(LIGHT, (r as { theme: Theme }).theme)
})

test('the bare payload and v1. form are accepted', () => {
  const link = themeToLink(LIGHT)
  const r = parseLink(link.slice(link.indexOf('#') + 1))

  same(LIGHT, (r as { theme: Theme }).theme)
})

test('the payload reads back with an independent decoder, in the format the page expects', () => {
  const text = decode(payloadOf(themeToLink(DARK)))
  const [name, mode, colours] = text.split('|')

  expect(name).toBe('Café Noir')
  expect(mode).toBe('d')
  expect(colours).toBe('14110f1b1714231e1a2b2520f3ece4cfc4b8a39689d98a4ed1495b5fa36ad4a02e9b7bc4')
})

test('a damaged payload is refused with a plain message', () => {
  for (const bad of ['v1.@@@@', 'v1.A', `v1.${enc('only|two')}`, `v1.${enc('x|d|12|')}`, `v1.${enc('x|q|' + '0'.repeat(72) + '|')}`]) {
    const r = parseLink(`${SHARE_URL}#${bad}`)

    expect('error' in r).toBe(true)
    expect((r as { error: string }).error).toContain('damaged')
  }
})

test('an unknown version and a link with no theme are refused', () => {
  const v2 = parseLink(`${SHARE_URL}#v2.${payloadOf(themeToLink(LIGHT))}`)

  expect((v2 as { error: string }).error).toContain('newer')
  expect('error' in parseLink(SHARE_URL)).toBe(true)
  expect('error' in parseLink('hello')).toBe(true)
})

test('a hostile payload is refused or cleaned', () => {
  const zeros = enc(`Evil|d|${'zzzzzz'.repeat(12)}|`)

  expect('error' in parseLink(`${SHARE_URL}#v1.${zeros}`)).toBe(true)
  // Pull the real colours of a good theme under a hostile name.
  const colours = decode(payloadOf(themeToLink(DARK))).split('|')[2]!
  const r = parseLink(`${SHARE_URL}#v1.${enc(`<script>alert(1)</script>|d|${colours}`)}`)

  if ('theme' in r) {
    expect(r.theme.name).not.toMatch(/[<>()/]/)
  } else {
    expect(typeof r.error).toBe('string')
  }
  // Text that is too faint on its background is refused.
  const faint = enc(`Faint|d|${'101010'.repeat(7)}${'d98a4e'}d1495b5fa36ad4a02e9b7bc4|`)

  expect('error' in parseLink(`${SHARE_URL}#v1.${faint}`)).toBe(true)
})

test('parseAny takes a code, a link, a bare payload and says what it wants for junk', () => {
  same(DARK, (parseAny(themeToCode(DARK)) as { theme: Theme }).theme)
  same(LIGHT, (parseAny(themeToLink(LIGHT)) as { theme: Theme }).theme)
  same(LIGHT, (parseAny(`v1.${payloadOf(themeToLink(LIGHT))}`) as { theme: Theme }).theme)
  const junk = parseAny('hello there')

  expect('error' in junk).toBe(true)
  expect((junk as { error: string }).error).toContain('code')
  expect((junk as { error: string }).error).toContain('link')
})

test('shareHint is the two install lines', () => {
  expect(shareHint(DARK)).toBe('/plugin marketplace add adembilge/claude-themes\n/plugin install desktop-themes@claude-themes')
})
