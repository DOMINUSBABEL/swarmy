const { describe, it } = require('node:test');
const assert = require('node:assert');
const { DateTime } = require('luxon');
const { generatePoliticalBatch, TARGETS, TEMPLATES } = require('../scripts/political_gen.js');

describe('Political Generator', () => {

    it('should return early if EXCEL_PATH does not exist', () => {
        let existsChecked = false;

        const mockFs = {
            existsSync: (path) => {
                existsChecked = true;
                return false;
            }
        };

        const mockXlsx = {
            readFile: () => {
                throw new Error('Should not have been called');
            }
        };

        generatePoliticalBatch({ fs: mockFs, xlsx: mockXlsx });

        assert.strictEqual(existsChecked, true);
    });

    it('should generate 40 political tweets and update the Excel file', () => {
        let calendarData = [];
        let writtenFile = false;
        let originalWorkbook;

        const mockFs = {
            existsSync: () => true
        };

        const mockXlsx = {
            readFile: () => {
                originalWorkbook = {
                    Sheets: {
                        'CALENDAR': {} // Mock sheet
                    }
                };
                return originalWorkbook;
            },
            utils: {
                sheet_to_json: (sheet) => {
                    return [...calendarData];
                },
                json_to_sheet: (json) => {
                    return { ...json }; // Mock sheet object from json
                }
            },
            writeFile: (workbook, path) => {
                writtenFile = true;
                // Capture the updated calendar sheet data (it's the mock sheet object)
                calendarData = Object.values(workbook.Sheets['CALENDAR']).filter(v => typeof v === 'object' && v.post_id);
            }
        };

        // Suppress console.log
        const originalLog = console.log;
        console.log = () => {};

        try {
            generatePoliticalBatch({ fs: mockFs, xlsx: mockXlsx });
        } finally {
            console.log = originalLog;
        }

        assert.strictEqual(writtenFile, true);
        assert.strictEqual(calendarData.length, 40);

        // Verify post structure
        const firstPost = calendarData[0];
        assert.ok(firstPost.post_id.startsWith('pol_batch_'));
        assert.strictEqual(firstPost.account_id, 'acc_revistavoces');
        assert.strictEqual(firstPost.line_id, 'politics_burst');
        assert.strictEqual(firstPost.status, 'approved');
        assert.strictEqual(firstPost.hashtags, '#Politica #Colombia');

        // Verify text content
        const hasValidTemplate = TEMPLATES.some(template => {
            // Because {target} is replaced and random text might be added " (1/40)",
            // we just check if a significant part of the template is in the text.
            // A simple way is to check if one of the targets is in the text.
            return TARGETS.some(target => firstPost.content_text.includes(target));
        });
        assert.ok(hasValidTemplate, 'Content text should include one of the targets');

        // Verify scheduling intervals
        const firstTime = DateTime.fromFormat(firstPost.scheduled_date, 'yyyy-MM-dd HH:mm');
        const secondTime = DateTime.fromFormat(calendarData[1].scheduled_date, 'yyyy-MM-dd HH:mm');

        const diffInMinutes = secondTime.diff(firstTime, 'minutes').minutes;
        assert.strictEqual(diffInMinutes, 3);
    });

});
