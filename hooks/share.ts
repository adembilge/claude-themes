import type { Theme } from './model.js'

import { CODE_PREFIX, cleanName, parseCode, sanitizeTheme } from './model.js'

// A theme as a link. Pure: no `$`, no Buffer, no btoa. The page at docs/t/index.html decodes the same format.
//
// Link:    SHARE_URL + '#v1.' + base64url(UTF-8 of  name|d-or-l|<12 colours, six hex digits each, no #>; a fourth part is ignored)
// Colours: surfaces 0..3, text 0..2, accent, danger, success, warning, pro (72 hex digits in a row).

export const SHARE_URL = 'https://adembilge.github.io/claude-themes/t/'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

function utf8Bytes(text: string): number[] {
  const out: number[] = []

  for (const ch of text) {
    const c = ch.codePointAt(0)!

    if (c < 0x80) {
      out.push(c)
    } else if (c < 0x800) {
      out.push(0xc0 | (c >> 6), 0x80 | (c & 63))
    } else if (c < 0x10000) {
      out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
    } else {
      out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
    }
  }

  return out
}

/** The text of well-formed UTF-8 bytes, or null when they are not. */
function utf8Text(bytes: number[]): string | null {
  let out = ''

  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i]!
    const n = b < 0x80 ? 0 : b >= 0xc2 && b < 0xe0 ? 1 : b >= 0xe0 && b < 0xf0 ? 2 : b >= 0xf0 && b < 0xf5 ? 3 : -1

    if (n < 0 || i + n >= bytes.length + (n === 0 ? 1 : 0)) {
      return null
    }
    let c = n === 0 ? b : b & (0x3f >> n)

    for (let k = 1; k <= n; k++) {
      const x = bytes[i + k]!

      if ((x & 0xc0) !== 0x80) {
        return null
      }
      c = (c << 6) | (x & 63)
    }

    if ((n === 2 && c < 0x800) || (n === 3 && c < 0x10000) || c > 0x10ffff || (c >= 0xd800 && c < 0xe000)) {
      return null
    }
    out += String.fromCodePoint(c)
    i += n + 1
  }

  return out
}

function b64urlEncode(bytes: number[]): string {
  let out = ''

  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i]! << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0)

    out += ALPHABET[(n >> 18) & 63]! + ALPHABET[(n >> 12) & 63]!

    if (i + 1 < bytes.length) {
      out += ALPHABET[(n >> 6) & 63]!
    }

    if (i + 2 < bytes.length) {
      out += ALPHABET[n & 63]!
    }
  }

  return out
}

/** The bytes of an unpadded base64url string, or null when it is not one. */
function b64urlDecode(text: string): number[] | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) {
    return null
  }
  const out: number[] = []
  let acc = 0
  let bits = 0

  for (const ch of text) {
    acc = (acc << 6) | ALPHABET.indexOf(ch)
    bits += 6

    if (bits >= 8) {
      bits -= 8
      out.push((acc >> bits) & 255)
      acc &= (1 << bits) - 1
    }
  }

  return out
}

const COLOURS = (t: Theme): string[] => [...t.surfaces, ...t.text, t.accent, t.roles.danger, t.roles.success, t.roles.warning, t.roles.pro]

/** A theme as a link that opens the share page. */
export function themeToLink(t: Theme): string {
  const colours = COLOURS(t).map(c => c.replace('#', '').toLowerCase()).join('')
  const text = `${cleanName(t.name)}|${t.mode === 'light' ? 'l' : 'd'}|${colours}`

  return `${SHARE_URL}#v1.${b64urlEncode(utf8Bytes(text))}`
}

const DAMAGED = 'The link is damaged: it could not be read. Copy it again, whole.'

/** A theme from a full link, or just `v1.<payload>`. Everything goes through sanitizeTheme. */
export function parseLink(text: string): { theme: Theme } | { error: string } {
  const raw = text.trim()
  const hash = raw.indexOf('#')
  const body = hash >= 0 ? raw.slice(hash + 1) : raw
  const m = /^v(\d+)\.(\S*)$/.exec(body)

  if (m === null) {
    return { error: hash >= 0 || /^https?:/i.test(raw) ? 'That link has no theme in it.' : 'That is not a theme link. It looks like https://adembilge.github.io/claude-themes/t/#v1...' }
  }

  if (m[1] !== '1') {
    return { error: 'That link was made by a newer version of Claude Themes. Update the plugin and try again.' }
  }
  const bytes = b64urlDecode(m[2]!)
  const decoded = bytes === null ? null : utf8Text(bytes)

  if (decoded === null) {
    return { error: DAMAGED }
  }
  const parts = decoded.split('|')
  const [name, mode, colours] = parts

  if ((parts.length !== 3 && parts.length !== 4) || mode === undefined || (mode !== 'd' && mode !== 'l') || colours === undefined || !/^[0-9a-fA-F]{72}$/.test(colours)) {
    return { error: DAMAGED }
  }
  const c = Array.from({ length: 12 }, (_, i) => `#${colours.slice(i * 6, i * 6 + 6)}`)
  const theme = sanitizeTheme({
    name,
    mode: mode === 'l' ? 'light' : 'dark',
    surfaces: c.slice(0, 4),
    text: c.slice(4, 7),
    accent: c[7],
    roles: { danger: c[8], success: c[9], warning: c[10], pro: c[11] },
  })

  return theme === null
    ? { error: 'The link holds a palette the app would refuse. Check its colors and the text contrast.' }
    : { theme }
}

/** A theme from a pasted code or a pasted link. */
export function parseAny(text: string): { theme: Theme } | { error: string } {
  const t = text.trim()

  if (t.startsWith(CODE_PREFIX)) {
    return parseCode(t)
  }

  if (t.includes('#v1.') || t.startsWith('v1.') || /^https?:/i.test(t)) {
    return parseLink(t)
  }

  return { error: `That is neither a theme code (it starts with "${CODE_PREFIX}") nor a theme link. Paste either one.` }
}

/** The two lines the share page tells people to run to get the plugin. */
export function shareHint(_t: Theme): string {
  return '/plugin marketplace add adembilge/claude-themes\n/plugin install desktop-themes@claude-themes'
}
