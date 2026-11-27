const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');
const { parseUserDate } = require('../scan_reels.js');

test('supported formats select the same local calendar day', () => {
  const expected = new Date(2024, 1, 29);
  for (const input of ['2024-02-29', '29/02/2024', '29-02-2024']) {
    assert.deepEqual(parseUserDate(input), expected);
  }
});

test('invalid dates and unsupported formats are rejected', () => {
  for (const input of ['2025-02-29', '31/04/2024', '29/02-2024', 'February 29, 2024']) {
    assert.equal(parseUserDate(input), null, input);
  }
});

for (const [args, message] of [
  [['--since'], /--since/],
  [['--until'], /--until/],
  [['--since', '2026-06-12', '--until', '2026-06-11'], /--since .*--until/],
]) {
  test('CLI rejects invalid range arguments: ' + args.join(' '), () => {
    const script = path.join(__dirname, '..', 'scan_reels.js');
    const result = spawnSync(process.execPath, [script, 'https://example.invalid/reels/', ...args], {
      encoding: 'utf8',
      timeout: 5000,
    });
    assert.ifError(result.error);
    assert.equal(result.status, 1);
    assert.match(result.stderr, message);
    assert.equal(result.stdout, '');
  });
}
