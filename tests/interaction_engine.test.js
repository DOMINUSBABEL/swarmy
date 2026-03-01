const { test, describe, it } = require('node:test');
const assert = require('assert');
const { generateInteractions } = require('../scripts/interaction_engine.js');

describe('Interaction Engine', () => {
    it('should respect interaction rules (no self-interaction, no inactive users)', async () => {
        const accounts = [
            { account_id: '1', username: 'user1', status: 'active', persona_type: 'generic', core_topics: 'General' }, // Author
            { account_id: '2', username: 'user2', status: 'active', persona_type: 'generic', core_topics: 'General' }, // Reactor
            { account_id: '3', username: 'user3', status: 'suspended', persona_type: 'generic', core_topics: 'General' } // Inactive
        ];

        const posts = [
            { post_id: 'p1', account_id: '1', status: 'published' }
        ];

        // Capture console.log to avoid noise
        const originalLog = console.log;
        console.log = () => {};

        const interactions = await generateInteractions(accounts, posts);

        console.log = originalLog;

        // Validation
        for (const interaction of interactions) {
            // Rule 1: No self-interaction
            assert.notStrictEqual(interaction.actor_id, '1', 'Author should not interact with own post');

            // Rule 2: No inactive users
            assert.notStrictEqual(interaction.actor_id, '3', 'Inactive account should not interact');

            // Rule 3: Valid actor
            assert.strictEqual(interaction.actor_id, '2', 'Only active, non-author accounts should interact');

            // Rule 4: Correct target
            assert.strictEqual(interaction.target_post_id, 'p1', 'Interaction should target the correct post');
        }
    });

    it('should handle missing authors gracefully', async () => {
        const accounts = [
            { account_id: '1', username: 'user1', status: 'active' }
        ];
        const posts = [
            { post_id: 'p1', account_id: '999', status: 'published' } // Non-existent author
        ];

        const originalLog = console.log;
        console.log = () => {};

        const interactions = await generateInteractions(accounts, posts);

        console.log = originalLog;

        assert.strictEqual(interactions.length, 0, 'Should not generate interactions if author is missing');
    });
});
