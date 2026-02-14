const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { DateTime } = require('luxon');

// Config
const DEFAULT_EXCEL_PATH = path.join(__dirname, 'Master_Social_Creds.xlsx');
let excelPath = DEFAULT_EXCEL_PATH;

const MAX_CONCURRENT_WORKERS = 3; // Adjust based on RAM (approx 500MB per browser)
const POLL_INTERVAL_MS = 60 * 1000; // Check every minute

// State
let isRunning = false;

// Mock Logger
const log = (type, msg) => console.log(`[${new Date().toISOString()}] [${type}] ${msg}`);

function setExcelPath(path) {
    excelPath = path;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- CORE: Load Data ---
function loadPendingJobs() {
    if (!fs.existsSync(excelPath)) {
        log('ERROR', 'Excel file not found.');
        return [];
    }

    const workbook = xlsx.readFile(excelPath);
    
    // Read Accounts
    const accountsSheet = workbook.Sheets['ACCOUNTS'];
    const accounts = xlsx.utils.sheet_to_json(accountsSheet);
    const activeAccounts = accounts.filter(a => a.status === 'active');
    const accountMap = new Map(activeAccounts.map(a => [a.account_id, a]));

    // Read Calendar
    const calendarSheet = workbook.Sheets['CALENDAR'];
    const posts = xlsx.utils.sheet_to_json(calendarSheet);

    const now = DateTime.now();

    // Filter Jobs: Status 'approved' AND Scheduled Time <= Now
    const pendingJobs = posts.filter(post => {
        if (post.status !== 'approved') return false;
        
        const scheduledTime = DateTime.fromFormat(post.scheduled_date, 'yyyy-MM-dd HH:mm');
        return scheduledTime <= now;
    }).map(post => ({
        ...post,
        account: accountMap.get(post.account_id)
    })).filter(job => job.account); // Ensure account exists and is active

    return { workbook, pendingJobs };
}

// --- CORE: Worker (REAL PUPPETEER) ---
const puppeteer = require('puppeteer');

async function processJob(job) {
    const { post_id, account, content_text } = job;
    log('INFO', `Starting Job: ${post_id} for ${account.username}`);

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false, // Visible for now
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // 1. LOGIN (Simplified for X)
        await page.goto('https://twitter.com/i/flow/login', { waitUntil: 'networkidle2' });
        
        // Username
        await page.waitForSelector('input[autocomplete="username"]');
        await page.type('input[autocomplete="username"]', account.username);
        await page.keyboard.press('Enter');
        
        // Wait for potential "Verify" or Password
        await new Promise(r => setTimeout(r, 2000));
        
        // Check if asking for password directly or phone/email first
        // Simple logic: Look for password field. If not there, look for text input (challenge)
        try {
            await page.waitForSelector('input[name="password"]', { timeout: 3000 });
        } catch(e) {
            // Challenge? Assume it might be email/phone if configured, or just retry password
            // For now, assume straight to password or fail
            log('WARN', 'Password field not found immediately. Possible challenge.');
        }

        await page.type('input[name="password"]', account.password);
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        // 2. ACTION LOGIC
        if (job.target_url) {
            // REPLY / QUOTE Mode
            console.log(`   ↳ Target: ${job.target_url}`);
            await page.goto(job.target_url, { waitUntil: 'networkidle2' });
            await new Promise(r => setTimeout(r, 2000));

            // Click Reply (Simplest integration)
            // Selector for Reply icon often in [data-testid="reply"]
            await page.click('div[data-testid="reply"]');
            await new Promise(r => setTimeout(r, 1000));
            
            await page.keyboard.type(content_text);
            await new Promise(r => setTimeout(r, 500));
            
            await page.click('div[data-testid="tweetButton"]');
        } else {
            // NEW POST Mode
            await page.click('a[aria-label="Post"]', { timeout: 5000 }).catch(() => page.goto('https://twitter.com/compose/tweet'));
            await new Promise(r => setTimeout(r, 2000));
            
            await page.keyboard.type(content_text);
            await new Promise(r => setTimeout(r, 1000));
            
            await page.click('div[data-testid="tweetButton"]');
        }
        await new Promise(r => setTimeout(r, 5000)); // Wait for send

        log('SUCCESS', `Posted: ${content_text.substring(0, 20)}...`);
        return { success: true };

    } catch (error) {
        log('ERROR', `Failed Job ${post_id}: ${error.message}`);
        // Take screenshot on failure
        if (browser) await browser.pages().then(p => p[0].screenshot({ path: `logs/fail_${post_id}.png` }));
        return { success: false, error: error.message };
    } finally {
        if (browser) await browser.close();
    }
}

