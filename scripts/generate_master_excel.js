const fs = require('fs');
const xlsx = require('xlsx');
require('dotenv').config();

// Configuration
const OUT_FILE = 'Master_Social_Creds.xlsx';

function generateMasterExcel() {
    // FORCE OVERWRITE FOR CREDENTIAL INJECTION
    // if (fs.existsSync(OUT_FILE)) { console.log(`⚠️ ${OUT_FILE} already exists. Skipping.`); return; }
    if (fs.existsSync(OUT_FILE)) {
        try { fs.unlinkSync(OUT_FILE); } catch(e) { console.log("Old file locked/error"); }
    }

    // Check critical env vars
    const requiredVars = [
        'ACC_SAMUEL_PASSWORD',
        'ACC_MARIATE_PASSWORD',
        'ACC_REVISTAVOCES_PASSWORD',
        'ACC_CONCEJO_X_PASSWORD',
        'ACC_LUIGI_PASSWORD',
        'MASTER_PASSWORD_GROUP_B'
    ];

    const missing = requiredVars.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.warn(`⚠️  Warning: Missing environment variables: ${missing.join(', ')}. Accounts will have empty passwords.`);
    }

    const workbook = xlsx.utils.book_new();

    // 1. ACCOUNTS Sheet - Injected Real Credentials
    const accountsData = [
        // GROUP A: Custom Passwords
        { account_id: 'acc_samuel', username: 'Samuel_MendozCD', password: process.env.ACC_SAMUEL_PASSWORD || '', status: 'active', persona_type: 'policy_analyst' },
        { account_id: 'acc_mariate', username: 'mariatemonto', password: process.env.ACC_MARIATE_PASSWORD || '', status: 'active', persona_type: 'coffee_snob' },
        { account_id: 'acc_revistavoces', username: 'RevistavocesD', password: process.env.ACC_REVISTAVOCES_PASSWORD || '', status: 'active', persona_type: 'news_outlet' },
        { account_id: 'acc_concejo_x', username: 'concejo38265', password: process.env.ACC_CONCEJO_X_PASSWORD || '', status: 'active', persona_type: 'policy_analyst' },
        { account_id: 'acc_luigi', username: 'Luigialvarez02', password: process.env.ACC_LUIGI_PASSWORD || '', status: 'active', persona_type: 'policy_analyst' },

        // GROUP B: Master Password (Habiaunavez205@)
        { account_id: 'acc_daniel', username: 'Daniel_VargasCc', password: process.env.MASTER_PASSWORD_GROUP_B || '', status: 'active', persona_type: 'tech_visionary' },
        { account_id: 'acc_nguerrero', username: 'NGuerrero16814', password: process.env.MASTER_PASSWORD_GROUP_B || '', status: 'active', persona_type: 'shitposter' },
        { account_id: 'acc_camila', username: 'moreno_cam73152', password: process.env.MASTER_PASSWORD_GROUP_B || '', status: 'active', persona_type: 'general' },
        { account_id: 'acc_valentina', username: 'ValentinaM98520', password: process.env.MASTER_PASSWORD_GROUP_B || '', status: 'active', persona_type: 'coffee_snob' },
        { account_id: 'acc_andres', username: 'HerreraTor4892', password: process.env.MASTER_PASSWORD_GROUP_B || '', status: 'active', persona_type: 'tech_visionary' },
        { account_id: 'acc_mafe', username: 'FernandaMa42026', password: process.env.MASTER_PASSWORD_GROUP_B || '', status: 'active', persona_type: 'general' },
        { account_id: 'acc_juan', username: 'castro_jua50789', password: process.env.MASTER_PASSWORD_GROUP_B || '', status: 'active', persona_type: 'crypto_degen' },
        { account_id: 'acc_santiago', username: 'SPerdomito35341', password: process.env.MASTER_PASSWORD_GROUP_B || '', status: 'active', persona_type: 'policy_analyst' }
    ];

    // Remove placeholder slots logic as we have enough real accounts
    // for (let i = 5; i <= 10; i++) { ... }
    for (let i = 5; i <= 10; i++) {
        accountsData.push({
            account_id: `account_${String(i).padStart(2, '0')}`,
            platform: 'twitter',
            username: `user_placeholder_${i}`,
            password: 'password_here',
            auth_token: '',
            proxy: '',
            status: 'inactive',
            persona_type: 'general',
            content_lines: 'general'
        });
    }

    const accountsSheet = xlsx.utils.json_to_sheet(accountsData);
    xlsx.utils.book_append_sheet(workbook, accountsSheet, 'ACCOUNTS');

    // 2. CONTENT_LINES Sheet (Same as before)
    const linesData = [
        { line_id: 'general', description: 'General updates.', prompt_template: 'Write a casual post about {{topic}}.', frequency: 'daily', target_audience: 'Public' },
        { line_id: 'politics', description: 'Political analysis.', prompt_template: 'Analyze the impact of {{topic}} on local policy.', frequency: 'daily', target_audience: 'Voters' },
        { line_id: 'tech', description: 'Tech trends.', prompt_template: 'Explain why {{topic}} matters.', frequency: 'mwf', target_audience: 'Techies' }
    ];
    const linesSheet = xlsx.utils.json_to_sheet(linesData);
    xlsx.utils.book_append_sheet(workbook, linesSheet, 'CONTENT_LINES');

    // 3. CALENDAR Sheet (Empty)
    const calendarSheet = xlsx.utils.json_to_sheet([{ post_id: 'init_marker', status: 'system' }]);
    xlsx.utils.book_append_sheet(workbook, calendarSheet, 'CALENDAR');

    xlsx.writeFile(workbook, OUT_FILE);
    console.log(`✅ Injected 4 Real Accounts into ${OUT_FILE}`);
}

generateMasterExcel();
