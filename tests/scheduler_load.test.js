const { test } = require('node:test');
const assert = require('node:assert');
const { DateTime } = require('luxon');
const { loadPendingJobs } = require('../scheduler.js');

test('loadPendingJobs returns empty array if Excel file not found', () => {
    const mockFs = {
        existsSync: () => false
    };

    const mockXlsx = {
        readFile: () => { throw new Error('Should not be called'); }
    };

    const result = loadPendingJobs({ fs: mockFs, xlsx: mockXlsx });
    assert.deepStrictEqual(result, []);
});

test('loadPendingJobs filters correctly based on status, schedule, and account', () => {
    const mockFs = {
        existsSync: () => true
    };

    const mockNow = DateTime.now();
    const pastDateStr = mockNow.minus({ days: 1 }).toFormat('yyyy-MM-dd HH:mm');
    const futureDateStr = mockNow.plus({ days: 1 }).toFormat('yyyy-MM-dd HH:mm');

    const accountsData = [
        { account_id: 'acc1', status: 'active', username: 'user1' },
        { account_id: 'acc2', status: 'inactive', username: 'user2' },
        { account_id: 'acc3', status: 'active', username: 'user3' }
    ];

    const calendarData = [
        // Valid job
        { post_id: 'post1', account_id: 'acc1', status: 'approved', scheduled_date: pastDateStr },
        // Invalid: future date
        { post_id: 'post2', account_id: 'acc1', status: 'approved', scheduled_date: futureDateStr },
        // Invalid: status not approved
        { post_id: 'post3', account_id: 'acc1', status: 'pending', scheduled_date: pastDateStr },
        // Invalid: account inactive
        { post_id: 'post4', account_id: 'acc2', status: 'approved', scheduled_date: pastDateStr },
        // Invalid: account does not exist
        { post_id: 'post5', account_id: 'acc4', status: 'approved', scheduled_date: pastDateStr },
        // Valid job 2
        { post_id: 'post6', account_id: 'acc3', status: 'approved', scheduled_date: pastDateStr }
    ];

    const mockXlsx = {
        readFile: () => ({
            Sheets: {
                'ACCOUNTS': 'mock_accounts_sheet',
                'CALENDAR': 'mock_calendar_sheet'
            }
        }),
        utils: {
            sheet_to_json: (sheet) => {
                if (sheet === 'mock_accounts_sheet') return accountsData;
                if (sheet === 'mock_calendar_sheet') return calendarData;
                return [];
            }
        }
    };

    const result = loadPendingJobs({ fs: mockFs, xlsx: mockXlsx });

    assert.ok(result.workbook);
    assert.ok(Array.isArray(result.pendingJobs));
    assert.strictEqual(result.pendingJobs.length, 2);

    // Check first valid job
    assert.strictEqual(result.pendingJobs[0].post_id, 'post1');
    assert.deepStrictEqual(result.pendingJobs[0].account, accountsData[0]);

    // Check second valid job
    assert.strictEqual(result.pendingJobs[1].post_id, 'post6');
    assert.deepStrictEqual(result.pendingJobs[1].account, accountsData[2]);
});
