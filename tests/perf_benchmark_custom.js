const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');
const { performance } = require('perf_hooks');

const TEST_FILE = path.join(__dirname, 'temp_perf_test.xlsx');

// Create a large excel file
function createLargeFile() {
    if (fs.existsSync(TEST_FILE)) return;

    console.log('Generating large Excel file for testing...');
    const rows = [];
    for (let i = 0; i < 10000; i++) {
        rows.push({
            id: i,
            name: `User ${i}`,
            email: `user${i}@example.com`,
            data: Math.random().toString(36).substring(7).repeat(10)
        });
    }
    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
    xlsx.writeFile(wb, TEST_FILE);
    console.log('File generated.');
}

function benchmarkSync() {
    const start = performance.now();
    const workbook = xlsx.readFile(TEST_FILE);
    const end = performance.now();
    return end - start;
}

async function benchmarkAsync() {
    const start = performance.now();
    const buffer = await fs.promises.readFile(TEST_FILE);
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const end = performance.now();
    return end - start;
}

async function run() {
    createLargeFile();

    console.log('Running Sync Benchmark...');
    const syncTime = benchmarkSync();
    console.log(`Sync Time: ${syncTime.toFixed(2)}ms`);

    console.log('Running Async (I/O) Benchmark...');
    const asyncTime = await benchmarkAsync();
    console.log(`Async Time: ${asyncTime.toFixed(2)}ms`); // Note: This includes the sync parsing time, but I/O is async

    // Cleanup
    if (fs.existsSync(TEST_FILE)) {
        fs.unlinkSync(TEST_FILE);
    }
}

run();
