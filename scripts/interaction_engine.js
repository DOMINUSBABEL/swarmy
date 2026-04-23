const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Configuration
const EXCEL_PATH = path.join(__dirname, '../Master_Social_Creds.xlsx');

const PERSONA_TRAITS = {
    'policy_analyst': {
        interests: ['politics', 'news', 'economics', 'urbanism'],
        weights: { LIKE: 0.3, RETWEET: 0.2, REPLY: 0.4, SKIP: 0.1 }
    },
    'coffee_snob': {
        interests: ['lifestyle', 'culture', 'coffee', 'art'],
        weights: { LIKE: 0.6, RETWEET: 0.1, REPLY: 0.1, SKIP: 0.2 }
    },
    'tech_visionary': {
        interests: ['tech', 'future', 'ai', 'crypto', 'science'],
        weights: { LIKE: 0.4, RETWEET: 0.3, REPLY: 0.1, SKIP: 0.2 }
    },
    'shitposter': {
        interests: ['memes', 'rant', 'politics', 'crypto', 'shitpost'],
        weights: { LIKE: 0.2, RETWEET: 0.4, REPLY: 0.3, SKIP: 0.1 }
    },
    'news_outlet': {
        interests: ['politics', 'news', 'world', 'breaking'],
        weights: { LIKE: 0.1, RETWEET: 0.8, REPLY: 0.0, SKIP: 0.1 }
    },
    'general': {
        interests: ['general', 'lifestyle', 'news'],
        weights: { LIKE: 0.5, RETWEET: 0.1, REPLY: 0.1, SKIP: 0.3 }
    }
};

async function simulateInteraction(actor, targetPost) {
    const persona = PERSONA_TRAITS[actor.persona_type] || PERSONA_TRAITS['general'];
    const postTopic = (targetPost.topic || 'general').toLowerCase();

    // Calculate Interest Score
    // 1. Exact match or substring match in interests
    const isInterested = persona.interests.some(interest => postTopic.includes(interest));
    
    // 2. Adjust weights based on interest
    let weights = { ...persona.weights };
    
    if (!isInterested) {
        // If not interested, significantly increase SKIP chance
        // Reduce other actions
        weights.LIKE *= 0.5;
        weights.RETWEET *= 0.2;
        weights.REPLY *= 0.1;
        weights.SKIP = 1 - (weights.LIKE + weights.RETWEET + weights.REPLY);

        // Ensure SKIP isn't negative (edge case) or too low
        if (weights.SKIP < 0.5) weights.SKIP = 0.8;
    }

    // Normalize weights to sum to 1
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

    const actions = ['LIKE', 'RETWEET', 'REPLY', 'SKIP'];
    let random = Math.random() * totalWeight;

    for (const action of actions) {
        const weight = weights[action] || 0;
        if (random <= weight) {
            return action;
        }
        random -= weight;
    }

    return 'SKIP';
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

    const interactions = [];

    for (const post of recentPosts) {
        // Find who posted it
        const author = accounts.find(a => a.account_id === post.account_id);
        if (!author) continue;

        // Everyone else reacts
        for (const actor of accounts) {
            if (actor.account_id === author.account_id) continue; // Don't like own post (usually)
            if (actor.status !== 'active') continue;

            // Determine topic priority: Post Line ID > Author Core Topics > Author Content Lines > General
            let topic = 'General';
            if (post.line_id) {
                topic = post.line_id;
            } else if (author.core_topics) {
                topic = author.core_topics.split(',')[0];
            } else if (author.content_lines) {
                topic = author.content_lines.split(',')[0];
            }

            const action = await simulateInteraction(actor, { topic: topic.trim() });
            
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
    runInteractionPod
};
