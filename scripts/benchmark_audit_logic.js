
const { performance } = require('perf_hooks');

// Generate Mock Data
console.log('Generating mock data...');
const calendar = [];
const DATA_SIZE = 1000000;

for (let i = 0; i < DATA_SIZE; i++) {
    calendar.push({
        status: Math.random() < 0.1 ? 'failed' : 'posted',
        content_text: Math.random() < 0.1 ? 'short' : 'This is a sufficiently long content text for the post to pass quality check.'
    });
}
console.log(`Generated ${DATA_SIZE} records.`);

// Baseline: 2 Filters
function runBaseline(data) {
    const start = performance.now();

    // 1. Check for Compromised Agents (Inactive or Failed)
    const failedPosts = data.filter(p => p.status === 'failed');
    let failedCount = failedPosts.length;

    // 2. Check for Quality Control (Quality Assurance)
    const weakPosts = data.filter(p => p.content_text && p.content_text.length < 20);
    let weakCount = weakPosts.length;

    const end = performance.now();
    return { time: end - start, failedCount, weakCount };
}

// Optimized: Single Loop
function runOptimized(data) {
    const start = performance.now();

    let failedCount = 0;
    let weakCount = 0;

    for (const p of data) {
        if (p.status === 'failed') {
            failedCount++;
        }
        if (p.content_text && p.content_text.length < 20) {
            weakCount++;
        }
    }

    const end = performance.now();
    return { time: end - start, failedCount, weakCount };
}

// Warmup
console.log('Warming up...');
runBaseline(calendar.slice(0, 1000));
runOptimized(calendar.slice(0, 1000));

// Run Benchmark
console.log('Running benchmark...');

// Run multiple times to average
const ITERATIONS = 10;
let totalBaselineTime = 0;
let totalOptimizedTime = 0;

for (let i = 0; i < ITERATIONS; i++) {
    const baselineResult = runBaseline(calendar);
    const optimizedResult = runOptimized(calendar);

    totalBaselineTime += baselineResult.time;
    totalOptimizedTime += optimizedResult.time;

    // Verify correctness on first iteration
    if (i === 0) {
        if (baselineResult.failedCount !== optimizedResult.failedCount ||
            baselineResult.weakCount !== optimizedResult.weakCount) {
            console.error('MISMATCH DETECTED!');
            console.error('Baseline:', baselineResult);
            console.error('Optimized:', optimizedResult);
            process.exit(1);
        }
    }
}

const avgBaseline = totalBaselineTime / ITERATIONS;
const avgOptimized = totalOptimizedTime / ITERATIONS;

console.log('--------------------------------------------------');
console.log(`Baseline Average Time:  ${avgBaseline.toFixed(4)} ms`);
console.log(`Optimized Average Time: ${avgOptimized.toFixed(4)} ms`);
console.log(`Speedup: ${(avgBaseline / avgOptimized).toFixed(2)}x`);
console.log('--------------------------------------------------');
