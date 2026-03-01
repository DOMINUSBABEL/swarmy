const { test, mock } = require('node:test');
const assert = require('node:assert');
const { runScheduler } = require('../scheduler.js');
const { DateTime } = require('luxon');

test('Optimization Verification: Count Excel Writes', async () => {
    // 1. Mock Data
    const mockPendingJobs = Array.from({ length: 5 }, (_, i) => ({
        post_id: `job_${i}`,
        scheduled_date: '2023-01-01 10:00',
        status: 'approved',
        account_id: 'acc_1',
        content_text: 'Test content',
        account: { username: 'testuser' }
    }));

    const mockAccounts = [{ account_id: 'acc_1', status: 'active', username: 'testuser' }];

    // We need separate sheets for accounts and calendar
    // We use a getter/setter approach or just a simple object
    // But since the code replaces the sheet property, we need to handle that in the mock if we want to track state.
    // For counting writes, it doesn't matter if the intermediate state is lost in the mock.
    const mockWorkbook = {
        Sheets: {
            'ACCOUNTS': { name: 'ACCOUNTS' },
            'CALENDAR': { name: 'CALENDAR' }
        }
    };

    // 2. Mock xlsx
    const mockXlsx = {
        readFile: mock.fn(() => mockWorkbook),
        writeFile: mock.fn(),
        utils: {
            sheet_to_json: mock.fn((sheet) => {
                // Return data if it matches our initial mock sheet
                // In a real scenario, this would parse the replaced sheet.
                // For this test, we accept that subsequent updates might fail in the mock
                // because we replace the sheet with {}, but we only care about the WRITE count
                // which happens at the end.
                if (sheet === mockWorkbook.Sheets['ACCOUNTS']) {
                    return mockAccounts;
                }
                // We loosen the check slightly or just return mockPendingJobs for any unknown sheet to keep the loop going?
                // No, better to be strict.
                // But initially it matches CALENDAR.
                if (sheet && sheet.name === 'CALENDAR') {
                    return [...mockPendingJobs];
                }
                return [...mockPendingJobs]; // Fallback to ensure jobs are processed even if sheet ref changes
            }),
            json_to_sheet: mock.fn(() => ({ name: 'CALENDAR_UPDATED' }))
        }
    };

    // 3. Mock fs
    const mockFs = {
        existsSync: mock.fn(() => true)
    };

    // 4. Mock processJobFn (Simulate success instantly)
    const mockProcessJobFn = mock.fn(async (job) => {
        return { success: true };
    });

    // 5. Run Scheduler
    await runScheduler({
        xlsxLib: mockXlsx,
        fsLib: mockFs,
        processJobFn: mockProcessJobFn,
        puppeteerLib: {}
    });

    // 6. Measure
    const writeCount = mockXlsx.writeFile.mock.calls.length;
    console.log(`[Benchmark] xlsx.writeFile called ${writeCount} times.`);

    // 7. Assert Optimization (Should be 1)
    assert.strictEqual(writeCount, 1, `Optimization check failed: Expected 1 write, got ${writeCount}`);
});
