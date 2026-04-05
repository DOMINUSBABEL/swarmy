const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Configuration
const EXCEL_PATH = path.join(__dirname, '../Master_Social_Creds.xlsx');

// MOCK INTERACTION LOGIC
async function simulateInteraction(actor, targetPost) {
    const actions = ['LIKE', 'RETWEET', 'REPLY', 'SKIP'];
    const weights = [0.6, 0.1, 0.1, 0.2]; // 60% like, 10% RT, 10% Reply, 20% Skip
    
    // Simple weighted random
    let random = Math.random();
    let action = 'SKIP';
    
    let sum = 0;
    for (let i = 0; i < actions.length; i++) {
        sum += weights[i];
        if (random <= sum) {
            action = actions[i];
            break;
        }
    }

    // Contextual Override: Coffee Snob shouldn't RT Crypto Degen usually
    if (actor.persona_type === 'coffee_snob' && targetPost.topic === 'Crypto') {
        action = 'SKIP';
    }

    return action;
}

/**
 * Generates interactions for a given set of posts and accounts.
 * @param {Array} recentPosts - Array of post objects.
 * @param {Array} accounts - Array of account objects.
 * @param {Object} options - Generation options.
 * @param {boolean} options.verbose - Whether to log each interaction.
 * @returns {Promise<Array>} - Array of generated interaction objects.
 */
async function generateInteractions(recentPosts, accounts, options = { verbose: false }) {
    const interactions = [];
    const accountMap = new Map();
    for (const a of accounts) {
        accountMap.set(a.account_id, a);
    }

    for (const post of recentPosts) {
        // Find who posted it (O(1) lookup)
        const author = accountMap.get(post.account_id);
        if (!author) continue;

        // Everyone else reacts
        for (const actor of accounts) {
            if (actor.account_id === author.account_id) continue; // Don't like own post (usually)
            if (actor.status !== 'active') continue;

            const action = await simulateInteraction(actor, { topic: author.core_topics ? author.core_topics.split(',')[0] : 'General' });
            
            if (action !== 'SKIP') {
                interactions.push({
                    actor_id: actor.account_id,
                    target_post_id: post.post_id,
                    action_type: action,
                    timestamp: new Date().toISOString()
                });

                if (options.verbose) {
                    console.log(`   👉 ${actor.username} (${actor.persona_type}) -> ${action} -> Post by ${author.username}`);
                }
            }
        }
    }
    return interactions;
}

async function runInteractionPod() {
    if (!fs.existsSync(EXCEL_PATH)) {
        console.error("❌ Excel not found.");
        return;
    }

    const workbook = xlsx.readFile(EXCEL_PATH);
    const accounts = xlsx.utils.sheet_to_json(workbook.Sheets['ACCOUNTS']);
    const calendar = xlsx.utils.sheet_to_json(workbook.Sheets['CALENDAR']);

    // Filter published posts from the last 24h
    const recentPosts = calendar.filter(p => p.status === 'published' || p.status === 'draft'); // Using draft for testing

    console.log(`🤝 Engagement Pod Active. Scanning ${recentPosts.length} posts...`);

    const interactions = await generateInteractions(recentPosts, accounts, { verbose: true });

    // Save interactions to a new sheet? Or just log them for the scheduler to pick up?
    // For V4, let's create an INTERACTIONS sheet.
    let interactionSheet;
    if (workbook.Sheets['INTERACTIONS']) {
        const existing = xlsx.utils.sheet_to_json(workbook.Sheets['INTERACTIONS']);
        interactionSheet = xlsx.utils.json_to_sheet([...existing, ...interactions]);
    } else {
        interactionSheet = xlsx.utils.json_to_sheet(interactions);
    }
    
    // Remove old sheet if exists to replace
    if (workbook.Sheets['INTERACTIONS']) delete workbook.Sheets['INTERACTIONS'];
    
    xlsx.utils.book_append_sheet(workbook, interactionSheet, 'INTERACTIONS');
    xlsx.writeFile(workbook, EXCEL_PATH);

    console.log(`✅ Logged ${interactions.length} new interactions to perform.`);
}

if (require.main === module) {
    runInteractionPod();
}

module.exports = {
    simulateInteraction,
    generateInteractions,
    runInteractionPod
};
