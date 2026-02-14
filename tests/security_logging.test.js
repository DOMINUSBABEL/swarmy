const path = require('path');
const { test, mock } = require('node:test');
const assert = require('node:assert');

test('Security Vulnerability: Sensitive Data Logging', async (t) => {
    // Mock puppeteer
    const dummyBrowser = {
        newPage: async () => ({
            setViewport: async () => {},
            goto: async () => {},
            waitForSelector: async () => ({ click: async () => {} }),
            type: async () => {},
            click: async () => {},
            keyboard: { press: async () => {}, type: async () => {} },
            waitForNavigation: async () => {},
            $: async () => null // element not found (like button)
        }),
        close: async () => {}
    };

    const mockPuppeteer = {
        launch: async () => dummyBrowser
    };

    // Override require cache for puppeteer
    const puppeteerPath = require.resolve('puppeteer');
    require.cache[puppeteerPath] = {
        id: puppeteerPath,
        filename: puppeteerPath,
        loaded: true,
        exports: mockPuppeteer
    };

    // Mock xlsx
    const dummyAccount = {
        account_id: 'acc_samuel',
        username: 'SENSITIVE_USERNAME_123',
        password: 'password123'
    };

    const mockXlsx = {
        readFile: () => ({ Sheets: { 'ACCOUNTS': {} } }),
        utils: {
            sheet_to_json: () => [dummyAccount]
        }
    };

    // Override require cache for xlsx
    const xlsxPath = require.resolve('xlsx');
    require.cache[xlsxPath] = {
        id: xlsxPath,
        filename: xlsxPath,
        loaded: true,
        exports: mockXlsx
    };

    // Spy on console.log
    const logSpy = t.mock.method(console, 'log');
    t.mock.method(console, 'error'); // Suppress errors if needed

    // Import the function
    const { runSwarmAttack } = require('../scripts/swarm_attack.js');

    await runSwarmAttack();

    // Assert that the username was NOT logged
    const calls = logSpy.mock.calls.map(c => c.arguments.join(' '));
    const sensitiveLog = calls.find(msg => msg.includes('SENSITIVE_USERNAME_123'));

    assert.ok(!sensitiveLog, 'Fix verified: Username was NOT logged.');
});
