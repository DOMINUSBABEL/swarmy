const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { DateTime } = require('luxon');
const puppeteer = require('puppeteer');
const TWITTER_SELECTORS = require('./twitter_selectors.js');

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
function loadPendingJobs(deps = {}) {
    const { fsLib = fs, xlsxLib = xlsx } = deps;

    if (!fsLib.existsSync(EXCEL_PATH)) {
        log('ERROR', 'Excel file not found.');
        return { workbook: null, pendingJobs: [] };
    }

    const workbook = xlsxLib.readFile(EXCEL_PATH);
    
    // Read Accounts
    const accountsSheet = workbook.Sheets['ACCOUNTS'];
    const accounts = xlsxLib.utils.sheet_to_json(accountsSheet);
    const activeAccounts = accounts.filter(a => a.status === 'active');
    const accountMap = new Map(activeAccounts.map(a => [a.account_id, a]));

    // Read Calendar
    const calendarSheet = workbook.Sheets['CALENDAR'];
    const posts = xlsxLib.utils.sheet_to_json(calendarSheet);

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

async function processJob(job, puppeteerLib = puppeteer) {
    const { post_id, account, content_text } = job;
    log('INFO', `Starting Job: ${post_id} for ${account.username}`);

    let browser;
    try {
        browser = await puppeteerLib.launch({
            headless: false, // Visible for now
        });
        const page = await browser.newPage();
        
        // 1. LOGIN (Super Safe Mode)
        // Go to Home and let Human do everything
        await page.goto('https://x.com/', { waitUntil: 'networkidle2' });
        
        log('SYSTEM', '🛑 WAITING FOR HUMAN LOGIN AT x.com... (Please login manually)');
        
        // Wait until we see the "Post" composer or Home timeline
        // Selector for "Post" button in sidebar: [data-testid="SideNav_NewTweet_Button"]
        try {
            await page.waitForSelector(TWITTER_SELECTORS.SIDE_NAV_NEW_TWEET_BUTTON, { timeout: 600000 }); // 10 minutes wait
            log('SYSTEM', '✅ Login detected! Taking control.');
        } catch(e) {
            log('ERROR', 'Login timeout. Moving to next.');
            throw new Error('Login Timeout');
        }

        // 2. ACTION LOGIC
        if (job.target_url) {
            // REPLY / QUOTE Mode
            console.log(`   ↳ Target: ${job.target_url}`);
            await page.goto(job.target_url, { waitUntil: 'networkidle2' });
            await new Promise(r => setTimeout(r, 2000));

            // Click Reply (Simplest integration)
            // Selector for Reply icon often in [data-testid="reply"]
            await page.click(TWITTER_SELECTORS.REPLY_BUTTON);
            await new Promise(r => setTimeout(r, 1000));
            
            await page.keyboard.type(content_text);
            await new Promise(r => setTimeout(r, 500));
            
            await page.click(TWITTER_SELECTORS.TWEET_BUTTON);
        } else {
            // NEW POST Mode
            await page.click(TWITTER_SELECTORS.POST_ARIA_LABEL, { timeout: 5000 }).catch(() => page.goto('https://twitter.com/compose/tweet'));
            await new Promise(r => setTimeout(r, 2000));
            
            await page.keyboard.type(content_text);
            await new Promise(r => setTimeout(r, 1000));
            
            await page.click(TWITTER_SELECTORS.TWEET_BUTTON);
        }
        await new Promise(r => setTimeout(r, 5000)); // Wait for send

        log('SUCCESS', `Posted: ${content_text.substring(0, 20)}...`);

        // 3. FOLLOW TRAIN
        const SQUAD = ['Samuel_MendozCD', 'mariatemonto', 'Daniel_VargasCc', 'NGuerrero16814', 'RevistavocesD', 'moreno_cam73152', 'concejo38265', 'Luigialvarez02'];
        for (const handle of SQUAD) {
            if (handle.toLowerCase() === account.username.toLowerCase()) continue;
            try {
                await page.goto(`https://twitter.com/${handle}`, { waitUntil: 'networkidle2' });
                const [followBtn] = await page.$x(TWITTER_SELECTORS.FOLLOW_BUTTON_XPATH);
                if (followBtn) {
                    const label = await page.evaluate(el => el.getAttribute('aria-label'), followBtn);
                    if (!label.includes('Following') && !label.includes('Siguiendo')) {
                         await followBtn.click();
                         log('INFO', `Followed: @${handle}`);
                         await new Promise(r => setTimeout(r, 1000));
                    }
                }
            } catch(e) {}
        }

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
function updateJobStatus(workbook, postId, newStatus, errorMsg = '', deps = {}) {
    const { xlsxLib = xlsx } = deps;
    const sheet = workbook.Sheets['CALENDAR'];
    const data = xlsxLib.utils.sheet_to_json(sheet);
    
    const rowIndex = data.findIndex(row => row.post_id === postId);
    if (rowIndex === -1) return;

    data[rowIndex].status = newStatus;
    if (errorMsg) data[rowIndex].error_log = errorMsg;

    const newSheet = xlsxLib.utils.json_to_sheet(data);
    workbook.Sheets['CALENDAR'] = newSheet;
}

function saveWorkbook(workbook, deps = {}) {
    const { xlsxLib = xlsx } = deps;
    // RETRY LOGIC FOR EXCEL WRITE
    let attempts = 0;
    while (attempts < 5) {
        try {
            xlsxLib.writeFile(workbook, EXCEL_PATH);
            break; // Success
        } catch (e) {
            if (e.code === 'EBUSY') {
                attempts++;
                // Synchronous sleep hack for simple retry
                const start = Date.now();
                while (Date.now() - start < 1000) {} 
            } else {
                throw e; // Other error
            }
        }
    }
}

// --- ORCHESTRATOR ---
async function runScheduler(deps = {}) {
    const { fsLib = fs, xlsxLib = xlsx, puppeteerLib = puppeteer, processJobFn = processJob } = deps;
    if (isRunning) return;
    isRunning = true;

    try {
        log('SYSTEM', 'Checking for pending jobs...');
        const { workbook, pendingJobs } = loadPendingJobs({ fsLib, xlsxLib });

        if (!pendingJobs || pendingJobs.length === 0) {
            log('SYSTEM', 'No pending jobs found.');
            isRunning = false;
            return;
        }

        log('SYSTEM', `Found ${pendingJobs.length} pending jobs. Processing with concurrency ${MAX_CONCURRENT_WORKERS}...`);

        // Queue Processor
        const queue = [...pendingJobs];
        const workers = Array.from({ length: Math.min(MAX_CONCURRENT_WORKERS, queue.length) }, async () => {
            while (queue.length > 0) {
                const job = queue.shift();
                const result = await processJobFn(job, puppeteerLib);
                const status = result.success ? 'published' : 'failed';
                updateJobStatus(workbook, job.post_id, status, result.error, { xlsxLib });
            }
        });

        await Promise.all(workers);

        // Save batch once
        saveWorkbook(workbook, { xlsxLib });

    } catch (e) {
        log('CRITICAL', `Scheduler crashed: ${e.message}`);
    } finally {
        isRunning = false;
        log('SYSTEM', 'Batch finished.');
    }
}

module.exports = { processJob, runScheduler, loadPendingJobs, updateJobStatus };

if (require.main === module) {
    // Start
    log('SYSTEM', 'Social Manager Scheduler v1.0 Started');
    setInterval(runScheduler, POLL_INTERVAL_MS);
    runScheduler(); // Initial run
}
