const { test, mock } = require('node:test');
const assert = require('node:assert');

// Mock xlsx
const xlsxMock = {
    utils: {
        sheet_to_json: () => [{ post_id: '123', status: 'draft' }],
        json_to_sheet: () => ({})
    },
    writeFile: () => {} // To be overridden
};

// Inject mock
try {
    require.cache[require.resolve('xlsx')] = { exports: xlsxMock };
} catch (e) {
    console.error('Failed to mock xlsx:', e);
}

// Now require scheduler
const scheduler = require('../scheduler.js');

test('updateJobStatus retries on EBUSY using async wait', async (t) => {
    // Spy on setTimeout
    const setTimeoutSpy = mock.method(global, 'setTimeout');

    let attempts = 0;
    xlsxMock.writeFile = () => {
        attempts++;
        if (attempts === 1) {
            const e = new Error('EBUSY');
            e.code = 'EBUSY';
            throw e;
        }
    };

    const workbook = { Sheets: { 'CALENDAR': {} } };

    // Execute
    // Note: updateJobStatus might be sync or async depending on implementation
    // We await it to be safe for future async implementation
    await scheduler.updateJobStatus(workbook, '123', 'published');

    // Verification
    assert.strictEqual(attempts, 2, 'Should have retried once');

    // Check if setTimeout was called
    // In the original sync implementation, it uses busy wait, so setTimeout is NOT called.
    // In the fixed async implementation, it should use setTimeout.
    assert.strictEqual(setTimeoutSpy.mock.callCount(), 1, 'setTimeout should be called for async delay');
});
