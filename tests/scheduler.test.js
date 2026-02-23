const { test, describe } = require('node:test');
const assert = require('node:assert');
const { processJob, updateJobStatus } = require('../scheduler.js');

describe('processJob', () => {
    test('handles errors gracefully', async () => {
        // Mock job
        const job = {
            post_id: 'test_job_1',
            account: { username: 'testuser', password: 'password' },
            content_text: 'Hello world'
        };

        // Mock Puppeteer
        const mockPuppeteer = {
            launch: async () => {
                throw new Error('Launch failed');
            }
        };

        // Run processJob with mock
        const result = await processJob(job, mockPuppeteer);

        // Verify result
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Launch failed');
    });
});

describe('updateJobStatus', () => {
    test('successfully updates job status', () => {
        const mockWorkbook = {
            Sheets: {
                'CALENDAR': {}
            }
        };
        // Use mutable objects to verify changes if any, but implementation replaces the sheet object
        // The implementation modifies data array items in place, then creates new sheet

        const mockData = [
            { post_id: '1', status: 'draft' },
            { post_id: '2', status: 'draft' }
        ];

        let writtenWorkbook;
        let writtenPath;

        const mockXlsx = {
            utils: {
                sheet_to_json: () => mockData, // Return reference to mockData
                json_to_sheet: (data) => ({ data }) // Mock sheet object wrapping data
            },
            writeFile: (wb, path) => {
                writtenWorkbook = wb;
                writtenPath = path;
            }
        };

        updateJobStatus(mockWorkbook, '1', 'published', 'No error', { xlsxLib: mockXlsx, filePath: 'test.xlsx' });

        assert.strictEqual(writtenPath, 'test.xlsx');

        // Verify the workbook sheet was updated with new sheet object
        assert.ok(writtenWorkbook.Sheets['CALENDAR'].data);
        const writtenData = writtenWorkbook.Sheets['CALENDAR'].data;

        assert.strictEqual(writtenData[0].post_id, '1');
        assert.strictEqual(writtenData[0].status, 'published');
        assert.strictEqual(writtenData[0].error_log, 'No error');

        assert.strictEqual(writtenData[1].post_id, '2');
        assert.strictEqual(writtenData[1].status, 'draft');
    });

    test('does not write if post not found', () => {
        const mockWorkbook = { Sheets: { 'CALENDAR': {} } };
        const mockData = [{ post_id: '1', status: 'draft' }];

        let writeCalled = false;
        const mockXlsx = {
            utils: {
                sheet_to_json: () => mockData,
                json_to_sheet: () => ({})
            },
            writeFile: () => { writeCalled = true; }
        };

        updateJobStatus(mockWorkbook, '999', 'published', '', { xlsxLib: mockXlsx });

        assert.strictEqual(writeCalled, false);
    });

    test('retries on EBUSY error and eventually succeeds', () => {
        const mockWorkbook = { Sheets: { 'CALENDAR': {} } };
        const mockData = [{ post_id: '1', status: 'draft' }];

        let attempts = 0;
        let sleepCalled = 0;

        const mockXlsx = {
            utils: {
                sheet_to_json: () => mockData,
                json_to_sheet: (d) => ({ data: d })
            },
            writeFile: () => {
                attempts++;
                if (attempts === 1) {
                    const err = new Error('Busy');
                    err.code = 'EBUSY';
                    throw err;
                }
                // Second attempt succeeds
            }
        };

        const mockSleep = (ms) => {
            sleepCalled++;
            assert.strictEqual(ms, 1000);
        };

        updateJobStatus(mockWorkbook, '1', 'published', '', {
            xlsxLib: mockXlsx,
            sleepFn: mockSleep
        });

        assert.strictEqual(attempts, 2);
        assert.strictEqual(sleepCalled, 1);
    });

    test('throws on non-EBUSY error', () => {
        const mockWorkbook = { Sheets: { 'CALENDAR': {} } };
        const mockData = [{ post_id: '1', status: 'draft' }];

        const mockXlsx = {
            utils: {
                sheet_to_json: () => mockData,
                json_to_sheet: () => ({})
            },
            writeFile: () => {
                throw new Error('Disk full');
            }
        };

        assert.throws(() => {
            updateJobStatus(mockWorkbook, '1', 'published', '', { xlsxLib: mockXlsx });
        }, /Disk full/);
    });
});
