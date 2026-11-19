import { expect, test } from 'claude-code/testing'

import { colorHint, parseColor } from './color.js'

test('hex in every spelling', () => {
  expect(parseColor('#d98a4e')).toBe('#d98a4e')
  expect(parseColor('D98A4E')).toBe('#d98a4e')
  expect(parseColor('  #AbC  ')).toBe('#aabbcc')
  expect(parseColor('abc')).toBe('#aabbcc')
  expect(parseColor('#d98a4eff')).toBe('#d98a4e')
  expect(parseColor('#abcd')).toBe('#aabbcc')
})

test('rgb in the usual spellings', () => {
  expect(parseColor('rgb(217, 138, 78)')).toBe('#d98a4e')
  expect(parseColor('RGB(217,138,78)')).toBe('#d98a4e')
  expect(parseColor('rgb(217 138 78)')).toBe('#d98a4e')
  expect(parseColor('rgba(217, 138, 78, 0.5)')).toBe('#d98a4e')
  expect(parseColor('rgb(217 138 78 / 50%)')).toBe('#d98a4e')
  expect(parseColor('rgb(100%, 0%, 50%)')).toBe('#ff0080')
  expect(parseColor('217 138 78')).toBe('#d98a4e')
  expect(parseColor('217, 138, 78')).toBe('#d98a4e')
})

test('hsl in the usual spellings', () => {
  expect(parseColor('hsl(0, 100%, 50%)')).toBe('#ff0000')
  expect(parseColor('hsl(120 100% 25%)')).toBe('#008000')
  expect(parseColor('hsla(240, 100%, 50%, 0.3)')).toBe('#0000ff')
  expect(parseColor('hsl(360, 100%, 50%)')).toBe('#ff0000')
  expect(parseColor('hsl(-120, 100%, 50%)')).toBe('#0000ff')
  expect(parseColor('hsl(0.5turn, 100%, 50%)')).toBe('#00ffff')
  expect(parseColor('hsl(26deg 65% 56%)')).toMatch(/^#[0-9a-f]{6}$/)
})

test('color names', () => {
  expect(parseColor('coral')).toBe('#ff7f50')
  expect(parseColor('Rebecca Purple')).toBe('#663399')
  expect(parseColor('dark-slate-blue')).toBe('#483d8b')
  expect(parseColor('  TEAL ')).toBe('#008080')
})

test('things that are not colors give null', () => {
  for (const bad of ['', '   ', 'nope', '#12', '#12345', '#gggggg', 'rgb(1, 2)', 'rgb(300, 0, 0)', 'rgb(-1, 0, 0)', 'hsl(0, 120%, 50%)', 'rgb(a, b, c)', 'hsl(0, 50%)', '1 2', '1 2 3 4 5', 'color(red)']) {
    expect(parseColor(bad), JSON.stringify(bad)).toBeNull()
  }
})

test('every name reads as a six-digit hex', () => {
  for (const name of ['aliceblue', 'yellowgreen', 'lightgoldenrodyellow', 'mediumspringgreen', 'black', 'white']) {
    expect(parseColor(name)).toMatch(/^#[0-9a-f]{6}$/)
  }
})

test('the hint says what was read, or how to fix it', () => {
  expect(colorHint('')).toContain('Accepts')
  expect(colorHint('#d98a4e')).toBe('')
  expect(colorHint('coral')).toBe('Reads as #ff7f50.')
  expect(colorHint('rgb(217, 138, 78)')).toBe('Reads as #d98a4e.')
  expect(colorHint('D98A4E')).toBe('Reads as #d98a4e.')
  expect(colorHint('#d98')).toBe('Reads as #dd9988.')
  expect(colorHint('banana split')).toContain('Not a color yet')
})
