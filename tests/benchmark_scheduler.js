const { test } = require('node:test');
const assert = require('node:assert');
const { runScheduler } = require('../scheduler.js');
const { DateTime } = require('luxon');

// Define Test Data outside to ensure stability
const mockAccounts = [
    { account_id: 'acc1', username: 'user1', status: 'active' },
    { account_id: 'acc2', username: 'user2', status: 'active' }
];

const now = DateTime.now();
const past = now.minus({ minutes: 10 }).toFormat('yyyy-MM-dd HH:mm');

const mockPosts = Array.from({ length: 5 }, (_, i) => ({
    post_id: `post_${i}`,
    account_id: 'acc1',
    status: 'approved',
    scheduled_date: past,
    content_text: `Content ${i}`
}));

const mockWorkbook = {
    Sheets: {
        'ACCOUNTS': { name: 'ACCOUNTS' },
        'CALENDAR': { name: 'CALENDAR' }
    }
};

test('Benchmark: Excel Writes Count', async (t) => {
    // 2. Setup Spies and Mocks
    let writeFileCallCount = 0;

    const mockXlsx = {
        readFile: () => mockWorkbook,
        utils: {
            sheet_to_json: (sheet) => {
                if (sheet.name === 'ACCOUNTS') return JSON.parse(JSON.stringify(mockAccounts));
                if (sheet.name === 'CALENDAR') return JSON.parse(JSON.stringify(mockPosts));
                return [];
            },
            json_to_sheet: (data) => ({ name: 'CALENDAR' }), // Simplified
        },
        writeFile: (wb, path) => {
            writeFileCallCount++;
        }
    };

    const mockFs = {
        existsSync: () => true
    };

    const mockProcessJobFn = async (job) => {
        // console.log(`Processing job ${job.post_id}`);
        return { success: true };
    };

    // 3. Run Scheduler
    // We pass dependencies. mockProcessJobFn replaces the puppeteer-heavy processJob.
    await runScheduler({
        fsLib: mockFs,
        xlsxLib: mockXlsx,
        puppeteerLib: {}, // Not used
        processJobFn: mockProcessJobFn
    });

    // 4. Report Results
    console.log(`\n📊 Benchmark Result: xlsx.writeFile was called ${writeFileCallCount} times for ${mockPosts.length} jobs.`);

    // 5. Assertions (Optimized Expectation)
    // The optimization should reduce writes to 1 (batch update).
    assert.strictEqual(writeFileCallCount, 1, `Expected 1 write (batch update), but got ${writeFileCallCount}`);
});
