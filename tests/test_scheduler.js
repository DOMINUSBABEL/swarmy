const { test } = require('node:test');
const assert = require('node:assert');
const scheduler = require('../scheduler.js');

test('scheduler exports functions', () => {
    assert.strictEqual(typeof scheduler.processJob, 'function');
    assert.strictEqual(typeof scheduler.loadPendingJobs, 'function');
    assert.strictEqual(typeof scheduler.runScheduler, 'function');
    assert.strictEqual(typeof scheduler.sleep, 'function');
    assert.strictEqual(typeof scheduler.log, 'function');
});

test('processJob accepts a job object', async (t) => {
    // We cannot easily run processJob because it uses puppeteer.
    // But we can assert it is an async function.
    assert.strictEqual(scheduler.processJob.constructor.name, 'AsyncFunction');
});
