const { describe, it } = require('node:test');
const assert = require('node:assert');
const contentEngine = require('../scripts/content_engine.js');

describe('Content Engine Orchestration', () => {

    it('should exit if Excel file does not exist', async () => {
        const mockFs = {
            existsSync: () => false
        };

        // Capture console.error
        const originalError = console.error;
        let errorLogged = false;
        console.error = (msg) => {
            if (msg && msg.includes('Excel not found')) errorLogged = true;
        };

        try {
            await contentEngine.runContentEngine({ fs: mockFs });
            assert.ok(errorLogged, 'Should have logged an error about missing Excel');
        } finally {
            console.error = originalError;
        }
    });

    it('should generate content and update Excel for active accounts', async () => {
        const mockFs = {
            existsSync: () => true
        };

        // Mock data
        const accounts = [
            { account_id: 'acc1', status: 'active', persona_type: 'shitposter', core_topics: 'Tech' },
            { account_id: 'acc2', status: 'inactive', persona_type: 'visionary', core_topics: 'AI' }
        ];
        // We use a copy here or just a fresh array to ensure clean state
        const calendarData = [];

        // Mock XLSX
        let writtenWorkbook = null;
        let writtenFilename = null;

        const mockWorkbook = {
            Sheets: {
                'ACCOUNTS': { name: 'ACCOUNTS_SHEET' },
                'CALENDAR': { name: 'CALENDAR_SHEET' }
            }
        };

        const mockXlsx = {
            readFile: () => mockWorkbook,
            writeFile: (wb, filename) => {
                writtenWorkbook = wb;
                writtenFilename = filename;
            },
            utils: {
                sheet_to_json: (sheet) => {
                    if (sheet.name === 'ACCOUNTS_SHEET') return [...accounts]; // Return copy to be safe, though code only reads
                    if (sheet.name === 'CALENDAR_SHEET') return calendarData; // Return reference to capture pushes? Or copy and we check what's passed to json_to_sheet?
                    return [];
                },
                json_to_sheet: (data) => {
                    return { dataWrapper: data }; // Dummy sheet object wrapping the data
                }
            }
        };

        // Capture console.log
        const originalLog = console.log;
        console.log = () => {};

        try {
            // Ensure no external API calls
            contentEngine.setGenAI(null);

            await contentEngine.runContentEngine({ fs: mockFs, xlsx: mockXlsx });

            // Assertions
            assert.ok(writtenWorkbook, 'Should have written to workbook');

            // Check if correct filename is used (path ending check)
            assert.ok(writtenFilename.endsWith('Master_Social_Creds.xlsx'), 'Should write to correct file path');

            // Verify content
            // The code does: workbook.Sheets['CALENDAR'] = newSheet;
            // newSheet is result of json_to_sheet(calendar)
            // Our mock json_to_sheet returns { dataWrapper: calendar }

            const newSheet = writtenWorkbook.Sheets['CALENDAR'];
            assert.ok(newSheet, 'Calendar sheet should be updated');

            const newCalendar = newSheet.dataWrapper;
            assert.ok(Array.isArray(newCalendar), 'Should have passed array to json_to_sheet');

            // We expect 1 new post for the 1 active account
            assert.strictEqual(newCalendar.length, 1, 'Should have added 1 post (acc1 is active, acc2 inactive)');

            const post = newCalendar[0];
            assert.strictEqual(post.account_id, 'acc1');
            assert.strictEqual(post.status, 'draft');
            assert.strictEqual(post.line_id, 'auto_gen');
            assert.ok(post.content_text.length > 0, 'Content text should be generated');
            assert.ok(post.post_id.startsWith('gen_'), 'Post ID should start with gen_');
            assert.ok(post.hashtags.includes('#Tech'), 'Hashtags should match topic');

        } finally {
            console.log = originalLog;
        }
    });

});
