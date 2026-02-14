const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const scheduler = require('../scheduler.js');

const TEST_EXCEL_PATH = path.join(__dirname, 'test_creds.xlsx');

test('Excel Update preserves formulas', async (t) => {
    // 1. Create a workbook with a CALENDAR sheet containing a formula
    const wb = xlsx.utils.book_new();
    const ws_data = [
        ['post_id', 'status', 'content_text', 'formula_col'],
        ['101', 'pending', 'Hello', { t: 'n', f: '1+1', v: 2 }]
    ];
    // Use aoa_to_sheet to create sheet with formula support
    const ws = xlsx.utils.aoa_to_sheet(ws_data);

    // Add sheet to workbook
    xlsx.utils.book_append_sheet(wb, ws, 'CALENDAR');

    // Write to disk
    xlsx.writeFile(wb, TEST_EXCEL_PATH);

    // Configure scheduler to use this file
    scheduler.setExcelPath(TEST_EXCEL_PATH);

    // Verify initial state
    let readWb = xlsx.readFile(TEST_EXCEL_PATH);
    let readWs = readWb.Sheets['CALENDAR'];
    // D2 should have formula
    assert.strictEqual(readWs['D2'].f, '1+1', 'Initial file should have formula');

    // 2. Perform update using scheduler logic
    // We pass readWb because that's what scheduler uses (loaded in loadPendingJobs)
    scheduler.updateJobStatus(readWb, '101', 'approved');

    // 3. Verify the file after update
    const updatedWb = xlsx.readFile(TEST_EXCEL_PATH);
    const updatedWs = updatedWb.Sheets['CALENDAR'];

    // Check status updated
    // B2 is status
    assert.strictEqual(updatedWs['B2'].v, 'approved', 'Status should be updated');

    // Check formula preserved
    // D2 is formula_col
    if (!updatedWs['D2'] || !updatedWs['D2'].f) {
        console.error('Formula check failed. Cell content:', updatedWs['D2']);
    }
    assert.ok(updatedWs['D2'].f, 'Formula should be present after update');
    assert.strictEqual(updatedWs['D2'].f, '1+1', 'Formula should be unchanged');

    // Cleanup
    if (fs.existsSync(TEST_EXCEL_PATH)) {
        fs.unlinkSync(TEST_EXCEL_PATH);
    }
});
