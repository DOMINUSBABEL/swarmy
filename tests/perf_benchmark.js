const { performance } = require('perf_hooks');

// Configuration
const JOBS_COUNT = 5;
const LAUNCH_DELAY = 500;
const CREATE_CONTEXT_DELAY = 10;
const NEW_PAGE_DELAY = 50;

// Mock Puppeteer
const mockPuppeteer = {
    launch: async () => {
        await new Promise(r => setTimeout(r, LAUNCH_DELAY));
        return {
            createBrowserContext: async () => {
                await new Promise(r => setTimeout(r, CREATE_CONTEXT_DELAY));
                return {
                    newPage: async () => { await new Promise(r => setTimeout(r, NEW_PAGE_DELAY)); return { close: async () => {} }; },
                    close: async () => {}
                };
            },
            newPage: async () => {
                await new Promise(r => setTimeout(r, NEW_PAGE_DELAY));
                return { close: async () => {} };
            },
            close: async () => {}
        };
    }
};

async function runBaseline() {
    console.log('--- Baseline: Launch Browser Per Job ---');
    const start = performance.now();

    for (let i = 0; i < JOBS_COUNT; i++) {
        const browser = await mockPuppeteer.launch();
        const page = await browser.newPage();
        // Simulate work
        await page.close();
        await browser.close();
    }

    const end = performance.now();
    console.log(`Total Time: ${(end - start).toFixed(2)}ms`);
    return end - start;
}

async function runOptimized() {
    console.log('--- Optimized: Reuse Browser + Contexts ---');
    const start = performance.now();

    const browser = await mockPuppeteer.launch();

    for (let i = 0; i < JOBS_COUNT; i++) {
        const context = await browser.createBrowserContext();
        const page = await context.newPage();
        // Simulate work
        await page.close();
        await context.close();
    }

    await browser.close();

    const end = performance.now();
    console.log(`Total Time: ${(end - start).toFixed(2)}ms`);
    return end - start;
}

(async () => {
    const baseline = await runBaseline();
    const optimized = await runOptimized();
    const improvement = ((baseline - optimized) / baseline * 100).toFixed(2);
    console.log(`\nPerformance Improvement: ${improvement}%`);
})();
