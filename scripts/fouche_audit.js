// JOSEPH FOUCHÉ - The Minister of Police & Optimization
// "Tout voir, tout entendre, ne rien dire... sauf pour optimiser."

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const EXCEL_PATH = path.join(__dirname, '../Master_Social_Creds.xlsx');
const LOG_PATH = path.join(__dirname, '../logs/fouche_audit.log');

// Fouché's Rules of Efficiency
const RULES = {
    MAX_IDLE_TIME_HOURS: 4,
    MIN_ENGAGEMENT_RATE: 0.02,
    FORBIDDEN_KEYWORDS: ['I am an AI', 'chatbot', 'generic response']
};

function auditSwarm(inAccounts, inCalendar) {
    let accounts = inAccounts;
    let calendar = inCalendar;

    if (!accounts || !calendar) {
        if (!fs.existsSync(EXCEL_PATH)) return;

        const workbook = xlsx.readFile(EXCEL_PATH);
        if (!accounts) accounts = xlsx.utils.sheet_to_json(workbook.Sheets['ACCOUNTS']);
        if (!calendar) calendar = xlsx.utils.sheet_to_json(workbook.Sheets['CALENDAR']);
    }

    console.log("🕵️ FOUCHÉ: Auditing Swarm Operations...");
    
    let auditReport = [];

    // 1. Check for Compromised Agents (Inactive or Failed) & Quality Control
    // Optimized: Single pass iteration
    let failedCount = 0;
    let weakCount = 0;

    for (const p of calendar) {
        if (p.status === 'failed') {
            failedCount++;
        }
        if (p.content_text && p.content_text.length < 20) {
            weakCount++;
        }
    }

    if (failedCount > 0) {
        auditReport.push(`⚠️ ALERT: ${failedCount} posts failed. Investigating proxies.`);
    }

    if (weakCount > 0) {
        auditReport.push(`📉 QUALITY: ${weakCount} posts are too short (Low Effort). Talleyrand, improve prompts.`);
    }

    // 3. Optimization Suggestion
    const activeCount = accounts.filter(a => a.status === 'active').length;
    if (activeCount < 5) {
        auditReport.push(`⚖️ EFFICIENCY: Swarm is underpowered (${activeCount}/10 active). Activate sleepers.`);
    }

    // Log finding
    const logEntry = `[${new Date().toISOString()}] ${auditReport.join(' | ')}\n`;
    // Ensure log dir exists
    const logDir = path.dirname(LOG_PATH);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
    
    fs.appendFileSync(LOG_PATH, logEntry);
    
    if (auditReport.length > 0) {
        console.log(auditReport.join('\n'));
    } else {
        console.log("✅ FOUCHÉ: The State is secure. Operations are optimal.");
    }

    return auditReport;
}

if (require.main === module) {
    auditSwarm();
}

module.exports = { auditSwarm };
