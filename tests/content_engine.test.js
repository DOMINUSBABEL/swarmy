const test = require('node:test');
const assert = require('node:assert');
const { generatePostsForAccounts } = require('../scripts/content_engine.js');

test('generatePostsForAccounts generates correct number of posts with unique IDs', async () => {
    const mockAccounts = Array.from({ length: 10 }, (_, i) => ({
        account_id: `acc_${i}`,
        persona_type: 'generic',
        core_topics: 'Tech',
        status: 'active'
    }));

    const mockGenerator = async (persona, topic) => {
        return `Test content for ${topic}`;
    };

    const posts = await generatePostsForAccounts(mockAccounts, mockGenerator);

    // Verify count
    assert.strictEqual(posts.length, 10, 'Should generate 1 post per account');

    // Verify content structure
    posts.forEach(post => {
        assert.ok(post.post_id, 'Post should have an ID');
        assert.strictEqual(post.content_text, 'Test content for Tech');
        assert.strictEqual(post.status, 'draft');
    });

    // Verify uniqueness of IDs
    const ids = posts.map(p => p.post_id);
    const uniqueIds = new Set(ids);
    assert.strictEqual(uniqueIds.size, 10, 'All post IDs should be unique');
});
