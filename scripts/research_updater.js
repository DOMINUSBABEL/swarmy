const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const TEMPLATE_PATH = path.join(__dirname, '../research/preprint_template.md');
const OUTPUT_PATH = path.join(__dirname, '../research/latest_preprint.md');
const EXCEL_PATH = path.join(__dirname, '../Master_Social_Creds.xlsx');

function getSystemStats() {
    try {
        if (!fs.existsSync(EXCEL_PATH)) {
            console.warn(`⚠️ Excel file not found at ${EXCEL_PATH}. Using default stats.`);
            return { activeAgents: 0, postsGenerated: 0, engagementRate: "0.0%" };
        }

        const workbook = xlsx.readFile(EXCEL_PATH);

        // Active Agents
        let activeAgents = 0;
        if (workbook.Sheets['ACCOUNTS']) {
            const accounts = xlsx.utils.sheet_to_json(workbook.Sheets['ACCOUNTS']);
            activeAgents = accounts.filter(a => a.status === 'active').length;
        }

        // Posts Generated
        let postsGenerated = 0;
        if (workbook.Sheets['CALENDAR']) {
            const calendar = xlsx.utils.sheet_to_json(workbook.Sheets['CALENDAR']);
            postsGenerated = calendar.length;
        }

        // Engagement Rate
        let interactionsCount = 0;
        if (workbook.Sheets['INTERACTIONS']) {
            const interactions = xlsx.utils.sheet_to_json(workbook.Sheets['INTERACTIONS']);
            interactionsCount = interactions.length;
        }

        let engagementRate = "0.0%";
        if (postsGenerated > 0) {
            const rate = (interactionsCount / postsGenerated) * 100;
            engagementRate = rate.toFixed(1) + "%";
        }

        return { activeAgents, postsGenerated, engagementRate };

    } catch (error) {
        console.error(`❌ Error reading system stats: ${error.message}`);
        return { activeAgents: 0, postsGenerated: 0, engagementRate: "0.0%" };
    }
}

function updatePreprint() {
    if (!fs.existsSync(TEMPLATE_PATH)) {
        console.error("❌ Template not found.");
        return;
    }

    let content = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
    
    // Inject Dynamic Data
    const stats = getSystemStats();
    const { activeAgents, postsGenerated, engagementRate } = stats;

    content += `\n\n## 5. Live System Status (Auto-Update)\n`;
    content += `- **Active Agents:** ${activeAgents}\n`;
    content += `- **Posts Generated:** ${postsGenerated}\n`;
    content += `- **Engagement Rate:** ${engagementRate}\n`;
    content += `\n*Last Updated: ${new Date().toISOString()}*`;

    fs.writeFileSync(OUTPUT_PATH, content);
    console.log(`✅ Preprint updated at ${OUTPUT_PATH}`);
}

if (require.main === module) {
    updatePreprint();
}

module.exports = { updatePreprint, getSystemStats };
