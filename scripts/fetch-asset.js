import fs from 'fs/promises';
import path from 'path';

const [,, url, destPath] = process.argv;

if (!url || !destPath) {
    console.error("Usage: node fetch-asset.js <url> <destPath>");
    process.exit(1);
}

async function run() {
    try {
        console.log(`Downloading: ${url}...`);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        
        const targetDir = path.dirname(destPath);
        await fs.mkdir(targetDir, { recursive: true });

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        await fs.writeFile(destPath, buffer);
        console.log(`Success: Asset downloaded to ${destPath}`);
    } catch (err) {
        console.error(`Error fetching asset: ${err.message}`);
        process.exit(1);
    }
}

run();
