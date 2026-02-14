require('dotenv').config();
const fs = require('fs');
const xlsx = require('xlsx');

// Configuration
const OUT_FILE = 'Master_Social_Creds.xlsx';

function generateMasterExcel() {
    // Warn if env vars are missing
    const requiredVars = [
        'ACC_SAMUEL_PASSWORD', 'ACC_MARIATE_PASSWORD', 'ACC_DANIEL_PASSWORD',
        'ACC_NGUERRERO_PASSWORD', 'ACC_REVISTAVOCES_PASSWORD', 'ACC_CAMILA_PASSWORD',
        'ACC_CONCEJO_X_PASSWORD'
    ];
    const missingVars = requiredVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
        console.warn('⚠️ Missing environment variables for passwords:', missingVars.join(', '));
        console.warn('⚠️ Using empty strings for missing passwords.');
    }

    // FORCE OVERWRITE FOR CREDENTIAL INJECTION
    // if (fs.existsSync(OUT_FILE)) { console.log(`⚠️ ${OUT_FILE} already exists. Skipping.`); return; }
    if (fs.existsSync(OUT_FILE)) {
        try { fs.unlinkSync(OUT_FILE); } catch(e) { console.log("Old file locked/error"); }
    }

    const workbook = xlsx.utils.book_new();

    // 1. ACCOUNTS Sheet - Injected Real Credentials
    const accountsData = [
        {
            account_id: 'acc_samuel',
            platform: 'twitter',
            username: 'Samuel_MendozCD',
            password: process.env.ACC_SAMUEL_PASSWORD || '',
            auth_token: '',
            proxy: '',
            status: 'active',
            persona_type: 'policy_analyst', // Asignación estratégica
            content_lines: 'politics, urbanism'
        },
        {
            account_id: 'acc_mariate',
            platform: 'twitter',
            username: 'mariatemonto',
            password: process.env.ACC_MARIATE_PASSWORD || '',
            auth_token: '',
            proxy: '',
            status: 'active',
            persona_type: 'coffee_snob', // Asignación estratégica (Aguabonita?)
            content_lines: 'lifestyle, culture'
        },
        {
            account_id: 'acc_daniel',
            platform: 'twitter',
            username: 'Daniel_VargasCc',
            password: process.env.ACC_DANIEL_PASSWORD || '',
            auth_token: '',
            proxy: '',
            status: 'active',
            persona_type: 'tech_visionary',
            content_lines: 'tech, future'
        },
        {
            account_id: 'acc_nguerrero',
            platform: 'twitter',
            username: 'NGuerrero16814',
            password: process.env.ACC_NGUERRERO_PASSWORD || '',
            auth_token: '',
            proxy: '',
            status: 'active',
            persona_type: 'shitposter', // Caos controlado
            content_lines: 'memes, rant'
        },
        {
            account_id: 'acc_revistavoces',
            platform: 'twitter',
            username: 'RevistavocesD',
            password: process.env.ACC_REVISTAVOCES_PASSWORD || '',
            auth_token: '',
            proxy: '',
            status: 'active',
            persona_type: 'news_outlet', // Nuevo Rol: Medio
            content_lines: 'news, headlines'
        },
        {
            account_id: 'acc_camila',
            platform: 'twitter',
            username: 'moreno_cam73152',
            password: process.env.ACC_CAMILA_PASSWORD || '',
            status: 'active',
            persona_type: 'general',
            content_lines: 'lifestyle'
        },
        {
            account_id: 'acc_concejo_x',
            platform: 'twitter',
            username: 'concejo38265',
            password: process.env.ACC_CONCEJO_X_PASSWORD || '',
            status: 'active',
            persona_type: 'policy_analyst',
            content_lines: 'politics'
        },
        // PENDING PASSWORDS
        { account_id: 'acc_valentina', username: 'ValentinaM98520', password: '', status: 'inactive' },
        { account_id: 'acc_andres', username: 'HerreraTor4892', password: '', status: 'inactive' },
        { account_id: 'acc_mafe', username: 'FernandaMa42026', password: '', status: 'inactive' }
    ];

    // Add placeholder slots for remaining 0 to reach 10
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
