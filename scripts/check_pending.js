const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const EXCEL_PATH = path.join(__dirname, '../Master_Social_Creds.xlsx');

// Read existing generated content or generate fresh
// For speed, let's use the ones we generated in political_gen.js which are in the CALENDAR sheet
function getPendingPosts() {
    if (!fs.existsSync(EXCEL_PATH)) return [];
    const workbook = xlsx.readFile(EXCEL_PATH);
    const calendar = xlsx.utils.sheet_to_json(workbook.Sheets['CALENDAR']);
    
    // Filter for this account and specific campaign
    return calendar.filter(p => p.account_id === 'acc_revistavoces' && p.line_id === 'politics_burst' && p.status === 'approved');
}

// Minimal loop script structure (logic to be executed by agent thought loop, not node directly due to tool access)
// But I can write a node script that uses puppeteer to connect to the EXISTING browser if I have the WS Endpoint.
// The `browser` tool is internal. I will execute the loop via my internal reasoning (Chain of thought).

console.log("Posts ready: " + getPendingPosts().length);
