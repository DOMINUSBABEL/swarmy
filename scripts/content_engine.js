const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Configuration
const EXCEL_PATH = path.join(__dirname, '../Master_Social_Creds.xlsx');

// MOCK LLM CALL (Replace with real Gemini/GPT call later)
async function generatePostText(persona, topic) {
    // Simulation of Natural Variation
    const variations = [
        `Just thinking about ${topic}... 🤔`,
        `Unpopular opinion: ${topic} is overrated. Don't @ me.`,
        `BREAKING: ${topic} just changed everything. 🧵👇`,
        `${topic}. That's it. That's the tweet.`,
        `Why is nobody talking about ${topic}?`
    ];
    
    // Identity Injection
    let text = variations[Math.floor(Math.random() * variations.length)];
    
    if (persona.type === 'shitposter') text = text.toLowerCase().replace('.', '');
    if (persona.type === 'policy_analyst') text = `[ANALYSIS] Regarding ${topic}: Critical implications emerging.`;
    
    return text;
}

// Extracted logic for testing/benchmarking
async function generatePostsForAccounts(activeAccounts, generator = generatePostText) {
    const promises = activeAccounts.map(async (acc, index) => {
        // Generate 1 new draft post per account
        const topic = acc.core_topics ? acc.core_topics.split(',')[0] : 'Life'; // Simple topic picker

        const newPostText = await generator({ type: acc.persona_type }, topic);

        const newPost = {
            post_id: `gen_${Date.now()}_${index}_${Math.floor(Math.random()*1000)}`,
            account_id: acc.account_id,
            line_id: 'auto_gen',
            scheduled_date: '2026-02-15 12:00', // Placeholder
            status: 'draft', // Human review needed? Or auto-approve for swarm?
            content_text: newPostText,
            media_path: '',
            hashtags: `#${topic.replace(' ', '')}`
        };

        return newPost;
    });

    return Promise.all(promises);
}

async function runContentEngine() {
    if (!fs.existsSync(EXCEL_PATH)) {
        console.error("❌ Excel not found.");
        return;
    }

    const workbook = xlsx.readFile(EXCEL_PATH);
    
    // Read Accounts & Identities
    const accounts = xlsx.utils.sheet_to_json(workbook.Sheets['ACCOUNTS']);
    const activeAccounts = accounts.filter(a => a.status === 'active');

    // Read Calendar to append new ideas
    let calendar = xlsx.utils.sheet_to_json(workbook.Sheets['CALENDAR']);

    console.log(`🧠 Generating organic content for ${activeAccounts.length} active accounts...`);

    const newPosts = await generatePostsForAccounts(activeAccounts);
    calendar.push(...newPosts);

    // Write back
    const newSheet = xlsx.utils.json_to_sheet(calendar);
    workbook.Sheets['CALENDAR'] = newSheet;
    xlsx.writeFile(workbook, EXCEL_PATH);

    console.log(`✅ Added ${activeAccounts.length} organic drafts to CALENDAR.`);
}

if (require.main === module) {
    runContentEngine();
}

module.exports = { runContentEngine, generatePostsForAccounts, generatePostText };
