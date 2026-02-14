const test = require('node:test');
const assert = require('node:assert');
const scheduler = require('../scheduler');

test('scheduler exports expected functions', (t) => {
    assert.strictEqual(typeof scheduler.runScheduler, 'function');
    assert.strictEqual(typeof scheduler.loadPendingJobs, 'function');
    assert.strictEqual(typeof scheduler.sleep, 'function');
});

test('sleep function waits correctly', async (t) => {
    const start = Date.now();
    await scheduler.sleep(100);
    const end = Date.now();
    assert.ok(end - start >= 90, 'Sleep duration should be approximately correct');
});

test('loadPendingJobs runs safely', (t) => {
    try {
        const result = scheduler.loadPendingJobs();
        // It returns [] if file not found, or object with pendingJobs if found.
        if (Array.isArray(result)) {
             assert.deepStrictEqual(result, []);
        } else {
             assert.ok(result.pendingJobs);
             assert.ok(result.workbook);
        }
    } catch (e) {
        assert.fail(`loadPendingJobs failed: ${e.message}`);
    }
});
