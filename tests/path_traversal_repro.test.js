const { test } = require('node:test');
const assert = require('node:assert');
const { processJob } = require('../scheduler.js');

test('processJob sanitizes post_id for screenshot path', async () => {
    const job = {
        post_id: '../traversal_test!@#',
        account: { username: 'testuser' },
        content_text: 'Hello world'
    };

    let capturedPath = '';
    const mockPuppeteer = {
        launch: async () => ({
            newPage: async () => ({
                goto: async () => { throw new Error('Simulated failure'); }
            }),
            pages: async () => [{
                screenshot: async (opts) => {
                    capturedPath = opts.path;
                }
            }],
            close: async () => {}
        })
    };

    await processJob(job, mockPuppeteer);

    // Expected sanitized: logs/fail_traversal_test___.png
    assert.strictEqual(capturedPath, 'logs/fail_traversal_test___.png');
});
