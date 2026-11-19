import { expect, test } from 'claude-code/testing'

import { TERMINAL_PATH, terminalOverrides, toClaudeCode } from './claudecode.js'
import { HEX } from './model.js'
import { PACKS } from './packs.js'

const sample = PACKS

test('the file is a Claude Code theme: name, base and overrides', () => {
  const t = sample[0]!
  const file = JSON.parse(toClaudeCode(t)) as { name: string; base: string; overrides: Record<string, string> }

  expect(file.name).toContain(t.name)
  expect(file.base).toBe(t.mode)
  expect(Object.keys(file.overrides).length).toBeGreaterThan(20)
})

test('every override of every theme is a six-digit hex', () => {
  expect(sample.length).toBeGreaterThan(0)

  for (const t of sample) {
    for (const [token, color] of Object.entries(terminalOverrides(t))) {
      expect(HEX.test(color), `${t.id} ${token} ${color}`).toBe(true)
    }
  }
})

test('the accent, status colors and surfaces land on the right tokens', () => {
  const t = sample[0]!
  const o = terminalOverrides(t)

  expect(o.claude).toBe(t.accent)
  expect(o.error).toBe(t.roles.danger)
  expect(o.success).toBe(t.roles.success)
  expect(o.text).toBe(t.text[0])
  expect(o.userMessageBackground).toBe(t.surfaces[1])
})

test('the file goes in the themes folder of the home directory', () => {
  expect(TERMINAL_PATH).toBe('.claude/themes/claude-themes.json')
})
