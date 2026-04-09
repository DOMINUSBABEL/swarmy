const { test, describe } = require('node:test');
const assert = require('node:assert');
const { runManualLoop } = require('../scripts/loop_poster_manual.js');

describe('loop_poster_manual.js tests', () => {

    test('runManualLoop logs correct connection messages', async () => {
        const loggedMessages = [];

        // Create a mock console to capture logs
        const mockConsole = {
            log: (msg) => {
                loggedMessages.push(msg);
            }
        };

        // Call the function with injected dependencies
        await runManualLoop({ console: mockConsole });

        // Assertions
        assert.strictEqual(loggedMessages.length, 3, 'Should log exactly three messages');

        assert.strictEqual(
            loggedMessages[0],
            "🔥 Connecting to EXISTING browser session (Profile: Clawd)...",
            "First message should mention connecting to existing browser"
        );

        assert.strictEqual(
            loggedMessages[1],
            "⚠️ Cannot hijack browser via script without closing it first.",
            "Second message should be the hijack warning"
        );

        assert.strictEqual(
            loggedMessages[2],
            "Please close the manual browser window, then run this script to reuse the session.",
            "Third message should be the instructions to close the window"
        );
    });

});
