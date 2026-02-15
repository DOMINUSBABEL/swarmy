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

    // Mock Puppeteer
    const mockPuppeteer = {
        launch: async () => {
            throw new Error('Launch failed');
        }
    };

    // Run processJob with mock
    const result = await processJob(job, mockPuppeteer);

    // Verify result
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Launch failed');
});
