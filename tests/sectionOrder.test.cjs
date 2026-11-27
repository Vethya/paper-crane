/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness. */
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { test } = require('node:test')
const ts = require('typescript')
const getTemplateData = require('../test/loadTemplates.cjs')
/* eslint-enable @typescript-eslint/no-require-imports */

const { moveSection, movableSections, normalizeSections } = (() => {
  const source = ts.transpileModule(
    readFileSync(join(__dirname, '../src/lib/sectionOrder.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
  ).outputText
  const module = { exports: {} }
  new Function('module', 'exports', source)(module, module.exports)
  return module.exports
})()

const DEFAULT = ['profile', 'education', 'work', 'skills', 'projects', 'awards']

test('normalizeSections keeps Profile first and fills in missing sections', () => {
  assert.deepEqual(normalizeSections(['work', 'profile', 'work', 'bogus']), [
    'profile',
    'work',
    'education',
    'skills',
    'projects',
    'awards'
  ])
  assert.deepEqual(normalizeSections(undefined), DEFAULT)
})

test('movableSections leaves Profile out', () => {
  assert.deepEqual(movableSections(DEFAULT), DEFAULT.slice(1))
})

test('moveSection moves up, down, and to the end', () => {
  assert.deepEqual(moveSection(DEFAULT, 'work', 0), [
    'profile',
    'work',
    'education',
    'skills',
    'projects',
    'awards'
  ])
  // Down one: drop before the section two places below.
  assert.deepEqual(moveSection(DEFAULT, 'education', 2), [
    'profile',
    'work',
    'education',
    'skills',
    'projects',
    'awards'
  ])
  assert.deepEqual(moveSection(DEFAULT, 'education', 5), [
    'profile',
    'work',
    'skills',
    'projects',
    'awards',
    'education'
  ])
})

test('moveSection cannot move Profile', () => {
  assert.deepEqual(moveSection(DEFAULT, 'profile', 3), DEFAULT)
})

test('templates render sections in the saved order', () => {
  const { texDoc } = getTemplateData({
    headings: {},
    sections: ['profile', 'skills', 'education', 'work', 'projects', 'awards'],
    selectedTemplate: 1,
    basics: { name: 'Ada' },
    education: [{ institution: 'MIT' }],
    skills: [{ name: 'Rust', keywords: [] }]
  })
  const name = texDoc.indexOf('Ada')
  const skills = texDoc.indexOf('Rust')
  const education = texDoc.indexOf('MIT')
  assert.ok(name !== -1 && name < skills && skills < education)
})
