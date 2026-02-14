const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '../research/preprint_template.md');
const OUTPUT_PATH = path.join(__dirname, '../research/latest_preprint.md');

function updatePreprint() {
    if (!fs.existsSync(TEMPLATE_PATH)) {
        console.error("❌ Template not found.");
        return;
    }

    let content = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
    
    // Inject Dynamic Data (Mock)
    const activeAgents = 10;
    const postsGenerated = 45;
    const engagementRate = "4.5%";

    content += `\n\n## 5. Live System Status (Auto-Update)\n`;
    content += `- **Active Agents:** ${activeAgents}\n`;
    content += `- **Posts Generated:** ${postsGenerated}\n`;
    content += `- **Engagement Rate:** ${engagementRate}\n`;
    content += `\n*Last Updated: ${new Date().toISOString()}*`;

    fs.writeFileSync(OUTPUT_PATH, content);
    console.log(`✅ Preprint updated at ${OUTPUT_PATH}`);
}

updatePreprint();
