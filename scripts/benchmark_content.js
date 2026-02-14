const { generatePostsForAccounts } = require('./content_engine');

const NUM_ACCOUNTS = 20;
const DELAY_MS = 50;

// Mock generator with delay
const slowGenerator = async (persona, topic) => {
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    return `Generated content for ${topic}`;
};

// Mock accounts
const mockAccounts = Array.from({ length: NUM_ACCOUNTS }, (_, i) => ({
    account_id: `acc_${i}`,
    persona_type: 'generic',
    core_topics: 'Tech,Life',
    status: 'active'
}));

async function runBenchmark() {
    console.log(`Starting benchmark with ${NUM_ACCOUNTS} accounts and ${DELAY_MS}ms delay per request...`);

    const start = process.hrtime.bigint();

    const posts = await generatePostsForAccounts(mockAccounts, slowGenerator);

    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    console.log(`Generated ${posts.length} posts.`);
    console.log(`Execution time: ${durationMs.toFixed(2)} ms`);

    // Validation
    if (posts.length !== NUM_ACCOUNTS) {
        console.error(`❌ Expected ${NUM_ACCOUNTS} posts, got ${posts.length}`);
        process.exit(1);
    }
}

runBenchmark();
