const assert = require('node:assert/strict')
const test = require('node:test')
const getTemplateData = require('./loadTemplates.cjs')

const { TEMPLATES } = getTemplateData.loadModule('constants')
const { engineTemplateBundles, templateEngine } =
  getTemplateData.loadModule('engines')

test('the engine preload covers every template bundle', () => {
  for (const selectedTemplate of TEMPLATES) {
    const { opts } = getTemplateData({ selectedTemplate, sections: [] })
    assert.equal(templateEngine(selectedTemplate), opts.cmd)
    const preloaded = engineTemplateBundles[opts.cmd]
    for (const bundle of opts.bundles ?? []) {
      assert.ok(
        preloaded.includes(bundle),
        `template ${selectedTemplate} bundle ${bundle} is not preloaded`
      )
    }
  }
})

test('unknown templates default to pdfLaTeX', () => {
  assert.equal(templateEngine(undefined), 'pdflatex')
  assert.equal(templateEngine(99), 'pdflatex')
})
