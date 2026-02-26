// JOSEPH FOUCHÉ - The Minister of Police & Optimization
// "Tout voir, tout entendre, ne rien dire... sauf pour optimiser."

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const EXCEL_PATH = path.join(__dirname, '../Master_Social_Creds.xlsx');
const LOG_PATH = path.join(__dirname, '../logs/fouche_audit.log');

const MIN_POST_LENGTH = 20;
const MIN_ACTIVE_AGENTS = 5;
const TARGET_AGENT_COUNT = 10;

function auditSwarm(deps = {}) {
    const { fs: fsLib = fs, xlsx: xlsxLib = xlsx } = deps;

    if (!fsLib.existsSync(EXCEL_PATH)) return;

    const workbook = xlsxLib.readFile(EXCEL_PATH);
    const accounts = xlsxLib.utils.sheet_to_json(workbook.Sheets['ACCOUNTS']);
    const calendar = xlsxLib.utils.sheet_to_json(workbook.Sheets['CALENDAR']);

    console.log("🕵️ FOUCHÉ: Auditing Swarm Operations...");
    
    let auditReport = [];

    // 1. Check for Compromised Agents (Inactive or Failed)
    const failedPosts = calendar.filter(p => p.status === 'failed');
    if (failedPosts.length > 0) {
        auditReport.push(`⚠️ ALERT: ${failedPosts.length} posts failed. Investigating proxies.`);
    }

    // 2. Check for Quality Control (Quality Assurance)
    const weakPosts = calendar.filter(p => p.content_text && p.content_text.length < MIN_POST_LENGTH);
    if (weakPosts.length > 0) {
        auditReport.push(`📉 QUALITY: ${weakPosts.length} posts are too short (Low Effort). Talleyrand, improve prompts.`);
    }

    // 3. Optimization Suggestion
    const activeCount = accounts.filter(a => a.status === 'active').length;
    if (activeCount < MIN_ACTIVE_AGENTS) {
        auditReport.push(`⚖️ EFFICIENCY: Swarm is underpowered (${activeCount}/${TARGET_AGENT_COUNT} active). Activate sleepers.`);
    }

    // Log finding
    const logEntry = `[${new Date().toISOString()}] ${auditReport.join(' | ')}\n`;
    // Ensure log dir exists
    const logDir = path.dirname(LOG_PATH);
    if (!fsLib.existsSync(logDir)) fsLib.mkdirSync(logDir);
    
    fsLib.appendFileSync(LOG_PATH, logEntry);
    
    if (auditReport.length > 0) {
        console.log(auditReport.join('\n'));
    } else {
        console.log("✅ FOUCHÉ: The State is secure. Operations are optimal.");
    }
}

module.exports = { auditSwarm, MIN_POST_LENGTH, MIN_ACTIVE_AGENTS, TARGET_AGENT_COUNT };

if (require.main === module) {
    auditSwarm();
}
