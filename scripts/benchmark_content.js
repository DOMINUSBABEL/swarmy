const { generatePostsForAccounts } = require('./content_engine.js');

async function runBenchmark() {
    const mockAccounts = Array.from({ length: 50 }, (_, i) => ({
        account_id: `acc_${i}`,
        persona_type: 'generic',
        core_topics: 'Tech,Life',
        status: 'active'
    }));

    const mockGenerator = async (persona, topic) => {
        // Simulate 50ms latency
        await new Promise(resolve => setTimeout(resolve, 50));
        return `Generated post for ${topic}`;
    };

    console.log('Running benchmark with 50 accounts...');

    const start = performance.now();
    await generatePostsForAccounts(mockAccounts, mockGenerator);
    const end = performance.now();

    const duration = end - start;
    console.log(`Execution time: ${duration.toFixed(2)}ms`);

    // Expected time for sequential: 50 * 50ms = 2500ms + overhead
    // Expected time for parallel: ~50ms + overhead
}

runBenchmark();
