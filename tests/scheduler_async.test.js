const { test } = require('node:test');
const assert = require('node:assert');
const { updateJobStatus } = require('../scheduler.js');
const xlsx = require('xlsx');

test('updateJobStatus retries on EBUSY and uses non-blocking sleep', async () => {
    let writeAttempts = 0;
    let sleepCalled = 0;

    const mockWorkbook = {
        Sheets: {
            'CALENDAR': xlsx.utils.json_to_sheet([{ post_id: 'test_1', status: 'approved' }])
        }
    };

    const mockDeps = {
        xlsx: {
            writeFile: () => {
                writeAttempts++;
                if (writeAttempts < 3) {
                    const err = new Error('File busy');
                    err.code = 'EBUSY';
                    throw err;
                }
                // Success on 3rd attempt
            }
        },
        sleep: async (ms) => {
            sleepCalled++;
            assert.strictEqual(ms, 1000);
            return Promise.resolve();
        }
    };

    await updateJobStatus(mockWorkbook, 'test_1', 'published', '', mockDeps);

    assert.strictEqual(writeAttempts, 3, 'Should have attempted to write 3 times');
    assert.strictEqual(sleepCalled, 2, 'Should have slept 2 times before success');

    const data = xlsx.utils.sheet_to_json(mockWorkbook.Sheets['CALENDAR']);
    assert.strictEqual(data[0].status, 'published', 'Status should be updated');
});

test('updateJobStatus throws on non-EBUSY error', async () => {
    const mockWorkbook = {
        Sheets: {
            'CALENDAR': xlsx.utils.json_to_sheet([{ post_id: 'test_1', status: 'approved' }])
        }
    };

    const mockDeps = {
        xlsx: {
            writeFile: () => {
                const err = new Error('Generic error');
                err.code = 'UNKNOWN';
                throw err;
            }
        },
        sleep: async () => {}
    };

    await assert.rejects(
        updateJobStatus(mockWorkbook, 'test_1', 'published', '', mockDeps),
        /Generic error/
    );
});
