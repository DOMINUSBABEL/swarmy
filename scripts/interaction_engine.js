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

async function generateInteractions(accounts, recentPosts) {
    const interactions = [];

    // Optimization: Create a Map for O(1) author lookup
    const accountMap = new Map(accounts.map(a => [a.account_id, a]));

    // Optimization: Pre-filter active accounts to avoid checking status in the inner loop
    const activeAccounts = accounts.filter(a => a.status === 'active');

    for (const post of recentPosts) {
        // Find who posted it
        const author = accountMap.get(post.account_id);
        if (!author) continue;

        // Everyone else reacts
        for (const actor of activeAccounts) {
            if (actor.account_id === author.account_id) continue; // Don't like own post (usually)

            const action = await simulateInteraction(actor, { topic: author.core_topics ? author.core_topics.split(',')[0] : 'General' });
            
            if (action !== 'SKIP') {
                interactions.push({
                    actor_id: actor.account_id,
                    target_post_id: post.post_id,
                    action_type: action,
                    timestamp: new Date().toISOString()
                });
                console.log(`   👉 ${actor.username} (${actor.persona_type}) -> ${action} -> Post by ${author.username}`);
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
    // (Mock filter for now)
    const recentPosts = calendar.filter(p => p.status === 'published' || p.status === 'draft'); // Using draft for testing

    console.log(`🤝 Engagement Pod Active. Scanning ${recentPosts.length} posts...`);

    const interactions = await generateInteractions(accounts, recentPosts);

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

module.exports = { runInteractionPod, simulateInteraction, generateInteractions };

if (require.main === module) {
    runInteractionPod();
}
