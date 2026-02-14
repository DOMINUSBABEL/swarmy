const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { processJob } = require('../scheduler.js');

test('Scheduler should dynamically import platform module', async (t) => {
    const testPlatformPath = path.join(__dirname, '../platforms/test_platform.js');

    // Create mock platform
    fs.writeFileSync(testPlatformPath, `
        module.exports = {
            post: async (job) => {
                return { success: true };
            }
        };
    `);

    try {
        const job = {
            post_id: 'test_123',
            account: {
                username: 'test_user',
                platform: 'test_platform'
            },
            content_text: 'Test content'
        };

        const result = await processJob(job);
        assert.strictEqual(result.success, true);
    } finally {
        // Cleanup
        if (fs.existsSync(testPlatformPath)) {
            fs.unlinkSync(testPlatformPath);
        }
    }
});
