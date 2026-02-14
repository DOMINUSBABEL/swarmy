const fs = require('fs');
const xlsx = require('xlsx');

// Configuration
const OUT_FILE = 'Master_Social_Creds.xlsx';

function generateMasterExcel() {
    if (fs.existsSync(OUT_FILE)) {
        console.log(`⚠️ ${OUT_FILE} already exists. Skipping.`);
        return;
    }

    const workbook = xlsx.utils.book_new();

    // 1. ACCOUNTS Sheet - 10 Slots Template
    const accountsData = [];
    for (let i = 1; i <= 10; i++) {
        accountsData.push({
            account_id: `account_${String(i).padStart(2, '0')}`,
            platform: 'twitter', // Default
            username: `user_handle_${i}`,
            password: 'password_here',
            auth_token: '', // Cookies JSON string
            proxy: '', // http://user:pass@ip:port
            status: i <= 2 ? 'active' : 'inactive', // First 2 active by default
            content_lines: 'general'
        });
    }
    const accountsSheet = xlsx.utils.json_to_sheet(accountsData);
    xlsx.utils.book_append_sheet(workbook, accountsSheet, 'ACCOUNTS');

    // 2. CONTENT_LINES Sheet
    const linesData = [
        {
            line_id: 'general',
            description: 'General updates and thoughts.',
            prompt_template: 'Write a casual post about {{topic}}.',
            frequency: 'daily',
            target_audience: 'General Public'
        },
        {
            line_id: 'tech_news',
            description: 'Latest in AI and Dev.',
            prompt_template: 'Summarize this tech news: {{topic}}',
            frequency: 'mwf',
            target_audience: 'Developers'
        },
        {
            line_id: 'coffee_culture',
            description: 'Specialty coffee education.',
            prompt_template: 'Explain this coffee concept: {{topic}}',
            frequency: 'tth',
            target_audience: 'Coffee Lovers'
        }
    ];
    const linesSheet = xlsx.utils.json_to_sheet(linesData);
    xlsx.utils.book_append_sheet(workbook, linesSheet, 'CONTENT_LINES');

    // 3. CALENDAR Sheet (Empty, just headers)
    const calendarData = [
        {
            post_id: 'post_001',
            account_id: 'account_01',
            line_id: 'general',
            scheduled_date: '2026-02-15 10:00',
            status: 'draft',
            content_text: 'Hello world from Account 1!',
            media_path: '',
            hashtags: '#hello'
        }
    ];
    const calendarSheet = xlsx.utils.json_to_sheet(calendarData);
    xlsx.utils.book_append_sheet(workbook, calendarSheet, 'CALENDAR');

    xlsx.writeFile(workbook, OUT_FILE);
    console.log(`✅ Generated ${OUT_FILE} with 10 account slots.`);
}

generateMasterExcel();
