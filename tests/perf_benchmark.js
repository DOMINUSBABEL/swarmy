const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');
const { performance } = require('perf_hooks');
const { loadPendingJobs } = require('../scheduler.js');

const TEST_FILE = path.join(__dirname, 'temp_perf_test.xlsx');

// Create a large compatible excel file
function createLargeFile() {
    if (fs.existsSync(TEST_FILE)) return;

    console.log('Generating large Excel file for testing...');

    // Create ACCOUNTS sheet
    const accounts = [];
    for (let i = 0; i < 100; i++) {
        accounts.push({
            account_id: `acc_${i}`,
            username: `user_${i}`,
            status: 'active'
        });
    }
    const accountsSheet = xlsx.utils.json_to_sheet(accounts);

    // Create CALENDAR sheet
    const posts = [];
    const now = new Date();
    for (let i = 0; i < 5000; i++) {
        // Some past, some future
        const date = new Date(now.getTime() - (Math.random() > 0.5 ? 1000000 : -1000000));
        posts.push({
            post_id: `post_${i}`,
            account_id: `acc_${i % 100}`,
            status: 'approved',
            scheduled_date: date.toISOString().slice(0, 16).replace('T', ' '), // yyyy-MM-dd HH:mm
            content_text: `Post content ${i}`
        });
    }
    const calendarSheet = xlsx.utils.json_to_sheet(posts);

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, accountsSheet, 'ACCOUNTS');
    xlsx.utils.book_append_sheet(wb, calendarSheet, 'CALENDAR');
    xlsx.writeFile(wb, TEST_FILE);
    console.log('File generated.');
}

async function runBenchmark() {
    createLargeFile();

    console.log('Running loadPendingJobs Benchmark...');
    const start = performance.now();

    // Check if function is async or sync
    const result = loadPendingJobs(TEST_FILE);
    if (result instanceof Promise) {
        await result;
    }

    const end = performance.now();
    console.log(`Execution Time: ${(end - start).toFixed(2)}ms`);

    // Cleanup
    if (fs.existsSync(TEST_FILE)) {
        fs.unlinkSync(TEST_FILE);
    }
}

runBenchmark();
