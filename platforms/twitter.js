const puppeteer = require('puppeteer');

// Mock Logger (Local)
const log = (type, msg) => console.log(`[${new Date().toISOString()}] [${type}] ${msg}`);

async function post(account, content_text, options = {}) {
    const { target_url, post_id } = options;

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
        if (target_url) {
            // REPLY / QUOTE Mode
            console.log(`   ↳ Target: ${target_url}`);
            await page.goto(target_url, { waitUntil: 'networkidle2' });
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

        return { success: true };

    } catch (error) {
        // Take screenshot on failure
        if (browser) await browser.pages().then(p => p[0].screenshot({ path: `logs/fail_${post_id || 'unknown'}.png` }));
        throw error;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { post };
