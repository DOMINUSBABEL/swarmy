const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { DateTime } = require('luxon');

// Config
const EXCEL_PATH = path.join(__dirname, 'Master_Social_Creds.xlsx');
const MAX_CONCURRENT_WORKERS = 3; // Adjust based on RAM (approx 500MB per browser)
const POLL_INTERVAL_MS = 60 * 1000; // Check every minute

// State
let isRunning = false;

// Mock Logger
const log = (type, msg) => console.log(`[${new Date().toISOString()}] [${type}] ${msg}`);

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- CORE: Load Data ---
function loadPendingJobs() {
    if (!fs.existsSync(EXCEL_PATH)) {
        log('ERROR', 'Excel file not found.');
        return [];
    }

    const workbook = xlsx.readFile(EXCEL_PATH);
    
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
    const data = xlsx.utils.sheet_to_json(sheet);
    
    const rowIndex = data.findIndex(row => row.post_id === postId);
    if (rowIndex === -1) return;

    // Direct cell update (simplest for xlsx lib without keeping strict format, 
    // real impl might need to read/write carefully to preserve formulas if any)
    // Here we just update the JSON and rewrite the sheet.
    
    data[rowIndex].status = newStatus;
    if (errorMsg) data[rowIndex].error_log = errorMsg; // Add error column if needed

    const newSheet = xlsx.utils.json_to_sheet(data);
    workbook.Sheets['CALENDAR'] = newSheet;
    xlsx.writeFile(workbook, EXCEL_PATH);
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

// Start
log('SYSTEM', 'Social Manager Scheduler v1.0 Started');
setInterval(runScheduler, POLL_INTERVAL_MS);
runScheduler(); // Initial run
