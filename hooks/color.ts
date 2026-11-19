import { hslHex } from './model.js'

// Reads a color a person typed: a hex, rgb(), hsl() or a CSS color name, as a six-digit hex. Pure: no `$`.

/** The CSS color names (without alpha). */
const NAMES: Record<string, string> = {
  aliceblue: 'f0f8ff', antiquewhite: 'faebd7', aqua: '00ffff', aquamarine: '7fffd4', azure: 'f0ffff', beige: 'f5f5dc',
  bisque: 'ffe4c4', black: '000000', blanchedalmond: 'ffebcd', blue: '0000ff', blueviolet: '8a2be2', brown: 'a52a2a',
  burlywood: 'deb887', cadetblue: '5f9ea0', chartreuse: '7fff00', chocolate: 'd2691e', coral: 'ff7f50',
  cornflowerblue: '6495ed', cornsilk: 'fff8dc', crimson: 'dc143c', cyan: '00ffff', darkblue: '00008b',
  darkcyan: '008b8b', darkgoldenrod: 'b8860b', darkgray: 'a9a9a9', darkgreen: '006400', darkgrey: 'a9a9a9',
  darkkhaki: 'bdb76b', darkmagenta: '8b008b', darkolivegreen: '556b2f', darkorange: 'ff8c00', darkorchid: '9932cc',
  darkred: '8b0000', darksalmon: 'e9967a', darkseagreen: '8fbc8f', darkslateblue: '483d8b', darkslategray: '2f4f4f',
  darkslategrey: '2f4f4f', darkturquoise: '00ced1', darkviolet: '9400d3', deeppink: 'ff1493', deepskyblue: '00bfff',
  dimgray: '696969', dimgrey: '696969', dodgerblue: '1e90ff', firebrick: 'b22222', floralwhite: 'fffaf0',
  forestgreen: '228b22', fuchsia: 'ff00ff', gainsboro: 'dcdcdc', ghostwhite: 'f8f8ff', gold: 'ffd700',
  goldenrod: 'daa520', gray: '808080', green: '008000', greenyellow: 'adff2f', grey: '808080', honeydew: 'f0fff0',
  hotpink: 'ff69b4', indianred: 'cd5c5c', indigo: '4b0082', ivory: 'fffff0', khaki: 'f0e68c', lavender: 'e6e6fa',
  lavenderblush: 'fff0f5', lawngreen: '7cfc00', lemonchiffon: 'fffacd', lightblue: 'add8e6', lightcoral: 'f08080',
  lightcyan: 'e0ffff', lightgoldenrodyellow: 'fafad2', lightgray: 'd3d3d3', lightgreen: '90ee90', lightgrey: 'd3d3d3',
  lightpink: 'ffb6c1', lightsalmon: 'ffa07a', lightseagreen: '20b2aa', lightskyblue: '87cefa', lightslategray: '778899',
  lightslategrey: '778899', lightsteelblue: 'b0c4de', lightyellow: 'ffffe0', lime: '00ff00', limegreen: '32cd32',
  linen: 'faf0e6', magenta: 'ff00ff', maroon: '800000', mediumaquamarine: '66cdaa', mediumblue: '0000cd',
  mediumorchid: 'ba55d3', mediumpurple: '9370db', mediumseagreen: '3cb371', mediumslateblue: '7b68ee',
  mediumspringgreen: '00fa9a', mediumturquoise: '48d1cc', mediumvioletred: 'c71585', midnightblue: '191970',
  mintcream: 'f5fffa', mistyrose: 'ffe4e1', moccasin: 'ffe4b5', navajowhite: 'ffdead', navy: '000080',
  oldlace: 'fdf5e6', olive: '808000', olivedrab: '6b8e23', orange: 'ffa500', orangered: 'ff4500', orchid: 'da70d6',
  palegoldenrod: 'eee8aa', palegreen: '98fb98', paleturquoise: 'afeeee', palevioletred: 'db7093',
  papayawhip: 'ffefd5', peachpuff: 'ffdab9', peru: 'cd853f', pink: 'ffc0cb', plum: 'dda0dd', powderblue: 'b0e0e6',
  purple: '800080', rebeccapurple: '663399', red: 'ff0000', rosybrown: 'bc8f8f', royalblue: '4169e1',
  saddlebrown: '8b4513', salmon: 'fa8072', sandybrown: 'f4a460', seagreen: '2e8b57', seashell: 'fff5ee',
  sienna: 'a0522d', silver: 'c0c0c0', skyblue: '87ceeb', slateblue: '6a5acd', slategray: '708090', slategrey: '708090',
  snow: 'fffafa', springgreen: '00ff7f', steelblue: '4682b4', tan: 'd2b48c', teal: '008080', thistle: 'd8bfd8',
  tomato: 'ff6347', turquoise: '40e0d0', violet: 'ee82ee', wheat: 'f5deb3', white: 'ffffff', whitesmoke: 'f5f5f5',
  yellow: 'ffff00', yellowgreen: '9acd32',
}

