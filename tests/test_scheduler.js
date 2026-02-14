const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { processJob } = require('../scheduler');

// Create a dummy platform module
const TEST_PLATFORM_NAME = 'test_platform_123';
const TEST_PLATFORM_PATH = path.join(__dirname, '..', 'platforms', `${TEST_PLATFORM_NAME}.js`);

test('Scheduler Platform Integration', async (t) => {
    // Setup: Create a mock platform module
    const mockPlatformContent = `
        module.exports = {
            post: async (account, content, options) => {
                // Record the call
                global.test_post_called = true;
                global.test_post_args = { account, content, options };
                return { success: true };
            }
        };
    `;

    fs.writeFileSync(TEST_PLATFORM_PATH, mockPlatformContent);

    // Using global to communicate with the mocked module because require will load it in a separate scope but same global context in Node
    global.test_post_called = false;
    global.test_post_args = null;

    t.after(() => {
        // Cleanup
        if (fs.existsSync(TEST_PLATFORM_PATH)) {
            fs.unlinkSync(TEST_PLATFORM_PATH);
        }
        delete global.test_post_called;
        delete global.test_post_args;
    });

    await t.test('processJob should dynamically load platform and call post', async () => {
        const job = {
            post_id: 'test_post_1',
            content_text: 'Hello World',
            target_url: 'http://example.com',
            account: {
                username: 'testuser',
                password: 'password',
                platform: TEST_PLATFORM_NAME
            }
        };

        const result = await processJob(job);

        assert.strictEqual(result.success, true);
        assert.strictEqual(global.test_post_called, true, 'Platform post method should be called');
        assert.strictEqual(global.test_post_args.account.username, 'testuser');
        assert.strictEqual(global.test_post_args.content, 'Hello World');
        assert.strictEqual(global.test_post_args.options.target_url, 'http://example.com');
        assert.strictEqual(global.test_post_args.options.post_id, 'test_post_1');
    });

    await t.test('processJob should fail if platform module is missing', async () => {
        const job = {
            post_id: 'test_post_2',
            content_text: 'Hello World',
            account: {
                username: 'testuser',
                platform: 'non_existent_platform'
            }
        };

        const result = await processJob(job);
        assert.strictEqual(result.success, false);
        assert.match(result.error, /Platform module not found/);
    });

    await t.test('processJob should fail if platform is not specified', async () => {
        const job = {
            post_id: 'test_post_3',
            content_text: 'Hello World',
            account: {
                username: 'testuser'
            }
        };

        const result = await processJob(job);
        assert.strictEqual(result.success, false);
        assert.match(result.error, /Platform not specified/);
    });
});
