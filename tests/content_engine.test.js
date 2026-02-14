const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Import the function under test
// Since the script uses require.main === module, we can require it safely
const { runContentEngine } = require('../scripts/content_engine.js');

const TEMP_EXCEL_PATH = path.join(__dirname, 'temp_test_creds.xlsx');

test('Content Engine respects auto_approve flag', async (t) => {
    // 1. Setup: Create a temporary Excel file with mocked data
    const accountsData = [
        {
            account_id: 'acc_auto',
            status: 'active',
            persona_type: 'tech_visionary',
            core_topics: 'AI',
            auto_approve: true // This should trigger auto-approval
        },
        {
            account_id: 'acc_manual',
            status: 'active',
            persona_type: 'shitposter',
            core_topics: 'memes',
            auto_approve: false // This should trigger draft
        },
        {
            account_id: 'acc_default',
            status: 'active',
            persona_type: 'general',
            core_topics: 'general' // Missing auto_approve, should default to draft
        },
        {
            account_id: 'acc_string_true',
            status: 'active',
            persona_type: 'general',
            core_topics: 'general',
            auto_approve: 'true' // String "true" should trigger auto-approval
        }
    ];

    const calendarData = []; // Start empty

    const workbook = xlsx.utils.book_new();
    const accountsSheet = xlsx.utils.json_to_sheet(accountsData);
    const calendarSheet = xlsx.utils.json_to_sheet(calendarData);

    xlsx.utils.book_append_sheet(workbook, accountsSheet, 'ACCOUNTS');
    xlsx.utils.book_append_sheet(workbook, calendarSheet, 'CALENDAR');

    xlsx.writeFile(workbook, TEMP_EXCEL_PATH);

    // 2. Execute: Run the content engine with the temp file
    await runContentEngine(TEMP_EXCEL_PATH);

    // 3. Verify: Read the file back and check the statuses
    const updatedWorkbook = xlsx.readFile(TEMP_EXCEL_PATH);
    const updatedCalendar = xlsx.utils.sheet_to_json(updatedWorkbook.Sheets['CALENDAR']);

    assert.strictEqual(updatedCalendar.length, 4, 'Should have generated 4 posts');

    const postAuto = updatedCalendar.find(p => p.account_id === 'acc_auto');
    assert.strictEqual(postAuto.status, 'approved', 'acc_auto should be approved');

    const postManual = updatedCalendar.find(p => p.account_id === 'acc_manual');
    assert.strictEqual(postManual.status, 'draft', 'acc_manual should be draft');

    const postDefault = updatedCalendar.find(p => p.account_id === 'acc_default');
    assert.strictEqual(postDefault.status, 'draft', 'acc_default should be draft');

    const postStringTrue = updatedCalendar.find(p => p.account_id === 'acc_string_true');
    assert.strictEqual(postStringTrue.status, 'approved', 'acc_string_true should be approved');

    // 4. Cleanup
    if (fs.existsSync(TEMP_EXCEL_PATH)) {
        fs.unlinkSync(TEMP_EXCEL_PATH);
    }
});
