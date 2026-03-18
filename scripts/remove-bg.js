import fs from 'fs/promises';
import path from 'path';
import { removeBackground } from '@imgly/background-removal-node';

const [,, inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
    console.error("Usage: node remove-bg.js <inputPath> <outputPath>");
    process.exit(1);
}

async function run() {
    try {
        console.log(`Removing background from: ${inputPath}...`);
        
        // Resolve absolute paths
        const absInput = path.resolve(inputPath);
        const absOutput = path.resolve(outputPath);

        // Imgly expects a file URL string
        const fileUrl = `file://${absInput.replace(/\\/g, '/')}`;
        
        const imageBlob = await removeBackground(fileUrl);
        
        const arrayBuffer = await imageBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const targetDir = path.dirname(absOutput);
        await fs.mkdir(targetDir, { recursive: true });
        
        await fs.writeFile(absOutput, buffer);
        console.log(`Success: Background removed and saved to ${absOutput}`);
    } catch (err) {
        console.error(`Error removing background: ${err.message}`);
        process.exit(1);
    }
}

run();
