const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');

// Mock dependencies
const mockFs = {
    existsSync: () => true,
    mkdirSync: () => {},
    appendFileSync: () => {}
};

const mockXlsx = {
    readFile: () => ({
        Sheets: {
            'ACCOUNTS': {},
            'CALENDAR': {}
        }
    }),
    utils: {
        sheet_to_json: () => []
    }
};

// Import module under test
const { auditSwarm, MIN_POST_LENGTH, MIN_ACTIVE_AGENTS, TARGET_AGENT_COUNT } = require('../scripts/fouche_audit.js');

describe('Fouche Audit', () => {

    it('should use constants for quality check (MIN_POST_LENGTH)', () => {
        let logOutput = '';
        const fsMock = {
            ...mockFs,
            appendFileSync: (p, content) => { logOutput += content; }
        };

        const shortPost = { content_text: 'Short', status: 'approved' };
        const longPost = { content_text: 'A long post that exceeds the minimum length requirement easily.', status: 'approved' };

        // Ensure MIN_POST_LENGTH is 20 as expected
        assert.strictEqual(MIN_POST_LENGTH, 20);

        const xlsxMock = {
            readFile: () => ({ Sheets: { 'ACCOUNTS': {}, 'CALENDAR': {} } }),
            utils: {
                sheet_to_json: (sheet) => {
                    // Mock CALENDAR return
                    if (sheet === xlsxMock.readFile().Sheets['CALENDAR']) { // This logic is tricky with fresh objects
                        return [shortPost, longPost];
                    }
                    // Mock ACCOUNTS return (enough active agents to avoid that warning)
                    return Array(MIN_ACTIVE_AGENTS).fill({ status: 'active' });
                }
            }
        };

        // Simplify mock logic to avoid object identity issues
        const workbook = { Sheets: { 'ACCOUNTS': { id: 'acc' }, 'CALENDAR': { id: 'cal' } } };
        xlsxMock.readFile = () => workbook;
        xlsxMock.utils.sheet_to_json = (sheet) => {
            if (sheet.id === 'cal') return [shortPost, longPost];
            if (sheet.id === 'acc') return Array(MIN_ACTIVE_AGENTS).fill({ status: 'active' });
            return [];
        };

        auditSwarm({ fs: fsMock, xlsx: xlsxMock });

        assert.match(logOutput, /📉 QUALITY: 1 posts are too short/);
    });

    it('should use constants for efficiency check (MIN_ACTIVE_AGENTS)', () => {
        let logOutput = '';
        const fsMock = {
            ...mockFs,
            appendFileSync: (p, content) => { logOutput += content; }
        };

        // Ensure constants match expectations
        assert.strictEqual(MIN_ACTIVE_AGENTS, 5);
        assert.strictEqual(TARGET_AGENT_COUNT, 10);

        const xlsxMock = {
            readFile: () => ({ Sheets: { 'ACCOUNTS': { id: 'acc' }, 'CALENDAR': { id: 'cal' } } }),
            utils: {
                sheet_to_json: (sheet) => {
                    if (sheet.id === 'cal') return []; // No posts
                    if (sheet.id === 'acc') {
                        // Return MIN_ACTIVE_AGENTS - 1 active accounts
                        return Array(MIN_ACTIVE_AGENTS - 1).fill({ status: 'active' });
                    }
                    return [];
                }
            }
        };

        auditSwarm({ fs: fsMock, xlsx: xlsxMock });

        const expectedCount = MIN_ACTIVE_AGENTS - 1;
        const expectedMsg = `EFFICIENCY: Swarm is underpowered (${expectedCount}/${TARGET_AGENT_COUNT} active)`;
        assert.ok(logOutput.includes(expectedMsg), `Log should contain: ${expectedMsg}`);
    });

    it('should not warn when conditions are met', () => {
        let logOutput = '';
        const fsMock = {
            ...mockFs,
            appendFileSync: (p, content) => { logOutput += content; }
        };

        const xlsxMock = {
            readFile: () => ({ Sheets: { 'ACCOUNTS': { id: 'acc' }, 'CALENDAR': { id: 'cal' } } }),
            utils: {
                sheet_to_json: (sheet) => {
                    if (sheet.id === 'cal') return [{ content_text: 'A sufficiently long post for quality check.', status: 'approved' }];
                    if (sheet.id === 'acc') return Array(MIN_ACTIVE_AGENTS).fill({ status: 'active' });
                    return [];
                }
            }
        };

        auditSwarm({ fs: fsMock, xlsx: xlsxMock });

        assert.doesNotMatch(logOutput, /📉 QUALITY/);
        assert.doesNotMatch(logOutput, /⚖️ EFFICIENCY/);
    });
});
