const { test, mock } = require('node:test');
const assert = require('node:assert');
const { runSwarmAttack } = require('../scripts/swarm_attack.js');

test('Swarm Attack uses single browser instance and multiple contexts', async () => {
    // 1. Mock Data
    const mockAccounts = [
        { account_id: 'acc_1', username: 'user1', password: 'pw1' },
        { account_id: 'acc_2', username: 'user2', password: 'pw2' }
    ];

    // 2. Mock Puppeteer
    const mockPage = {
        setViewport: mock.fn(),
        goto: mock.fn(),
        waitForSelector: mock.fn(() => Promise.resolve({ click: mock.fn() })),
        type: mock.fn(),
        click: mock.fn(),
        keyboard: { press: mock.fn(), type: mock.fn() },
        $: mock.fn(() => Promise.resolve(null)), // Mock selector finding nothing for simplicity
        waitForNavigation: mock.fn()
    };

    const mockContext = {
        newPage: mock.fn(() => Promise.resolve(mockPage)),
        close: mock.fn()
    };

    const mockBrowser = {
        createBrowserContext: mock.fn(() => Promise.resolve(mockContext)),
        close: mock.fn()
    };

    const mockPuppeteer = {
        launch: mock.fn(() => Promise.resolve(mockBrowser))
    };

    // 3. Run the function with injected dependencies
    // Suppress console.log for clean test output
    const originalLog = console.log;
    const originalError = console.error;
    console.log = () => {};
    console.error = () => {};

    try {
        await runSwarmAttack(mockAccounts, mockPuppeteer);
    } finally {
        console.log = originalLog;
        console.error = originalError;
    }

    // 4. Assertions
    // Browser should be launched exactly once
    assert.strictEqual(mockPuppeteer.launch.mock.callCount(), 1, 'Browser should be launched exactly once');

    // Context should be created for each account (2 times)
    assert.strictEqual(mockBrowser.createBrowserContext.mock.callCount(), mockAccounts.length, 'Context should be created for each account');

    // Context should be closed for each account (2 times)
    assert.strictEqual(mockContext.close.mock.callCount(), mockAccounts.length, 'Context should be closed for each account');

    // Browser should be closed exactly once at the end
    assert.strictEqual(mockBrowser.close.mock.callCount(), 1, 'Browser should be closed exactly once');

    // Check if newPage was called on context, not browser
    assert.strictEqual(mockContext.newPage.mock.callCount(), mockAccounts.length, 'newPage should be called on context');
});
