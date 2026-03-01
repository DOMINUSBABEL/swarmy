const { describe, it, mock } = require('node:test');
const assert = require('node:assert');
const { auditSwarm, MIN_POST_LENGTH, MIN_ACTIVE_AGENTS, TARGET_AGENT_COUNT } = require('../scripts/fouche_audit.js');

describe('Fouche Audit Script', () => {

    it('should identify short posts as low quality', () => {
        // Mock fs
        const fsMock = {
            existsSync: mock.fn(() => true),
            mkdirSync: mock.fn(),
            appendFileSync: mock.fn(),
        };

        // Mock xlsx
        const accountsSheet = { name: 'ACCOUNTS' };
        const calendarSheet = { name: 'CALENDAR' };

        const xlsxMock = {
            readFile: mock.fn(() => ({
                Sheets: {
                    'ACCOUNTS': accountsSheet,
                    'CALENDAR': calendarSheet
                }
            })),
            utils: {
                sheet_to_json: mock.fn((sheet) => {
                    if (sheet.name === 'ACCOUNTS') {
                        // Return enough active agents to avoid that warning
                        return Array(MIN_ACTIVE_AGENTS).fill({ status: 'active' });
                    }
                    if (sheet.name === 'CALENDAR') {
                        return [
                            { content_text: 'Short', status: 'approved' }, // Length 5 < MIN_POST_LENGTH -> Warning
                            { content_text: 'A very long post content that is definitely acceptable.', status: 'approved' } // Length > MIN_POST_LENGTH -> No warning
                        ];
                    }
                    return [];
                })
            }
        };

        // Run audit
        auditSwarm({ fs: fsMock, xlsx: xlsxMock });

        // Verify fs.appendFileSync was called with the report
        assert.strictEqual(fsMock.appendFileSync.mock.callCount(), 1);
        const logEntry = fsMock.appendFileSync.mock.calls[0].arguments[1];

        assert.match(logEntry, /📉 QUALITY: 1 posts are too short/);
        // Should not have efficiency warning
        assert.doesNotMatch(logEntry, /⚖️ EFFICIENCY/);
    });

    it('should identify underpowered swarm', () => {
        const fsMock = {
            existsSync: mock.fn(() => true),
            mkdirSync: mock.fn(),
            appendFileSync: mock.fn(),
        };

        const accountsSheet = { name: 'ACCOUNTS' };
        const calendarSheet = { name: 'CALENDAR' };

        const xlsxMock = {
            readFile: mock.fn(() => ({
                Sheets: {
                    'ACCOUNTS': accountsSheet,
                    'CALENDAR': calendarSheet
                }
            })),
            utils: {
                sheet_to_json: mock.fn((sheet) => {
                    if (sheet.name === 'ACCOUNTS') {
                        // Only 1 active -> Warning
                        return [{ status: 'active' }];
                    }
                    if (sheet.name === 'CALENDAR') {
                        return [];
                    }
                    return [];
                })
            }
        };

        auditSwarm({ fs: fsMock, xlsx: xlsxMock });

        assert.strictEqual(fsMock.appendFileSync.mock.callCount(), 1);
        const logEntry = fsMock.appendFileSync.mock.calls[0].arguments[1];

        // "1/10 active"
        assert.match(logEntry, new RegExp(`⚖️ EFFICIENCY: Swarm is underpowered \\(1/${TARGET_AGENT_COUNT} active\\)`));
    });

    it('should identify failed posts', () => {
        const fsMock = {
            existsSync: mock.fn(() => true),
            mkdirSync: mock.fn(),
            appendFileSync: mock.fn(),
        };

        const accountsSheet = { name: 'ACCOUNTS' };
        const calendarSheet = { name: 'CALENDAR' };

        const xlsxMock = {
            readFile: mock.fn(() => ({
                Sheets: {
                    'ACCOUNTS': accountsSheet,
                    'CALENDAR': calendarSheet
                }
            })),
            utils: {
                sheet_to_json: mock.fn((sheet) => {
                    if (sheet.name === 'ACCOUNTS') {
                        return Array(MIN_ACTIVE_AGENTS).fill({ status: 'active' });
                    }
                    if (sheet.name === 'CALENDAR') {
                        return [
                            { status: 'failed', content_text: 'Valid length post content here' },
                            { status: 'failed', content_text: 'Another valid length post content' }
                        ];
                    }
                    return [];
                })
            }
        };

        auditSwarm({ fs: fsMock, xlsx: xlsxMock });

        assert.strictEqual(fsMock.appendFileSync.mock.callCount(), 1);
        const logEntry = fsMock.appendFileSync.mock.calls[0].arguments[1];

        assert.match(logEntry, /⚠️ ALERT: 2 posts failed/);
    });

    it('should do nothing if excel file does not exist', () => {
         const fsMock = {
            existsSync: mock.fn(() => false), // File not found
            mkdirSync: mock.fn(),
            appendFileSync: mock.fn(),
        };
        const xlsxMock = {
            readFile: mock.fn(),
        };

        auditSwarm({ fs: fsMock, xlsx: xlsxMock });

        assert.strictEqual(xlsxMock.readFile.mock.callCount(), 0);
        assert.strictEqual(fsMock.appendFileSync.mock.callCount(), 0);
    });

    it('should verify constants values', () => {
        assert.strictEqual(MIN_POST_LENGTH, 20);
        assert.strictEqual(MIN_ACTIVE_AGENTS, 5);
        assert.strictEqual(TARGET_AGENT_COUNT, 10);
    });
});
