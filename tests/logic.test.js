const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../assets/js/logic.js');
test('BNB units are exact at 18 decimals', () => {
  assert.equal(M.toWei('0.1'), 100000000000000000n);
  assert.equal(M.toWei('1.000000000000000001'), 1000000000000000001n);
  assert.equal(M.toWei('100'), 100000000000000000000n);
  assert.equal(M.toWei('0'), 0n);
});
test('Invalid BNB inputs cannot be silently rounded', () => {
  for (const v of ['.5', '-1', '1.1234567890123456789', 'abc', '1e2', '', '1.', '1,000']) {
    assert.throws(() => M.toWei(v), Error, v);
  }
});
test('uint256 encoding, formatting and zero address validation', () => {
  assert.equal(M.encodeUint256(1n), '0'.repeat(63) + '1');
  assert.equal(M.toHex(255n), '0xff');
  assert.equal(M.formatUnits(1000000000000000001n, 18, 6), '1');
  assert.equal(M.formatUnits(100000000000000000000000n, 18, 3), '100,000');
  assert.equal(M.validAddress('0x' + 'a'.repeat(40)), true);
  assert.equal(M.validAddress('0x' + '0'.repeat(40)), false);
  assert.equal(M.validAddress('0x123'), false);
});
test('countdown works for future, past and missing dates', () => {
  const now = Date.parse('2026-10-19T20:00:00Z');
  assert.deepEqual(M.countdown(null, now), null);
  assert.deepEqual(M.countdown('not-date', now), null);
  assert.deepEqual(M.countdown('2026-10-21T21:02:03Z', now), {totalSeconds: 176523, days: 2, hours: 1, minutes: 2, seconds: 3});
  assert.equal(M.countdown('2020-01-01T00:00:00Z', now).totalSeconds, 0);
});
test('USD conversion is indicative and rejects invalid/stale state', () => {
  assert.equal(M.bnBtoUsd('2.5', 600), 1500);
  assert.equal(M.bnBtoUsd('1', NaN), null);
  assert.equal(M.bnBtoUsd('bad', 600), null);
});
