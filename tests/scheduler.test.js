const { test } = require('node:test');
const assert = require('node:assert');
const { processJob } = require('../scheduler.js');

test('processJob handles errors gracefully', async () => {
    // Mock job
    const job = {
        post_id: 'test_job_1',
        account: { username: 'testuser', password: 'password' },
        content_text: 'Hello world'
    };

    // Mock Browser
    const mockBrowser = {
        createBrowserContext: async () => {
            throw new Error('Context creation failed');
        }
    };

    // Run processJob with mock
    const result = await processJob(job, mockBrowser);

    // Verify result
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Context creation failed');
});
