const { performance } = require('perf_hooks');

// Mock data generation
function generateMockData(numAccounts, numPosts) {
    const accounts = [];
    for (let i = 0; i < numAccounts; i++) {
        accounts.push({
            account_id: `acc_${i}`,
            username: `user_${i}`,
            status: 'active',
            persona_type: i % 2 === 0 ? 'coffee_snob' : 'crypto_degen',
            core_topics: 'Coffee,Tech,Crypto'
        });
    }

    const posts = [];
    for (let i = 0; i < numPosts; i++) {
        posts.push({
            post_id: `post_${i}`,
            account_id: `acc_${Math.floor(Math.random() * numAccounts)}`,
            status: 'published'
        });
    }

    return { accounts, posts };
}

// The current (unoptimized) logic
function simulateInteractionSync(actor, targetPost) {
    return Math.random() > 0.5 ? 'LIKE' : 'SKIP';
}

function originalLogicSync(accounts, recentPosts) {
    const interactions = [];
    for (let i = 0; i < recentPosts.length; i++) {
        const post = recentPosts[i];
        const author = accounts.find(a => a.account_id === post.account_id);
        if (!author) continue;

        for (let j = 0; j < accounts.length; j++) {
            const actor = accounts[j];
            if (actor.account_id === author.account_id) continue;
            if (actor.status !== 'active') continue;
            const action = simulateInteractionSync(actor, { topic: author.core_topics ? author.core_topics.split(',')[0] : 'General' });
            if (action !== 'SKIP') {
                interactions.push({ actor_id: actor.account_id, target_post_id: post.post_id, action_type: action });
            }
        }
    }
    return interactions;
}

// Optimization implementation (what we plan to do)
function optimizedLogicSync(accounts, recentPosts) {
    const interactions = [];
    const accountMap = new Map();
    for (let i = 0; i < accounts.length; i++) {
        const a = accounts[i];
        accountMap.set(a.account_id, a);
    }

    for (let i = 0; i < recentPosts.length; i++) {
        const post = recentPosts[i];
        const author = accountMap.get(post.account_id);
        if (!author) continue;

        for (let j = 0; j < accounts.length; j++) {
            const actor = accounts[j];
            if (actor.account_id === author.account_id) continue;
            if (actor.status !== 'active') continue;
            const action = simulateInteractionSync(actor, { topic: author.core_topics ? author.core_topics.split(',')[0] : 'General' });
            if (action !== 'SKIP') {
                interactions.push({ actor_id: actor.account_id, target_post_id: post.post_id, action_type: action });
            }
        }
    }

    return interactions;
}

async function runBenchmark() {
    const numAccounts = 5000;
    const numPosts = 1000;
    console.log(`Benchmarking with ${numAccounts} accounts and ${numPosts} posts (Synchronous)...`);

    const { accounts, posts } = generateMockData(numAccounts, numPosts);

    // Warm up
    originalLogicSync(accounts.slice(0, 100), posts.slice(0, 10));
    optimizedLogicSync(accounts.slice(0, 100), posts.slice(0, 10));

    // Baseline
    const start1 = performance.now();
    originalLogicSync(accounts, posts);
    const end1 = performance.now();
    const duration1 = end1 - start1;
    console.log(`Original logic: ${duration1.toFixed(2)}ms`);

    // Optimized
    const start2 = performance.now();
    optimizedLogicSync(accounts, posts);
    const end2 = performance.now();
    const duration2 = end2 - start2;
    console.log(`Optimized logic: ${duration2.toFixed(2)}ms`);

    const improvement = ((duration1 - duration2) / duration1 * 100).toFixed(2);
    console.log(`Improvement: ${improvement}%`);
}

runBenchmark();
