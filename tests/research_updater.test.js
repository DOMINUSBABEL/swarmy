const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { getSystemStats, updatePreprint } = require('../scripts/research_updater');

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

test('updatePreprint prints error if template not found', (t) => {
    t.mock.method(fs, 'existsSync', (p) => false);

    let errorLog = '';
    t.mock.method(console, 'error', (msg) => { errorLog = msg; });

    updatePreprint();

    assert.strictEqual(console.error.mock.calls.length, 1, 'Should call console.error once');
    assert.strictEqual(errorLog, '❌ Template not found.', 'Should log expected error message');
});

test('updatePreprint writes file if template exists', (t) => {
    t.mock.method(fs, 'existsSync', (p) => {
        // Return true for the template to bypass early return
        if (p.includes('preprint_template.md')) return true;
        // Return false for excel file so it uses default stats
        return false;
    });

    const mockTemplate = '# Mock Template';
    t.mock.method(fs, 'readFileSync', () => mockTemplate);

    let writtenContent = '';
    let writtenPath = '';
    t.mock.method(fs, 'writeFileSync', (p, content) => {
        writtenPath = p;
        writtenContent = content;
    });

    // Suppress console.warn for excel missing and console.log for success
    t.mock.method(console, 'warn', () => {});
    t.mock.method(console, 'log', () => {});

    updatePreprint();

    assert.strictEqual(fs.writeFileSync.mock.calls.length, 1, 'Should call fs.writeFileSync once');

    assert.ok(writtenPath.includes('latest_preprint.md'), 'Should write to latest_preprint.md');

    assert.ok(writtenContent.includes(mockTemplate), 'Should include original template');
    assert.ok(writtenContent.includes('## 5. Live System Status (Auto-Update)'), 'Should include stats header');
    assert.ok(writtenContent.includes('- **Active Agents:** 0'), 'Should default active agents to 0');
    assert.ok(writtenContent.includes('- **Posts Generated:** 0'), 'Should default posts generated to 0');
    assert.ok(writtenContent.includes('- **Engagement Rate:** 0.0%'), 'Should default engagement rate to 0.0%');
});
