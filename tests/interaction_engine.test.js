const { describe, it, mock } = require('node:test');
const assert = require('node:assert');
const { simulateInteraction } = require('../scripts/interaction_engine.js');

describe('Interaction Engine', () => {

    it('should return LIKE when random is <= 0.6', async () => {
        const randomMock = mock.method(Math, 'random', () => 0.1);

        const action = await simulateInteraction({}, {});
        assert.strictEqual(action, 'LIKE');

        randomMock.mock.restore();
    });

    it('should return RETWEET when random is > 0.6 and <= 0.7', async () => {
        const randomMock = mock.method(Math, 'random', () => 0.65);

        const action = await simulateInteraction({}, {});
        assert.strictEqual(action, 'RETWEET');

        randomMock.mock.restore();
    });

    it('should return REPLY when random is > 0.7 and <= 0.8', async () => {
        const randomMock = mock.method(Math, 'random', () => 0.75);

        const action = await simulateInteraction({}, {});
        assert.strictEqual(action, 'REPLY');

        randomMock.mock.restore();
    });

    it('should return SKIP when random is > 0.8', async () => {
        const randomMock = mock.method(Math, 'random', () => 0.9);

        const action = await simulateInteraction({}, {});
        assert.strictEqual(action, 'SKIP');

        randomMock.mock.restore();
    });

    it('should override with SKIP for Coffee Snob on Crypto topic', async () => {
        // Force a LIKE outcome normally (0.1)
        const randomMock = mock.method(Math, 'random', () => 0.1);

        const actor = { persona_type: 'coffee_snob' };
        const targetPost = { topic: 'Crypto' };

        const action = await simulateInteraction(actor, targetPost);
        assert.strictEqual(action, 'SKIP');

        randomMock.mock.restore();
    });

    it('should NOT override for Coffee Snob on other topics', async () => {
        // Force a LIKE outcome (0.1)
        const randomMock = mock.method(Math, 'random', () => 0.1);

        const actor = { persona_type: 'coffee_snob' };
        const targetPost = { topic: 'Tech' };

        const action = await simulateInteraction(actor, targetPost);
        assert.strictEqual(action, 'LIKE');

        randomMock.mock.restore();
    });

    it('should NOT override for other personas on Crypto topic', async () => {
        // Force a LIKE outcome (0.1)
        const randomMock = mock.method(Math, 'random', () => 0.1);

        const actor = { persona_type: 'tech_bro' };
        const targetPost = { topic: 'Crypto' };

        const action = await simulateInteraction(actor, targetPost);
        assert.strictEqual(action, 'LIKE');

        randomMock.mock.restore();
    });
});
