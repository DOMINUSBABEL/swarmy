const { runSwarmAttack } = require('./scripts/swarm_attack.js');

const mockBrowser = {
    newPage: async () => ({
        setViewport: async () => {},
        goto: async () => {},
        waitForSelector: async () => {},
        type: async () => {},
        keyboard: { press: async () => {}, type: async () => {} },
        click: async () => {},
        waitForNavigation: async () => {},
        $: async () => true,
    }),
    close: async () => {}
};

const mockPuppeteer = {
    launch: async () => {
        await new Promise(r => setTimeout(r, 50)); // simulate launch delay
        return mockBrowser;
    }
};

const mockXlsx = {
    readFile: () => ({ Sheets: { 'ACCOUNTS': {} } }),
    utils: {
        sheet_to_json: () => ([
            { account_id: 'acc_samuel', username: 'u1', password: 'p1' },
            { account_id: 'acc_mariate', username: 'u2', password: 'p2' },
            { account_id: 'acc_daniel', username: 'u3', password: 'p3' },
            { account_id: 'acc_nguerrero', username: 'u4', password: 'p4' },
            { account_id: 'acc_revistavoces', username: 'u5', password: 'p5' },
        ])
    }
};

async function run() {
    console.time("SwarmAttack");
    // Suppress console output for benchmark
    const originalConsoleLog = console.log;
    console.log = () => {};

    await runSwarmAttack({ puppeteer: mockPuppeteer, xlsx: mockXlsx });

    console.log = originalConsoleLog;
    console.timeEnd("SwarmAttack");
}

run();
