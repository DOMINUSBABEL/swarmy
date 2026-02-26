const { generatePostsForAccounts, setGenAI } = require('./content_engine');
const { performance } = require('perf_hooks');

// Mock Gemini Client with delay
const createMockClient = (delayMs) => {
    return {
        getGenerativeModel: () => ({
            generateContent: async () => {
                await new Promise(resolve => setTimeout(resolve, delayMs));
                return {
                    response: Promise.resolve({
                        text: () => "Mocked content"
                    })
                };
            }
        })
    };
};

async function runBenchmark() {
    console.log('🚀 Starting Benchmark...');

    // Setup
    const ACCOUNT_COUNT = 20;
    const API_DELAY = 50; // 50ms per call
    const activeAccounts = Array.from({ length: ACCOUNT_COUNT }, (_, i) => ({
        account_id: `acc_${i}`,
        status: 'active',
        persona_type: 'generic',
        core_topics: 'Tech,AI'
    }));

    setGenAI(createMockClient(API_DELAY));

    // Measure
    const start = performance.now();
    await generatePostsForAccounts(activeAccounts);
    const end = performance.now();

    const duration = end - start;
    console.log(`📊 Benchmark Results:`);
    console.log(`   Accounts: ${ACCOUNT_COUNT}`);
    console.log(`   API Delay: ${API_DELAY}ms`);
    console.log(`   Total Time: ${duration.toFixed(2)}ms`);

    // Theoretical minimum for sequential: ACCOUNT_COUNT * API_DELAY
    // Theoretical minimum for concurrent: API_DELAY (plus overhead)
    console.log(`   Theoretical Sequential Min: ${ACCOUNT_COUNT * API_DELAY}ms`);
    console.log(`   Theoretical Concurrent Min: ~${API_DELAY}ms`);
}

if (require.main === module) {
    runBenchmark();
}
