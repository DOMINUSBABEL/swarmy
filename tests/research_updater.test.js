const test = require('node:test');
const assert = require('node:assert');
const { getSystemStats } = require('../scripts/research_updater');

test('getSystemStats returns object with expected keys', () => {
    const stats = getSystemStats();
    assert.ok('activeAgents' in stats, 'Should have activeAgents');
    assert.ok('postsGenerated' in stats, 'Should have postsGenerated');
    assert.ok('engagementRate' in stats, 'Should have engagementRate');
});

test('getSystemStats returns valid types', () => {
    const stats = getSystemStats();
    assert.strictEqual(typeof stats.activeAgents, 'number', 'activeAgents should be a number');
    assert.strictEqual(typeof stats.postsGenerated, 'number', 'postsGenerated should be a number');
    assert.strictEqual(typeof stats.engagementRate, 'string', 'engagementRate should be a string');
    // Regex to match "X.Y%" format
    assert.match(stats.engagementRate, /^\d+(\.\d+)?%$/, 'engagementRate should match percentage format');
});
