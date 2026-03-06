const { chromium } = require('playwright');
const path = require('path');

(async () => {
    try {
        const browser = await chromium.launch();
        const context = await browser.newContext({ acceptDownloads: true });
        const page = await context.newPage();

        console.log("Navigating...");
        await page.goto('http://localhost:5173/posts/001-post-exemplo.html', { waitUntil: 'load' });
        await page.waitForTimeout(1000);

        console.log("Clicking download...");
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
        await page.click('#btn-download-current');

        const download = await downloadPromise;
        const outPath = path.join(__dirname, 'test-download.png');
        await download.saveAs(outPath);

        console.log("SUCCESS_SAVED:", outPath);
        await browser.close();
    } catch (e) {
        console.error("ERROR:", e);
        process.exit(1);
    }
})();
