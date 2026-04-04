const { test, describe } = require('node:test');
const assert = require('node:assert');
const { runSwarmAttack, validateTargetUrl } = require('../scripts/swarm_attack.js');

describe('swarm_attack.js', () => {

    describe('validateTargetUrl', () => {
        test('validates valid twitter.com and x.com URLs', () => {
            const validUrls = [
                'https://x.com/luisguillermovl/status/2022646985677840818',
                'http://twitter.com/anyuser/status/12345',
                'https://www.x.com/post',
                'http://www.twitter.com/test'
            ];

            for (const url of validUrls) {
                assert.strictEqual(validateTargetUrl(url), url);
            }
        });

        test('throws error for invalid protocols', () => {
            const invalidProtocolUrl = 'ftp://x.com/test';
            assert.throws(() => {
                validateTargetUrl(invalidProtocolUrl);
            }, /Invalid protocol: ftp:/);
        });

        test('throws error for invalid domains', () => {
            const invalidDomainUrl = 'https://example.com/test';
            assert.throws(() => {
                validateTargetUrl(invalidDomainUrl);
            }, /Invalid domain: example\.com/);
        });

        test('throws error for malformed inputs', () => {
            const malformedUrl = 'not-a-url';
            assert.throws(() => {
                validateTargetUrl(malformedUrl);
            }, /Invalid Target URL/);
        });
    });

    test('runSwarmAttack closes browser when error occurs', async () => {
        // Mock dependencies
        let browserClosed = false;

        const mockBrowser = {
            newPage: async () => {
                throw new Error('Simulated failure in newPage');
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
