const test = require('node:test');
const assert = require('node:assert');
const { auditSwarm, MIN_POST_LENGTH, MIN_ACTIVE_AGENTS, TARGET_AGENT_COUNT } = require('../scripts/fouche_audit');

test('fouche_audit.js Tests', async (t) => {

    await t.test('Execution aborts when EXCEL_PATH does not exist', () => {
        let loggedMessages = [];
        const mockFs = {
            existsSync: (path) => false,
        };
        const mockXlsx = {
            readFile: () => { throw new Error('readFile should not be called'); }
        };
        const originalConsoleLog = console.log;
        console.log = (msg) => loggedMessages.push(msg);

        try {
            auditSwarm({ fs: mockFs, xlsx: mockXlsx });
            assert.strictEqual(loggedMessages.length, 0, 'No logs should be produced if file does not exist');
        } finally {
            console.log = originalConsoleLog;
        }
    });

    await t.test('Correctly reports an optimal state when no issues are found', () => {
        let loggedMessages = [];
        const mockFs = {
            existsSync: (path) => true,
            mkdirSync: (path) => {},
            appendFileSync: (path, data) => {}
        };
        const mockWorkbook = {
            Sheets: {
                'ACCOUNTS': {},
                'CALENDAR': {}
            }
        };
        const mockXlsx = {
            readFile: (path) => mockWorkbook,
            utils: {
                sheet_to_json: (sheet) => {
                    if (sheet === mockWorkbook.Sheets['ACCOUNTS']) {
                        return [
                            { status: 'active' }, { status: 'active' }, { status: 'active' },
                            { status: 'active' }, { status: 'active' }, { status: 'active' } // 6 active agents > MIN_ACTIVE_AGENTS
                        ];
                    }
                    if (sheet === mockWorkbook.Sheets['CALENDAR']) {
                        return [
                            { status: 'success', content_text: 'This is a sufficiently long post.' },
                            { status: 'success', content_text: 'Another long post that passes length check.' }
                        ];
                    }
                    return [];
                }
            }
        };

        const originalConsoleLog = console.log;
        console.log = (msg) => loggedMessages.push(msg);

        try {
            auditSwarm({ fs: mockFs, xlsx: mockXlsx });
            assert.ok(loggedMessages.some(msg => msg.includes("✅ FOUCHÉ: The State is secure. Operations are optimal.")), "Should log optimal state");
        } finally {
            console.log = originalConsoleLog;
        }
    });

    await t.test('Correctly detects failed posts, weak posts, and an underpowered swarm', () => {
        let loggedMessages = [];
        let appendedLogData = "";
        const mockFs = {
            existsSync: (path) => true,
            mkdirSync: (path) => {},
            appendFileSync: (path, data) => { appendedLogData += data; }
        };
        const mockWorkbook = {
            Sheets: {
                'ACCOUNTS': {},
                'CALENDAR': {}
            }
        };
        const mockXlsx = {
            readFile: (path) => mockWorkbook,
            utils: {
                sheet_to_json: (sheet) => {
                    if (sheet === mockWorkbook.Sheets['ACCOUNTS']) {
                        return [
                            { status: 'active' }, { status: 'active' }, { status: 'inactive' } // 2 active agents < MIN_ACTIVE_AGENTS
                        ];
                    }
                    if (sheet === mockWorkbook.Sheets['CALENDAR']) {
                        return [
                            { status: 'failed', content_text: 'Post failed.' }, // Failed post
                            { status: 'success', content_text: 'Too short' } // Weak post (< 20 chars)
                        ];
                    }
                    return [];
                }
            }
        };

        const originalConsoleLog = console.log;
        console.log = (msg) => loggedMessages.push(msg);

        try {
            auditSwarm({ fs: mockFs, xlsx: mockXlsx });

            // Check console logs
            const allLogs = loggedMessages.join('\n');
            assert.ok(allLogs.includes("⚠️ ALERT: 1 posts failed."), "Should log failed post alert");
            assert.ok(allLogs.includes("📉 QUALITY: 2 posts are too short"), "Should log weak post alert");
            assert.ok(allLogs.includes(`⚖️ EFFICIENCY: Swarm is underpowered (2/${TARGET_AGENT_COUNT} active)`), "Should log underpowered swarm alert");

            // Check appendFileSync
            assert.ok(appendedLogData.includes("⚠️ ALERT: 1 posts failed."), "Should append failed post alert to file");
            assert.ok(appendedLogData.includes("📉 QUALITY: 2 posts are too short"), "Should append weak post alert to file");
            assert.ok(appendedLogData.includes(`⚖️ EFFICIENCY: Swarm is underpowered (2/${TARGET_AGENT_COUNT} active)`), "Should append underpowered swarm alert to file");

        } finally {
            console.log = originalConsoleLog;
        }
    });
});
