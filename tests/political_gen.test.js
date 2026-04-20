const { describe, it } = require('node:test');
const assert = require('node:assert');
const { generatePoliticalBatch } = require('../scripts/political_gen.js');

describe('Political Content Generator', () => {

    it('should not generate posts if excel file is missing', () => {
        let calledReadFile = false;

        const mockFs = {
            existsSync: () => false
        };

        const mockXlsx = {
            readFile: () => {
                calledReadFile = true;
                return {};
            }
        };

        const result = generatePoliticalBatch({
            fileSystem: mockFs,
            spreadsheet: mockXlsx,
            filePath: 'dummy.xlsx'
        });

        assert.strictEqual(calledReadFile, false);
        assert.strictEqual(result, undefined);
    });

    it('should generate 40 political posts and save to excel', () => {
        const mockWorkbook = {
            Sheets: {
                'CALENDAR': {}
            }
        };

        let writtenWorkbook = null;
        let writtenPath = null;

        const mockFs = {
            existsSync: () => true
        };

        const mockXlsx = {
            readFile: () => mockWorkbook,
            utils: {
                sheet_to_json: () => [], // Start with empty calendar
                json_to_sheet: (data) => ({ data }) // Dummy sheet
            },
            writeFile: (wb, path) => {
                writtenWorkbook = wb;
                writtenPath = path;
            }
        };

        const result = generatePoliticalBatch({
            fileSystem: mockFs,
            spreadsheet: mockXlsx,
            filePath: 'dummy.xlsx'
        });

        // Assert 40 posts generated
        assert.strictEqual(result.length, 40);

        // Assert first post structure
        const firstPost = result[0];
        assert.ok(firstPost.post_id.startsWith('pol_batch_'));
        assert.strictEqual(firstPost.account_id, 'acc_revistavoces');
        assert.strictEqual(firstPost.status, 'approved');
        assert.strictEqual(firstPost.line_id, 'politics_burst');
        assert.ok(firstPost.content_text.length > 0);

        // Assert file was written
        assert.strictEqual(writtenPath, 'dummy.xlsx');
        assert.ok(writtenWorkbook);
        assert.ok(writtenWorkbook.Sheets['CALENDAR']);
    });
});
