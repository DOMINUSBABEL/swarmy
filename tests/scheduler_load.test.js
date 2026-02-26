const { test, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { loadPendingJobs } = require('../scheduler.js');

const TEMP_EXCEL = path.join(__dirname, 'test_scheduler.xlsx');

function createTempExcel() {
    const accounts = [{ account_id: 'acc1', status: 'active', username: 'u1' }];
    const posts = [{ post_id: 'p1', account_id: 'acc1', status: 'approved', scheduled_date: '2023-01-01 12:00', content_text: 'hi' }];

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(accounts), 'ACCOUNTS');
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(posts), 'CALENDAR');
    xlsx.writeFile(wb, TEMP_EXCEL);
}

afterEach(() => {
    if (fs.existsSync(TEMP_EXCEL)) {
        fs.unlinkSync(TEMP_EXCEL);
    }
});

test('loadPendingJobs returns correct structure for valid file', async () => {
    createTempExcel();

    const result = loadPendingJobs(TEMP_EXCEL);
    assert.ok(result instanceof Promise, 'Should return a Promise');

    const { workbook, pendingJobs } = await result;
    assert.ok(workbook, 'Workbook should be present');
    assert.ok(Array.isArray(pendingJobs), 'pendingJobs should be an array');

    // Check if it parsed correctly
    // Note: pendingJobs filters for scheduled time <= now. Our date is 2023, so it should be included.
    assert.strictEqual(pendingJobs.length, 1);
    assert.strictEqual(pendingJobs[0].post_id, 'p1');
});

test('loadPendingJobs handles missing file', async () => {
    const missingPath = path.join(__dirname, 'non_existent.xlsx');
    const { workbook, pendingJobs } = await loadPendingJobs(missingPath);

    assert.strictEqual(workbook, null);
    assert.deepStrictEqual(pendingJobs, []);
});
