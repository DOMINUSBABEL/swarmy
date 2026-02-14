const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { generatePostText, generateHashtags } = require('../scripts/content_engine');

describe('Content Engine', () => {
    describe('generatePostText', () => {
        test('removes all dots for shitposter persona', async () => {
            // Mock Math.random to select the variation at index 3:
            // `${topic}. That's it. That's the tweet.`
            // 0.6 * 5 = 3.0.
            const originalRandom = Math.random;
            Math.random = () => 0.6;

            try {
                const topic = 'Crypto';
                const persona = { type: 'shitposter' };
                const result = await generatePostText(persona, topic);

                // Expected: "crypto that's it that's the tweet" (all dots removed)
                // Actual (buggy): "crypto that's it. that's the tweet."

                assert.strictEqual(result, "crypto that's it that's the tweet");
            } finally {
                Math.random = originalRandom;
            }
        });

        test('returns analysis text for policy_analyst persona', async () => {
            const topic = 'Economy';
            const persona = { type: 'policy_analyst' };
            const result = await generatePostText(persona, topic);

            assert.match(result, /\[ANALYSIS\] Regarding Economy: Critical implications emerging\./);
        });
    });

    describe('generateHashtags', () => {
        test('removes all spaces from topic', () => {
            const topic = 'Artificial Intelligence Ethics';
            const result = generateHashtags(topic);

            // Expected: "#ArtificialIntelligenceEthics"
            // Actual (buggy): "#ArtificialIntelligence Ethics"
            assert.strictEqual(result, '#ArtificialIntelligenceEthics');
        });
    });
});