const hex2 = (n: number): string => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')

/** One number of a function color: `120`, `47%` (of `full`), `120deg`; undefined when it is not one. */
function amount(token: string, full: number): number | undefined {
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+))(%|deg|turn)?$/.exec(token)

  if (m === null) {
    return undefined
  }
  const v = parseFloat(m[1]!)

  if (m[2] === '%') {
    return (v / 100) * full
  }

  return m[2] === 'turn' ? v * 360 : v
}

/**
 * A six-digit hex (`#d98a4e`) from text a person typed, or null when it is not a color.
 * Reads `#rgb`, `#rrggbb`, `rrggbb`, `#rrggbbaa` (alpha ignored), `rgb(217, 138, 78)`, `rgb(85% 54% 31%)`,
 * `hsl(26, 65%, 56%)`, three numbers in a row (`217 138 78`) and CSS names such as `coral`. Case and spacing do not matter.
 */
export function parseColor(input: string): string | null {
  const text = input.trim().toLowerCase()

  if (text === '') {
    return null
  }
  const hex = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(text)

  if (hex !== null) {
    const d = hex[1]!
    const six = d.length <= 4 ? [...d.slice(0, 3)].map(c => c + c).join('') : d.slice(0, 6)

    return `#${six}`
  }
  const name = NAMES[text.replace(/[\s_-]+/g, '')]

  if (name !== undefined) {
    return `#${name}`
  }
  const fn = /^(rgba?|hsla?)\s*\(\s*([^)]*)\)$/.exec(text)
  const kind = fn === null ? 'rgb' : fn[1]!.slice(0, 3)
  const body = fn === null ? text : fn[2]!
  const parts = body.replace(/[,/]/g, ' ').split(/\s+/).filter(p => p !== '')

  if (fn === null && !/^[0-9.\s%,+-]+$/.test(text)) {
    return null
  }

  if (parts.length < 3 || parts.length > 4) {
    return null
  }

  if (kind === 'rgb') {
    const [r, g, b] = [amount(parts[0]!, 255), amount(parts[1]!, 255), amount(parts[2]!, 255)]

    return r === undefined || g === undefined || b === undefined || [r, g, b].some(v => v < 0 || v > 255)
      ? null
      : `#${hex2(r)}${hex2(g)}${hex2(b)}`
  }
  const [h, s, l] = [amount(parts[0]!, 360), amount(parts[1]!, 100), amount(parts[2]!, 100)]

  if (h === undefined || s === undefined || l === undefined || s < 0 || s > 100 || l < 0 || l > 100) {
    return null
  }

  return hslHex(((h % 360) + 360) % 360, s, l)
}

/** What to tell a person about what they have typed so far: the hex it reads as, or how to fix it. Empty when it is already a plain hex. */
export function colorHint(input: string): string {
  const text = input.trim()

  if (text === '') {
    return 'Accepts #d98a4e, rgb(217, 138, 78), hsl(26, 65%, 56%) or a color name such as coral.'
  }
  const hex = parseColor(text)

  if (hex === null) {
    return 'Not a color yet. Try #d98a4e, rgb(217, 138, 78), hsl(26, 65%, 56%) or a name such as coral.'
  }

  return hex === text.toLowerCase() ? '' : `Reads as ${hex}.`
}
