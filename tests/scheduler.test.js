const { test } = require('node:test');
const assert = require('node:assert');
const { loadPendingJobs } = require('../scheduler.js');

test('loadPendingJobs returns empty array when Excel file is missing', () => {
    // Use a non-existent file path
    const result = loadPendingJobs('non_existent_file.xlsx');

    // Assert that the result is an empty array
    assert.deepStrictEqual(result, [], 'Expected loadPendingJobs to return [] when file is missing');
});
