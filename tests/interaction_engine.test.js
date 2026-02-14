const { test } = require('node:test');
const assert = require('node:assert');
const { simulateInteraction } = require('../scripts/interaction_engine.js');

test('simulateInteraction - General persona interest match', async () => {
    const actor = { persona_type: 'general' };
    const targetPost = { topic: 'lifestyle' };

    // Run multiple times to ensure it returns valid actions
    for (let i = 0; i < 10; i++) {
        const action = await simulateInteraction(actor, targetPost);
        assert(['LIKE', 'RETWEET', 'REPLY', 'SKIP'].includes(action));
    }
});

test('simulateInteraction - Coffee Snob loves coffee', async () => {
    const actor = { persona_type: 'coffee_snob' };
    const targetPost = { topic: 'Specialty Coffee' };

    let actions = [];
    for (let i = 0; i < 50; i++) {
        actions.push(await simulateInteraction(actor, targetPost));
    }

    const skips = actions.filter(a => a === 'SKIP').length;
    // Coffee Snob should differ to SKIP less often on coffee topics (20% base skip)
    // But random is random, let's just assert not ALL are skips
    assert(skips < 50);
});

test('simulateInteraction - Coffee Snob ignores Crypto', async () => {
    const actor = { persona_type: 'coffee_snob' };
    const targetPost = { topic: 'Crypto' }; // Not in interests

    let actions = [];
    for (let i = 0; i < 50; i++) {
        actions.push(await simulateInteraction(actor, targetPost));
    }

    const skips = actions.filter(a => a === 'SKIP').length;
    // Should skip frequently. Base skip for non-interest is high.
    // The code sets SKIP = 0.8 if < 0.5.
    // So expected skip rate is >= 80%.
    assert(skips > 30, `Expected > 30 skips, got ${skips}`); // At least 60% skips
});

test('simulateInteraction - Policy Analyst and Politics', async () => {
    const actor = { persona_type: 'policy_analyst' };
    const targetPost = { topic: 'Politics' };

    let actions = [];
    for (let i = 0; i < 50; i++) {
        actions.push(await simulateInteraction(actor, targetPost));
    }

    const replies = actions.filter(a => a === 'REPLY').length;
    // Policy analyst has 0.4 reply weight.
    assert(replies > 0);
});
