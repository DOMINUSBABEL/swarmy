const { test } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, '../scripts/swarm_attack.js');

function runScript(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const child = spawn('node', [scriptPath, url], {
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        child.stdout.on('data', (data) => {
            output += data.toString();
        });

        child.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        const timer = setTimeout(() => {
            child.kill();
            resolve({ code: null, output, errorOutput, killed: true });
        }, timeout);

        child.on('exit', (code) => {
            clearTimeout(timer);
            resolve({ code, output, errorOutput, killed: false });
        });
    });
}

test('Security: Invalid URL should be rejected', async () => {
    const invalidUrl = 'javascript:alert(1)';
    const result = await runScript(invalidUrl, 3000);

    // Check exit code and error message
    // If validation fails, it should print specific error message to stderr or stdout
    const messageFound = result.output.includes('Invalid Target URL provided') || result.errorOutput.includes('Invalid Target URL provided');

    assert.strictEqual(result.code, 1, `Process should exit with code 1, but got ${result.code}`);
    assert.ok(messageFound, 'Should output validation error message');
});

test('Security: Valid URL should be accepted', async () => {
    // We use a valid formatted URL. Puppeteer might fail later, but validation should pass.
    const validUrl = 'https://x.com/someuser/status/123456789';
    const result = await runScript(validUrl, 3000);

    // Should NOT contain the validation error
    const messageFound = result.output.includes('Invalid Target URL provided') || result.errorOutput.includes('Invalid Target URL provided');
    assert.strictEqual(messageFound, false, 'Should not output validation error message for valid URL');

    // We don't check exit code strictly because Puppeteer might fail/crash or hang (killed=true)
});
