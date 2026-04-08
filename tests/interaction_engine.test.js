const test = require('node:test');
const assert = require('node:assert');
const { generateInteractions, simulateInteraction } = require('../scripts/interaction_engine.js');

test('simulateInteraction returns valid actions', async () => {
    const actor = { account_id: '1', persona_type: 'crypto_degen' };
    const post = { topic: 'Coffee' };
    const action = await simulateInteraction(actor, post);
    const validActions = ['LIKE', 'RETWEET', 'REPLY', 'SKIP'];
    assert.ok(validActions.includes(action), `Action ${action} is not valid`);
});

test('simulateInteraction handles contextual override', async () => {
    const actor = { account_id: '1', persona_type: 'coffee_snob' };
    const post = { topic: 'Crypto' };
    // This override is probabilistic in the real code, but let's test the logic.
    // Actually the code says:
    // if (actor.persona_type === 'coffee_snob' && targetPost.topic === 'Crypto') { action = 'SKIP'; }
    const action = await simulateInteraction(actor, post);
    assert.strictEqual(action, 'SKIP');
});

test('generateInteractions correctly filters and generates', async () => {
    const accounts = [
        { account_id: '1', username: 'author', status: 'active', core_topics: 'Tech' },
        { account_id: '2', username: 'actor1', status: 'active', persona_type: 'fan' },
        { account_id: '3', username: 'actor2', status: 'inactive', persona_type: 'troll' }
    ];
    const posts = [
        { post_id: 'p1', account_id: '1', status: 'published' }
    ];

    const interactions = await generateInteractions(posts, accounts);

    // actor1 (id 2) should potentially interact
    // actor2 (id 3) is inactive, should not interact
    // author (id 1) should not interact with own post

    const actorIds = interactions.map(i => i.actor_id);
    assert.ok(actorIds.includes('2') || interactions.length === 0, 'Inactive or author should not be in interactions');
    assert.ok(!actorIds.includes('3'), 'Inactive account should not interact');
    assert.ok(!actorIds.includes('1'), 'Author should not interact with own post');
});

test('generateInteractions handles missing authors', async () => {
    const accounts = [
        { account_id: '2', username: 'actor1', status: 'active' }
    ];
    const posts = [
        { post_id: 'p1', account_id: '1', status: 'published' } // Author 1 is missing
    ];

    const interactions = await generateInteractions(posts, accounts);
    assert.strictEqual(interactions.length, 0);
});
