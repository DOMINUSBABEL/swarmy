const { test, describe, afterEach, mock } = require('node:test');
const assert = require('node:assert');
const { simulateInteraction } = require('../scripts/interaction_engine.js');

describe('simulateInteraction', () => {

    afterEach(() => {
        mock.reset();
    });

    test('Coffee Snob skips Crypto topics', async () => {
        const actor = { persona_type: 'coffee_snob' };
        const targetPost = { topic: 'Crypto' };

        // Force random to be a LIKE action (0.1)
        // If the override logic works, it should still return SKIP
        mock.method(Math, 'random', () => 0.1);

        const result = await simulateInteraction(actor, targetPost);
        assert.strictEqual(result, 'SKIP');
    });

    test('Returns LIKE when random is within first weight (0.6)', async () => {
        const actor = { persona_type: 'tech_bro' };
        const targetPost = { topic: 'Tech' };

        mock.method(Math, 'random', () => 0.1);
        const result = await simulateInteraction(actor, targetPost);
        assert.strictEqual(result, 'LIKE');

        // Test boundary
        mock.method(Math, 'random', () => 0.6);
        const result2 = await simulateInteraction(actor, targetPost);
        assert.strictEqual(result2, 'LIKE');
    });

    test('Returns RETWEET when random is within second weight (0.1)', async () => {
        const actor = { persona_type: 'tech_bro' };
        const targetPost = { topic: 'Tech' };

        // 0.6 < random <= 0.7
        mock.method(Math, 'random', () => 0.65);
        const result = await simulateInteraction(actor, targetPost);
        assert.strictEqual(result, 'RETWEET');
    });

    test('Returns REPLY when random is within third weight (0.1)', async () => {
        const actor = { persona_type: 'tech_bro' };
        const targetPost = { topic: 'Tech' };

        // 0.7 < random <= 0.8
        mock.method(Math, 'random', () => 0.75);
        const result = await simulateInteraction(actor, targetPost);
        assert.strictEqual(result, 'REPLY');
    });

    test('Returns SKIP when random is within fourth weight (0.2)', async () => {
        const actor = { persona_type: 'tech_bro' };
        const targetPost = { topic: 'Tech' };

        // 0.8 < random <= 1.0
        mock.method(Math, 'random', () => 0.9);
        const result = await simulateInteraction(actor, targetPost);
        assert.strictEqual(result, 'SKIP');
    });
});
