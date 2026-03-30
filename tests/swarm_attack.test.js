const { test, describe } = require('node:test');
const assert = require('node:assert');
const { runSwarmAttack } = require('../scripts/swarm_attack.js');

describe('swarm_attack.js', () => {

    test('runSwarmAttack closes browser when error occurs', async () => {
        // Mock dependencies
        let browserClosed = false;

        const mockBrowser = {
            createBrowserContext: async () => ({
                newPage: async () => {
                    throw new Error('Simulated failure in newPage');
                },
                close: async () => {}
            }),
            newPage: async () => { // Keep for backward compat if needed, though not used
                throw new Error('Should not be called directly on browser');
            },
            close: async () => {
                browserClosed = true;
            }
        };

        const mockPuppeteer = {
            launch: async () => mockBrowser
        };

        const mockXlsx = {
            readFile: () => ({ Sheets: { 'ACCOUNTS': {} } }),
            utils: {
                sheet_to_json: () => ([
                    { account_id: 'acc_samuel', username: 'test_user', password: 'password' }
                ])
            }
        };

        // Suppress console output to keep test output clean
        const originalConsoleError = console.error;
        const originalConsoleLog = console.log;
        console.error = () => {};
        console.log = () => {};

        try {
            await runSwarmAttack({ puppeteer: mockPuppeteer, xlsx: mockXlsx });
        } finally {
            console.error = originalConsoleError;
            console.log = originalConsoleLog;
        }

        assert.strictEqual(browserClosed, true, 'Browser should be closed even if an error occurs');
    });
});
