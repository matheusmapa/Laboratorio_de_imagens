import { defineConfig } from 'vite';
import fs from 'fs/promises';
import path from 'path';

// ─── Local CRUD Backend Plugin ──────────────────────────────
// Intercepts API calls to manage posts locally (Fake CMS).
const REGISTRY_PATH = path.resolve(process.cwd(), 'public/posts/registry.json');
const POSTS_DIR = path.resolve(process.cwd(), 'public/posts');

async function readRegistry() {
    try {
        const data = await fs.readFile(REGISTRY_PATH, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function writeRegistry(data) {
    await fs.writeFile(REGISTRY_PATH, JSON.stringify(data, null, 4), 'utf-8');
}

// Auto-cleanup items in trash older than 7 days
async function cleanupTrash(registry) {
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    
    let needsUpdate = false;
    const cleanedRegistry = [];

    for (const post of registry) {
        if (post.deletedAt && (now - new Date(post.deletedAt).getTime() > SEVEN_DAYS)) {
            // Hard delete physically
            const dirPath = path.join(POSTS_DIR, post.id);
            try {
                await fs.rm(dirPath, { recursive: true, force: true });
                console.log(`[CMS] Trashed post ${post.id} auto-deleted (older than 7 days).`);
                needsUpdate = true;
            } catch (err) {
                console.error(`[CMS] Error deleting ${dirPath}:`, err.message);
                cleanedRegistry.push(post); // keep in registry if delete failed
            }
        } else {
            cleanedRegistry.push(post);
        }
    }

    if (needsUpdate) {
        await writeRegistry(cleanedRegistry);
    }
    return cleanedRegistry;
}

// Run cleanup immediately on boot
readRegistry().then(cleanupTrash);

async function resolvePostPath(postId) {
    const root = path.resolve(process.cwd(), 'public/posts');
    const items = await fs.readdir(root, { withFileTypes: true });
    try { if ((await fs.stat(path.join(root, postId))).isDirectory()) return path.join(root, postId); } catch (e) {}
    for (const item of items) {
        if (item.isDirectory() && item.name !== postId && item.name !== 'assets') {
             try { if ((await fs.stat(path.join(root, item.name, postId))).isDirectory()) return path.join(root, item.name, postId); } catch(e){}
        }
    }
    return null;
}

function crudPlugin() {
    return {
        name: 'local-cms-crud',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const parsed = new URL(req.url, 'http://localhost');
                
                if (!parsed.pathname.startsWith('/api/') || req.method !== 'POST') {
                    return next();
                }

                if (['/api/trash', '/api/restore', '/api/delete', '/api/update', '/api/save-html', '/api/resolve-path'].includes(parsed.pathname)) {
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    
                    req.on('end', async () => {
                        try {
                            const payload = JSON.parse(body || '{}');
                            const postId = payload.id;
                            
                            if (!postId && parsed.pathname !== '/api/new') {
                                res.statusCode = 400;
                                return res.end(JSON.stringify({ error: 'Missing post id' }));
                            }

                            if (parsed.pathname === '/api/resolve-path') {
                                const absPath = await resolvePostPath(postId);
                                if (!absPath) {
                                    res.statusCode = 404;
                                    return res.end(JSON.stringify({ error: 'Post physical folder not found' }));
                                }
                                // Convert absolute path to public URL relative path
                                const publicRoot = path.resolve(process.cwd(), 'public');
                                let relPath = absPath.replace(publicRoot, '').replace(/\\/g, '/');
                                return res.end(JSON.stringify({ basePath: relPath }));
                            }

                            let registry = await readRegistry();
                            let postIndex = -1;
                            if (postId) {
                                postIndex = registry.findIndex(p => p.id === postId);
                                if (postIndex === -1 && parsed.pathname !== '/api/new') {
                                    res.statusCode = 404;
                                    return res.end(JSON.stringify({ error: 'Post not found' }));
                                }
                            }

                            if (parsed.pathname === '/api/trash') {
                                registry[postIndex].deletedAt = new Date().toISOString();
                                await writeRegistry(registry);
                                console.log(`[CMS] Post ${postId} moved to trash.`);
                                
                            } else if (parsed.pathname === '/api/restore') {
                                delete registry[postIndex].deletedAt;
                                await writeRegistry(registry);
                                console.log(`[CMS] Post ${postId} restored from trash.`);
                                
                            } else if (parsed.pathname === '/api/delete') {
                                const absPath = await resolvePostPath(postId);
                                if (absPath) {
                                    await fs.rm(absPath, { recursive: true, force: true });
                                    console.log(`[CMS] Post ${postId} PERMANENTLY DELETED.`);
                                }
                                registry = registry.filter(p => p.id !== postId);
                                await writeRegistry(registry);
                                
                            } else if (parsed.pathname === '/api/update') {
                                registry[postIndex] = { ...registry[postIndex], ...payload.data };
                                await writeRegistry(registry);
                                console.log(`[CMS] Post ${postId} updated.`);
                                
                            } else if (parsed.pathname === '/api/save-html') {
                                const slideNum = parseInt(payload.slide);
                                const htmlContent = payload.html;
                                if (!slideNum || !htmlContent) {
                                    res.statusCode = 400;
                                    return res.end(JSON.stringify({ error: 'Missing slide/html content' }));
                                }
                                const absPath = await resolvePostPath(postId);
                                if (!absPath) throw new Error("Folder not found");
                                const slidePath = path.join(absPath, 'slides', `slide-${slideNum}.html`);
                                await fs.writeFile(slidePath, htmlContent, 'utf-8');
                                console.log(`[CMS] Post ${postId} Slide ${slideNum} HTML Overwritten.`);
                            }
                            
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ success: true }));
                            
                        } catch (err) {
                            console.error(`[CMS] API Error:`, err);
                            res.statusCode = 500;
                            res.end(JSON.stringify({ error: err.message }));
                        }
                    });
                } else {
                    next();
                }
            });
        }
    }
}

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
    plugins: [crudPlugin(), screenshotPlugin()],
    build: {
        outDir: 'dist',
        assetsInlineLimit: 0,
    },
    server: {
        port: 5173,
        open: true,
    },
});
