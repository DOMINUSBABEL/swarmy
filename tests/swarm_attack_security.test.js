const { test } = require('node:test');
const assert = require('node:assert');
const { runSwarmAttack } = require('../scripts/swarm_attack.js');

// Mock dependencies
const mockPage = {
    setViewport: async () => {},
    goto: async () => {},
    waitForSelector: async () => ({ click: async () => {}, type: async () => {} }),
    type: async () => {},
    keyboard: { press: async () => {}, type: async () => {} },
    waitForNavigation: async () => {},
    $: async () => null,
    click: async () => {},
    $eval: async () => {},
};

const mockBrowser = {
    newPage: async () => mockPage,
    close: async () => {},
};

const mockPuppeteer = {
    launch: async () => mockBrowser,
};

const mockXlsx = {
    readFile: () => ({ Sheets: { 'ACCOUNTS': {} } }),
    utils: {
        sheet_to_json: () => ([
            { account_id: 'acc_samuel', username: 'test_user', password: 'password' }
        ])
    }
};

test('Security: runSwarmAttack throws error for invalid domain', async () => {
    const invalidUrl = 'http://evil.com/exploit';
    await assert.rejects(
        async () => {
            await runSwarmAttack(invalidUrl, { puppeteer: mockPuppeteer, xlsx: mockXlsx });
        },
        (err) => {
            assert.match(err.message, /Invalid domain/);
            return true;
        }
    );
});

test('Security: runSwarmAttack throws error for invalid protocol', async () => {
    const invalidUrl = 'ftp://x.com/file';
    await assert.rejects(
        async () => {
            await runSwarmAttack(invalidUrl, { puppeteer: mockPuppeteer, xlsx: mockXlsx });
        },
        (err) => {
            assert.match(err.message, /Invalid protocol/);
            return true;
        }
    );
});

test('Security: runSwarmAttack accepts valid x.com URL', async () => {
    const validUrl = 'https://x.com/good_tweet';
    // Should not throw
    await runSwarmAttack(validUrl, { puppeteer: mockPuppeteer, xlsx: mockXlsx });
});

test('Security: runSwarmAttack accepts valid twitter.com URL', async () => {
    const validUrl = 'https://twitter.com/good_tweet';
    // Should not throw
    await runSwarmAttack(validUrl, { puppeteer: mockPuppeteer, xlsx: mockXlsx });
});

test('Compatibility: runSwarmAttack uses default URL if called with deps only', async () => {
    // Should not throw and use default URL (which is valid)
    await runSwarmAttack({ puppeteer: mockPuppeteer, xlsx: mockXlsx });
});

test('Compatibility: runSwarmAttack uses default URL if called with undefined', async () => {
    // Should not throw
    await runSwarmAttack(undefined, { puppeteer: mockPuppeteer, xlsx: mockXlsx });
});
