const { test, describe } = require('node:test');
const assert = require('node:assert');
const { generatePostText } = require('../scripts/content_engine.js');

describe('generatePostText', () => {
    const topic = 'Artificial Intelligence';

    test('should return a variation containing the topic for generic persona', async () => {
        const persona = { type: 'generic' };
        const text = await generatePostText(persona, topic);

        const expectedPatterns = [
            `Just thinking about ${topic}... 🤔`,
            `Unpopular opinion: ${topic} is overrated. Don't @ me.`,
            `BREAKING: ${topic} just changed everything. 🧵👇`,
            `${topic}. That's it. That's the tweet.`,
            `Why is nobody talking about ${topic}?`
        ];

        assert.ok(expectedPatterns.includes(text), `Text "${text}" should be one of the expected variations`);
    });

    test('should format text for shitposter persona', async () => {
        const persona = { type: 'shitposter' };
        const text = await generatePostText(persona, topic);

        // Shitposter: lowercase and no periods
        assert.strictEqual(text, text.toLowerCase());
        assert.ok(!text.includes('.'), 'Shitposter text should not contain periods');
    });

    test('should format text for policy_analyst persona', async () => {
        const persona = { type: 'policy_analyst' };
        const text = await generatePostText(persona, topic);

        // Policy Analyst: specific prefix
        assert.ok(text.startsWith('[ANALYSIS] Regarding'), 'Policy analyst text should start with [ANALYSIS]');
        assert.ok(text.includes(topic), 'Policy analyst text should include the topic');
    });

    test('should handle different topics correctly', async () => {
        const alternateTopic = 'Coffee';
        const persona = { type: 'policy_analyst' };
        const text = await generatePostText(persona, alternateTopic);

        assert.ok(text.includes(alternateTopic), `Text should include topic "${alternateTopic}"`);
    });
});
