const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

const EXCEL_PATH = path.join(__dirname, '../Master_Social_Creds.xlsx');

// 🎭 ARCHETYPES
const PERSONAS = {
    'tech_visionary': {
        bio_templates: ['Building the future of #AI. 🚀', 'Code + Coffee = Life. ☕💻', 'Accelerating humanity via tech.'],
        tone: 'optimistic, professional, visionary',
        topics: ['AI', 'Space', 'Crypto', 'Startup']
    },
    'shitposter': {
        bio_templates: ['Professional yapper.', 'Here for the memes.', 'Not financial advice.'],
        tone: 'sarcastic, lowercase, chaotic',
        topics: ['Pop Culture', 'Failures', 'Rants']
    },
    'coffee_snob': {
        bio_templates: ['Death before Decaf.', 'Q-Grader in training.', 'Pour-over purist.'],
        tone: 'detailed, sensory, passionate',
        topics: ['Specialty Coffee', 'Roasting', 'Origin']
    },
    'policy_analyst': {
        bio_templates: ['Data driven policy.', 'Democracy dies in darkness.', 'Observing the grid.'],
        tone: 'formal, critical, academic',
        topics: ['Politics', 'Urbanism', 'Economics']
    },
    'crypto_degen': {
        bio_templates: ['WAGMI.', 'Bag holder.', 'To the moon. 🚀'],
        tone: 'slang-heavy, hype, volatile',
        topics: ['Web3', 'NFTs', 'DeFi']
    }
};

function assignIdentities() {
    if (!fs.existsSync(EXCEL_PATH)) {
        console.error("❌ Master Excel not found. Run generate_master_excel.js first.");
        return;
    }

    const workbook = xlsx.readFile(EXCEL_PATH);
    const accountsSheet = workbook.Sheets['ACCOUNTS'];
    let accounts = xlsx.utils.sheet_to_json(accountsSheet);

    console.log(`🎭 Assigning identities to ${accounts.length} accounts...`);

    const updatedAccounts = accounts.map((acc, index) => {
        // Round-robin assignment of personas
        const types = Object.keys(PERSONAS);
        const type = types[index % types.length];
        const persona = PERSONAS[type];

        // Randomly pick a bio if not set
        const bio = acc.bio || persona.bio_templates[Math.floor(Math.random() * persona.bio_templates.length)];

        return {
            ...acc,
            persona_type: type,
            tone_voice: persona.tone,
            bio: bio,
            core_topics: persona.topics.join(', ')
        };
    });

    // Write back to Excel
    const newSheet = xlsx.utils.json_to_sheet(updatedAccounts);
    workbook.Sheets['ACCOUNTS'] = newSheet;
    xlsx.writeFile(workbook, EXCEL_PATH);
    
    console.log("✅ Identities injected successfully into ACCOUNTS sheet.");
    console.table(updatedAccounts.map(a => ({ id: a.account_id, type: a.persona_type, bio: a.bio })));
}

assignIdentities();
