const fs = require('fs');
const assert = require('node:assert');
const test = require('node:test');

const fileToCheck = 'scripts/generate_master_excel.js';
const forbiddenPasswords = [
    'febrero202627',
    'febrero202628',
    'Febrero202630',
    'febrero202631',
    'Habiaunavez205@',
    "'secret'",
    'password_here'
];

test('Security Audit: Hardcoded Credentials in generate_master_excel.js', async (t) => {
    await t.test(`Check ${fileToCheck} for hardcoded passwords`, () => {
        if (!fs.existsSync(fileToCheck)) {
            assert.fail(`File ${fileToCheck} does not exist.`);
        }

        const content = fs.readFileSync(fileToCheck, 'utf8');
        for (const password of forbiddenPasswords) {
            const hasPassword = content.includes(password);
            assert.strictEqual(hasPassword, false, `Security Violation: ${fileToCheck} contains hardcoded password '${password}'`);
        }
    });
});
