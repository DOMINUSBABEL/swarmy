const { test, describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert');

// Create Mock Objects
const mockPage = {
    goto: mock.fn(async () => {}),
    waitForSelector: mock.fn(async () => {}),
    type: mock.fn(async () => {}),
    keyboard: {
        press: mock.fn(async () => {}),
        type: mock.fn(async () => {})
    },
    waitForNavigation: mock.fn(async () => {}),
    click: mock.fn(async () => {}),
    screenshot: mock.fn(async () => {}),
    url: mock.fn(() => 'http://example.com')
};

const mockBrowser = {
    newPage: mock.fn(async () => mockPage),
    pages: mock.fn(async () => [mockPage]),
    close: mock.fn(async () => {})
};

const mockPuppeteer = {
    launch: mock.fn(async () => mockBrowser)
};

// Also mock console.log to avoid clutter
mock.method(console, 'log', () => {});

// Import the function to test
const { processJob } = require('../scheduler.js');

describe('Scheduler processJob', () => {
    beforeEach(() => {
        // Reset mocks
        mockPuppeteer.launch.mock.resetCalls();
        mockBrowser.newPage.mock.resetCalls();
        mockBrowser.pages.mock.resetCalls();
        mockBrowser.close.mock.resetCalls();

        mockPage.goto.mock.resetCalls();
        mockPage.waitForSelector.mock.resetCalls();
        mockPage.type.mock.resetCalls();
        mockPage.keyboard.press.mock.resetCalls();
        mockPage.keyboard.type.mock.resetCalls();
        mockPage.waitForNavigation.mock.resetCalls();
        mockPage.click.mock.resetCalls();
        mockPage.screenshot.mock.resetCalls();
    });

    it('should process a new post successfully', async (t) => {
        const job = {
            post_id: 'job_success',
            account: { username: 'user1', password: 'pwd' },
            content_text: 'Hello World'
        };

        const mockSleep = mock.fn(async () => {});

        const result = await processJob(job, { puppeteer: mockPuppeteer, sleep: mockSleep });

        assert.deepStrictEqual(result, { success: true });

        // Verify Puppeteer flow
        assert.strictEqual(mockPuppeteer.launch.mock.callCount(), 1);
        assert.strictEqual(mockBrowser.newPage.mock.callCount(), 1);

        // Verify Login
        const gotoCall = mockPage.goto.mock.calls[0];
        assert.strictEqual(gotoCall.arguments[0], 'https://twitter.com/i/flow/login');

        const typeCalls = mockPage.type.mock.calls;
        assert.ok(typeCalls.length >= 2, 'Should type username and password');
        assert.strictEqual(typeCalls[0].arguments[1], 'user1');
        assert.strictEqual(typeCalls[1].arguments[1], 'pwd');

        // Verify Tweet
        const keyboardTypeCalls = mockPage.keyboard.type.mock.calls;
        assert.strictEqual(keyboardTypeCalls[0].arguments[0], 'Hello World');

        // Verify sleeps
        assert.ok(mockSleep.mock.callCount() >= 3, 'Should verify sleep calls');

        assert.strictEqual(mockBrowser.close.mock.callCount(), 1);
    });

    it('should process a reply successfully', async (t) => {
        const job = {
            post_id: 'job_reply',
            account: { username: 'user1', password: 'pwd' },
            content_text: 'Nice post',
            target_url: 'https://twitter.com/someone/status/123'
        };

        const mockSleep = mock.fn(async () => {});

        const result = await processJob(job, { puppeteer: mockPuppeteer, sleep: mockSleep });

        assert.deepStrictEqual(result, { success: true });

        // Verify target url navigation
        const gotoCalls = mockPage.goto.mock.calls;
        // 1. login, 2. target_url
        assert.ok(gotoCalls.length >= 2);
        assert.strictEqual(gotoCalls[1].arguments[0], 'https://twitter.com/someone/status/123');

        assert.ok(mockSleep.mock.callCount() >= 3);
    });

    it('should handle errors and take screenshot', async (t) => {
        // Simulate failure in launch
        mockPuppeteer.launch.mock.mockImplementationOnce(async () => {
            throw new Error('Launch failed');
        });

        const job = {
            post_id: 'job_fail_launch',
            account: { username: 'user1' },
            content_text: 'Fail'
        };

        const mockSleep = mock.fn(async () => {});

        const result = await processJob(job, { puppeteer: mockPuppeteer, sleep: mockSleep });

        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Launch failed');
        assert.strictEqual(mockBrowser.close.mock.callCount(), 0);
    });

    it('should take screenshot if page action fails', async (t) => {
        // Fail on goto login
        mockPage.goto.mock.mockImplementationOnce(async () => {
            throw new Error('Navigation failed');
        });

        const job = {
            post_id: 'job_fail_nav',
            account: { username: 'user1' },
            content_text: 'Fail'
        };

        const mockSleep = mock.fn(async () => {});

        const result = await processJob(job, { puppeteer: mockPuppeteer, sleep: mockSleep });

        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Navigation failed');

        // Verify screenshot
        assert.strictEqual(mockPage.screenshot.mock.callCount(), 1);
        const screenshotPath = mockPage.screenshot.mock.calls[0].arguments[0].path;
        assert.ok(screenshotPath.includes('fail_job_fail_nav.png'));

        // Verify cleanup
        assert.strictEqual(mockBrowser.close.mock.callCount(), 1);
    });
});
