const { test, mock } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const xlsx = require('xlsx');
const { DateTime } = require('luxon');
const { loadPendingJobs } = require('../scheduler.js');

test('loadPendingJobs', async (t) => {
    const mockAccountsSheet = { name: 'ACCOUNTS' };
    const mockCalendarSheet = { name: 'CALENDAR' };

    // Cleanup mocks after each test
    t.afterEach(() => {
        mock.reset();
    });

    await t.test('should return empty array if Excel file does not exist', () => {
        mock.method(fs, 'existsSync', () => false);
        // Suppress console.log
        mock.method(console, 'log', () => {});

        const result = loadPendingJobs();
        assert.deepStrictEqual(result, []);
    });

    await t.test('should return pending jobs correctly', () => {
        mock.method(fs, 'existsSync', () => true);
        mock.method(console, 'log', () => {});

        mock.method(xlsx, 'readFile', () => ({
            Sheets: {
                'ACCOUNTS': mockAccountsSheet,
                'CALENDAR': mockCalendarSheet
            }
        }));

        const now = DateTime.fromISO('2023-01-01T12:00:00');
        mock.method(DateTime, 'now', () => now);

        mock.method(xlsx.utils, 'sheet_to_json', (sheet) => {
            if (sheet === mockAccountsSheet) {
                return [{ account_id: 1, username: 'user1', status: 'active', password: 'pwd' }];
            }
            if (sheet === mockCalendarSheet) {
                return [{
                    post_id: 101,
                    account_id: 1,
                    status: 'approved',
                    scheduled_date: '2023-01-01 10:00', // Before now
                    content_text: 'Hello'
                }];
            }
            return [];
        });

        const { pendingJobs } = loadPendingJobs();
        assert.strictEqual(pendingJobs.length, 1);
        assert.strictEqual(pendingJobs[0].post_id, 101);
        assert.strictEqual(pendingJobs[0].account.username, 'user1');
    });

    await t.test('should filter out future jobs', () => {
        mock.method(fs, 'existsSync', () => true);
        mock.method(console, 'log', () => {});

        mock.method(xlsx, 'readFile', () => ({
            Sheets: {
                'ACCOUNTS': mockAccountsSheet,
                'CALENDAR': mockCalendarSheet
            }
        }));

        const now = DateTime.fromISO('2023-01-01T09:00:00'); // Before scheduled time
        mock.method(DateTime, 'now', () => now);

        mock.method(xlsx.utils, 'sheet_to_json', (sheet) => {
            if (sheet === mockAccountsSheet) {
                return [{ account_id: 1, username: 'user1', status: 'active' }];
            }
            if (sheet === mockCalendarSheet) {
                return [{
                    post_id: 101,
                    account_id: 1,
                    status: 'approved',
                    scheduled_date: '2023-01-01 10:00',
                    content_text: 'Hello'
                }];
            }
            return [];
        });

        const { pendingJobs } = loadPendingJobs();
        assert.strictEqual(pendingJobs.length, 0);
    });

    await t.test('should filter out unapproved jobs', () => {
        mock.method(fs, 'existsSync', () => true);
        mock.method(console, 'log', () => {});

        mock.method(xlsx, 'readFile', () => ({
            Sheets: {
                'ACCOUNTS': mockAccountsSheet,
                'CALENDAR': mockCalendarSheet
            }
        }));

        const now = DateTime.fromISO('2023-01-01T12:00:00');
        mock.method(DateTime, 'now', () => now);

        mock.method(xlsx.utils, 'sheet_to_json', (sheet) => {
            if (sheet === mockAccountsSheet) {
                return [{ account_id: 1, username: 'user1', status: 'active' }];
            }
            if (sheet === mockCalendarSheet) {
                return [{
                    post_id: 101,
                    account_id: 1,
                    status: 'draft', // Not approved
                    scheduled_date: '2023-01-01 10:00',
                    content_text: 'Hello'
                }];
            }
            return [];
        });

        const { pendingJobs } = loadPendingJobs();
        assert.strictEqual(pendingJobs.length, 0);
    });

    await t.test('should filter out jobs for inactive accounts', () => {
        mock.method(fs, 'existsSync', () => true);
        mock.method(console, 'log', () => {});

        mock.method(xlsx, 'readFile', () => ({
            Sheets: {
                'ACCOUNTS': mockAccountsSheet,
                'CALENDAR': mockCalendarSheet
            }
        }));

        const now = DateTime.fromISO('2023-01-01T12:00:00');
        mock.method(DateTime, 'now', () => now);

        mock.method(xlsx.utils, 'sheet_to_json', (sheet) => {
            if (sheet === mockAccountsSheet) {
                return [{ account_id: 1, username: 'user1', status: 'inactive' }]; // Inactive
            }
            if (sheet === mockCalendarSheet) {
                return [{
                    post_id: 101,
                    account_id: 1,
                    status: 'approved',
                    scheduled_date: '2023-01-01 10:00',
                    content_text: 'Hello'
                }];
            }
            return [];
        });

        const { pendingJobs } = loadPendingJobs();
        assert.strictEqual(pendingJobs.length, 0);
    });
});
