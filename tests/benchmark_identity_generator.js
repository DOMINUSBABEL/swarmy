const { assignIdentities, PERSONAS } = require('../scripts/identity_generator.js');

// Create a mock for fs and xlsx to simulate processing many accounts
const numAccounts = 100000;
const accounts = Array.from({ length: numAccounts }).map((_, i) => ({
    account_id: `acc${i}`,
    bio: i % 2 === 0 ? 'Existing bio' : null,
}));

const mockDeps = {
    fsLib: {
        existsSync: () => true
    },
    xlsxLib: {
        readFile: () => ({ Sheets: { 'ACCOUNTS': {} } }),
        utils: {
            sheet_to_json: () => accounts,
            json_to_sheet: () => ({})
        },
        writeFile: () => {}
    },
    excelPath: 'dummy.xlsx'
};

// Silence console.log and console.table for benchmarking
const originalLog = console.log;
const originalTable = console.table;
console.log = () => {};
console.table = () => {};

// Warmup
assignIdentities(mockDeps);

// Benchmark
const iterations = 50;
const start = performance.now();

for (let i = 0; i < iterations; i++) {
    assignIdentities(mockDeps);
}

const end = performance.now();
const duration = end - start;
const avgDuration = duration / iterations;

// Restore console
console.log = originalLog;
console.table = originalTable;

console.log(`Processed ${numAccounts} accounts ${iterations} times.`);
console.log(`Total duration: ${duration.toFixed(2)}ms`);
console.log(`Average duration per iteration: ${avgDuration.toFixed(2)}ms`);
