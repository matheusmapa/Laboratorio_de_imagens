import { defineConfig } from 'vite';

// ─── Playwright Screenshot API Plugin ───────────────────
// Adds /api/screenshot endpoint that uses real Chrome to capture
// pixel-perfect PNGs of post canvases. Supports ALL CSS features.
let browserInstance = null;

async function getBrowser() {
    if (!browserInstance) {
        const { chromium } = await import('playwright');
        browserInstance = await chromium.launch();
    }
    return browserInstance;
}

function screenshotPlugin() {
    return {
        name: 'playwright-screenshot',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const parsed = new URL(req.url, 'http://localhost');
                if (parsed.pathname !== '/api/screenshot') return next();

                const postFile = parsed.searchParams.get('post');
                const slide = parseInt(parsed.searchParams.get('slide') || '1');
                const w = parseInt(parsed.searchParams.get('w') || '1080');
                const h = parseInt(parsed.searchParams.get('h') || '1350');

                if (!postFile) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: 'Missing "post" param' }));
                    return;
                }

                let context;
                try {
                    const browser = await getBrowser();
                    context = await browser.newContext({
                        deviceScaleFactor: 1,
                        // Use viewport LARGER than canvas so nothing gets clipped
                        viewport: { width: Math.max(w, 1200), height: Math.max(h, 1400) }
                    });
                    const page = await context.newPage();

                    // Get the actual dev server port
                    const addr = server.httpServer?.address();
                    const port = typeof addr === 'object' ? addr?.port : 5173;

                    // Navigate to the universal viewer, passing the post ID
                    await page.goto(`http://localhost:${port}/posts/viewer.html?post=${postFile}`, {
                        waitUntil: 'networkidle'
                    });

                    // Wait for web fonts to fully load
                    await page.evaluate(() => document.fonts.ready);

                    // Extract the canvas OUT of the carousel and place it directly
                    // on the page body at native 1:1 resolution. We must also
                    // keep the injected styles so the CSS works.
                    await page.evaluate(({ slideNum, canvasW, canvasH }) => {
                        const canvas = document.getElementById(`canvas-${slideNum}`);
                        const stylesContainer = document.getElementById('styles-container');

                        if (!canvas) throw new Error(`Canvas #canvas-${slideNum} not found`);

                        // Clone the styles to put them back later
                        const clonedStyles = stylesContainer ? stylesContainer.cloneNode(true) : null;

                        // Hide everything else on the page
                        document.body.innerHTML = '';
                        document.body.style.margin = '0';
                        document.body.style.padding = '0';
                        document.body.style.overflow = 'hidden';
                        document.body.style.background = 'transparent';

                        if (clonedStyles) {
                            document.body.appendChild(clonedStyles);
                        }

                        // Place canvas at native resolution with no transforms
                        canvas.style.transform = 'none';
                        canvas.style.position = 'static';
                        canvas.style.width = canvasW + 'px';
                        canvas.style.height = canvasH + 'px';
                        canvas.style.margin = '0';

                        document.body.appendChild(canvas);
                    }, { slideNum: slide, canvasW: w, canvasH: h });

                    // Let layout settle with real fonts
                    await page.waitForTimeout(500);

                    // Screenshot JUST the canvas element at native resolution
                    const element = page.locator(`#canvas-${slide}`);
                    const screenshot = await element.screenshot({ type: 'png' });

                    res.setHeader('Content-Type', 'image/png');
                    res.setHeader('Content-Disposition',
                        `attachment; filename="${postFile.replace('.html', '')}-slide-${String(slide).padStart(2, '0')}.png"`);
                    res.end(Buffer.from(screenshot));
                } catch (err) {
                    console.error('Screenshot error:', err);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: err.message }));
                } finally {
                    if (context) await context.close();
                }
            });
        }
    };
}

// Cleanup browser on process exit
['exit', 'SIGINT', 'SIGTERM'].forEach(sig => {
    process.on(sig, () => {
        browserInstance?.close().catch(() => { });
        if (sig !== 'exit') process.exit();
    });
});

export default defineConfig({
    plugins: [screenshotPlugin()],
    build: {
        outDir: 'dist',
        assetsInlineLimit: 0,
    },
    server: {
        port: 5173,
        open: true,
    },
});
