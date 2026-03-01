require('dotenv').config();
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configuration
const EXCEL_PATH = path.join(__dirname, '../Master_Social_Creds.xlsx');

// Initialize Gemini
let genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

function generateMockPostText(persona, topic) {
    if (persona.type === 'policy_analyst') {
        return `[ANALYSIS] Regarding ${topic}: Critical implications emerging.`;
    }

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
    
    if (persona.type === 'shitposter') {
        text = text.toLowerCase().replace('.', '');
    }
    
    return text;
}

// MOCK LLM CALL (Replace with real Gemini/GPT call later)
async function generatePostText(persona, topic) {
    if (genAI) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro"});
            const prompt = `Act as a social media user with the persona type '${persona.type}'.
            Write a short, engaging post about '${topic}'.
            Keep it under 280 characters.
            If the persona is 'shitposter', be chaotic, use lowercase, no periods, maybe memes.
            If the persona is 'policy_analyst', be serious, use data, analytical tone.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.warn("⚠️ Gemini API call failed, falling back to mock:", error.message);
        }
    } else {
        console.warn("⚠️ GEMINI_API_KEY not found, using mock implementation.");
    }

    return generateMockPostText(persona, topic);
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

    for (const acc of activeAccounts) {
        // Generate 1 new draft post per account
        const topic = acc.core_topics ? acc.core_topics.split(',')[0] : 'Life'; // Simple topic picker
        
        const newPostText = await generatePostText({ type: acc.persona_type }, topic);
        
        const newPost = {
            post_id: `gen_${Date.now()}_${Math.floor(Math.random()*1000)}`,
            account_id: acc.account_id,
            line_id: 'auto_gen',
            scheduled_date: '2026-02-15 12:00', // Placeholder
            status: 'draft', // Human review needed? Or auto-approve for swarm?
            content_text: newPostText,
            media_path: '',
            hashtags: `#${topic.replace(' ', '')}`
        };

        calendar.push(newPost);
    }

    // Write back
    const newSheet = xlsx.utils.json_to_sheet(calendar);
    workbook.Sheets['CALENDAR'] = newSheet;
    xlsx.writeFile(workbook, EXCEL_PATH);

    console.log(`✅ Added ${activeAccounts.length} organic drafts to CALENDAR.`);
}

if (require.main === module) {
    runContentEngine();
}

module.exports = {
    generatePostText,
    runContentEngine,
    // For testing
    setGenAI: (instance) => { genAI = instance; }
};
