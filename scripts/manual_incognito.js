const puppeteer = require('puppeteer');
const { sleep } = require('../utils');

(async () => {
    console.log("🕵️ Opening Incognito Browser...");
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--incognito', '--no-sandbox', '--disable-setuid-sandbox'] // Incognito mode
    });
    
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    
    await page.goto('https://x.com/i/flow/login', { waitUntil: 'networkidle2' });
    
    console.log("✅ Ready for Manual Login. Waiting 10 minutes...");
    
    // Keep alive
    await sleep(600000);
    
    await browser.close();
})();
