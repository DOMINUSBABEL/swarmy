const { test } = require('node:test');
const assert = require('node:assert');
const { assignIdentities, PERSONAS } = require('../scripts/identity_generator.js');

test('assignIdentities assigns personas to new accounts', async () => {
    // Mock Data
    const mockAccounts = [
        { account_id: 'acc1', username: 'user1' },
        { account_id: 'acc2', username: 'user2' }
    ];

    // Mock Dependencies
    const fsLib = {
        existsSync: () => true
    };

    let writtenWorkbook = null;
    const xlsxLib = {
        readFile: () => ({
            Sheets: { 'ACCOUNTS': {} }
        }),
        utils: {
            sheet_to_json: () => mockAccounts,
            json_to_sheet: (data) => data // Pass through for verification
        },
        writeFile: (wb, path) => {
            writtenWorkbook = wb;
        }
    };

    // Run
    assignIdentities({ fsLib, xlsxLib, excelPath: 'dummy.xlsx' });

    // Assertions
    assert.ok(writtenWorkbook, 'Workbook should be written');

    const updatedSheet = writtenWorkbook.Sheets['ACCOUNTS'];
    assert.strictEqual(updatedSheet.length, 2);

    const acc1 = updatedSheet[0];
    assert.ok(acc1.persona_type, 'Persona type should be assigned');
    assert.ok(acc1.bio, 'Bio should be assigned');
    assert.ok(acc1.core_topics, 'Topics should be assigned');

    // Verify Round Robin
    const types = Object.keys(PERSONAS);
    assert.strictEqual(acc1.persona_type, types[0]);
    assert.strictEqual(updatedSheet[1].persona_type, types[1]);
});

test('assignIdentities preserves existing bios', async () => {
    const mockAccounts = [
        { account_id: 'acc1', bio: 'My custom bio' }
    ];

    const fsLib = { existsSync: () => true };
    let writtenData = null;
    const xlsxLib = {
        readFile: () => ({ Sheets: { 'ACCOUNTS': {} } }),
        utils: {
            sheet_to_json: () => mockAccounts,
            json_to_sheet: (data) => {
                writtenData = data;
                return data;
            }
        },
        writeFile: () => {}
    };

    assignIdentities({ fsLib, xlsxLib, excelPath: 'dummy.xlsx' });

    assert.strictEqual(writtenData[0].bio, 'My custom bio');
    assert.ok(writtenData[0].persona_type, 'Persona should still be assigned even if bio exists');
});

test('assignIdentities handles missing excel file', async () => {
    const fsLib = {
        existsSync: () => false
    };

    let readFileCalled = false;
    const xlsxLib = {
        readFile: () => {
            readFileCalled = true;
            return {};
        }
    };

    // Suppress console.error for this test
    const originalError = console.error;
    console.error = () => {};

    assignIdentities({ fsLib, xlsxLib, excelPath: 'missing.xlsx' });

    console.error = originalError;

    assert.strictEqual(readFileCalled, false, 'Should not attempt to read file if it does not exist');
});