// --- CORE: Update Excel ---
function updateJobStatus(workbook, postId, newStatus, errorMsg = '') {
    const sheet = workbook.Sheets['CALENDAR'];
    if (!sheet) return;

    // Use header: 1 to get raw array of arrays, preserving structure awareness
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    if (!data || data.length === 0) return;

    const headers = data[0];
    const postIdColIdx = headers.indexOf('post_id');
    let statusColIdx = headers.indexOf('status');
    let errorColIdx = headers.indexOf('error_log');

    if (postIdColIdx === -1) {
        log('ERROR', 'post_id column not found in CALENDAR sheet.');
        return;
    }

    // Find row index (data[0] is header, so data[i] corresponds to Excel row i+1)
    let targetRowIdx = -1;
    for (let i = 1; i < data.length; i++) {
        if (data[i][postIdColIdx] == postId) {
            targetRowIdx = i;
            break;
        }
    }

    if (targetRowIdx === -1) {
        log('WARN', `Job ${postId} not found in Excel.`);
        return;
    }

    // Helper to update cell directly in sheet object
    const updateCell = (row, col, value) => {
        const cellRef = xlsx.utils.encode_cell({ r: row, c: col });
        sheet[cellRef] = { t: 's', v: value };
    };

    // Ensure status column exists
    if (statusColIdx === -1) {
        statusColIdx = headers.length;
        headers.push('status');
        updateCell(0, statusColIdx, 'status'); // Add header
    }
    updateCell(targetRowIdx, statusColIdx, newStatus);

    // Handle error log
    if (errorMsg) {
        if (errorColIdx === -1) {
            errorColIdx = headers.length;
            headers.push('error_log');
            updateCell(0, errorColIdx, 'error_log'); // Add header
        }
        updateCell(targetRowIdx, errorColIdx, errorMsg);
    }

    // Update sheet range if we added columns
    const range = xlsx.utils.decode_range(sheet['!ref']);
    if (headers.length - 1 > range.e.c) {
        range.e.c = headers.length - 1;
        sheet['!ref'] = xlsx.utils.encode_range(range);
    }

    xlsx.writeFile(workbook, excelPath);
}

// --- ORCHESTRATOR ---
async function runScheduler() {
    if (isRunning) return;
    isRunning = true;

    try {
        log('SYSTEM', 'Checking for pending jobs...');
        const { workbook, pendingJobs } = loadPendingJobs();

        if (pendingJobs.length === 0) {
            log('SYSTEM', 'No pending jobs found.');
            isRunning = false;
            return;
        }

        log('SYSTEM', `Found ${pendingJobs.length} pending jobs. Processing with concurrency ${MAX_CONCURRENT_WORKERS}...`);

        // Queue Processor
        let activeWorkers = 0;
        let jobIndex = 0;

        while (jobIndex < pendingJobs.length || activeWorkers > 0) {
            // Spawn workers if slots available
            while (activeWorkers < MAX_CONCURRENT_WORKERS && jobIndex < pendingJobs.length) {
                const job = pendingJobs[jobIndex++];
                activeWorkers++;

                processJob(job).then(result => {
                    const status = result.success ? 'published' : 'failed';
                    updateJobStatus(workbook, job.post_id, status, result.error);
                    activeWorkers--;
                });
            }
            
            // Wait a bit before checking slots again to save CPU
            await sleep(500);
        }

    } catch (e) {
        log('CRITICAL', `Scheduler crashed: ${e.message}`);
    } finally {
        isRunning = false;
        log('SYSTEM', 'Batch finished.');
    }
}

module.exports = {
    setExcelPath,
    loadPendingJobs,
    processJob,
    updateJobStatus,
    runScheduler
};

// Start
if (require.main === module) {
    log('SYSTEM', 'Social Manager Scheduler v1.0 Started');
    setInterval(runScheduler, POLL_INTERVAL_MS);
    runScheduler(); // Initial run
}
