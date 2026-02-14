const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { SELECTORS } = require('../scripts/swarm_attack.js');

test('Swarm Attack Selectors', async (t) => {
    await t.test('should export SELECTORS object', () => {
        assert.ok(SELECTORS, 'SELECTORS object should be exported');
        assert.strictEqual(typeof SELECTORS, 'object');
    });

    await t.test('should have all required selectors', () => {
        const expectedKeys = [
            'usernameInput',
            'nextButtonXpath',
            'passwordInput',
            'likeButton',
            'replyButton',
            'tweetButton'
        ];

        for (const key of expectedKeys) {
            assert.ok(SELECTORS[key], `Missing selector: ${key}`);
            assert.strictEqual(typeof SELECTORS[key], 'string', `Selector ${key} should be a string`);
        }
    });

    await t.test('should not contain hardcoded selectors in the file body', () => {
        const filePath = path.join(__dirname, '../scripts/swarm_attack.js');
        const content = fs.readFileSync(filePath, 'utf8');

        // Extract the part of the file after the SELECTORS definition to avoid false positives
        // Assuming SELECTORS definition ends with };
        const parts = content.split('const SELECTORS = {');
        assert.ok(parts.length > 1, 'Could not find SELECTORS definition in file');

        const afterSelectors = parts[1].split('};')[1];
        assert.ok(afterSelectors, 'Could not find end of SELECTORS definition');

        const hardcodedStrings = [
            'input[autocomplete="username"]',
            // 'xpath/.//span[contains(text(), "Siguiente") or contains(text(), "Next")]', // This is too long and might be split or formatted differently, maybe check substrings?
            'input[name="password"]',
            'div[data-testid="like"]',
            'div[data-testid="reply"]',
            'div[data-testid="tweetButton"]'
        ];

        for (const str of hardcodedStrings) {
            assert.strictEqual(afterSelectors.includes(str), false, `Found hardcoded string "${str}" in the code body`);
        }

        // Check for the xpath specifically as it is unique
        const xpathStr = 'xpath/.//span[contains(text(), "Siguiente") or contains(text(), "Next")]';
        assert.strictEqual(afterSelectors.includes(xpathStr), false, `Found hardcoded xpath "${xpathStr}" in the code body`);
    });
});
