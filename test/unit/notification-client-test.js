'use strict'
const test = require('tape')
const ldn = require('../../lib/index')

test('notification discovery/sending api test', t => {
  t.ok(ldn.send)
  t.ok(ldn.discoverInboxUri)
  t.end()
})
