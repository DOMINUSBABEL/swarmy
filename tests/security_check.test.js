const fs = require('fs');
const assert = require('node:assert');
const test = require('node:test');

const filesToCheck = ['scripts/swarm_attack.js', 'scheduler.js'];
const forbiddenFlags = ['--no-sandbox', '--disable-setuid-sandbox'];

test('Security Audit: Puppeteer Configuration', async (t) => {
    for (const file of filesToCheck) {
        await t.test(`Check ${file} for insecure flags`, () => {
            if (!fs.existsSync(file)) {
                assert.fail(`File ${file} does not exist.`);
            }

            const content = fs.readFileSync(file, 'utf8');
            for (const flag of forbiddenFlags) {
                const hasFlag = content.includes(flag);
                assert.strictEqual(hasFlag, false, `Security Violation: ${file} contains insecure flag '${flag}'`);
            }
        });
    }
});
