const { test } = require('node:test');
const assert = require('node:assert');
const { processJob } = require('../scheduler.js');

test('Security: processJob blocks untrusted target_url', async () => {
    const job = {
        post_id: 'test_sec_fix',
        account: { username: 'testuser', password: 'password' },
        content_text: 'Hello',
        target_url: 'http://evil.com/ssrf'
    };

    let gotoCalls = [];
    const mockPage = {
        goto: async (url) => {
            gotoCalls.push(url);
        },
        waitForSelector: async () => true,
        click: async () => {},
        keyboard: { type: async () => {} },
        screenshot: async () => {}
    };

    const mockBrowser = {
        newPage: async () => mockPage,
        close: async () => {},
        pages: async () => [mockPage]
    };

    const mockPuppeteer = {
        launch: async () => mockBrowser
    };

    // Run processJob
    const result = await processJob(job, mockPuppeteer);

    // Verify it failed
    assert.strictEqual(result.success, false);
    assert.match(result.error, /Invalid domain/);

    // Verify it did NOT navigate to the evil URL
    const hasEvilCall = gotoCalls.includes('http://evil.com/ssrf');
    assert.strictEqual(hasEvilCall, false, 'SUCCESS: processJob blocked untrusted target_url');
});

test('Security: processJob allows trusted target_url', async () => {
    const job = {
        post_id: 'test_sec_valid',
        account: { username: 'testuser', password: 'password' },
        content_text: 'Hello',
        target_url: 'https://x.com/some_post'
    };

    let gotoCalls = [];
    const mockPage = {
        goto: async (url) => {
            gotoCalls.push(url);
        },
        waitForSelector: async () => true,
        click: async () => {},
        keyboard: { type: async () => {} },
        screenshot: async () => {}
    };

    const mockBrowser = {
        newPage: async () => mockPage,
        close: async () => {},
        pages: async () => [mockPage]
    };

    const mockPuppeteer = {
        launch: async () => mockBrowser
    };

    // Run processJob
    const result = await processJob(job, mockPuppeteer);

    // Verify it succeeded in navigation
    assert.strictEqual(result.success, true);
    assert.ok(gotoCalls.includes('https://x.com/some_post'), 'SUCCESS: processJob allowed trusted target_url');
});
