#!/usr/bin/env node
/**
 * Simple build script for OpenPDF Studio.
 * Copies standalone HTML files (which use CDN-loaded libraries) to dist/.
 * This is used by Tauri's beforeBuildCommand to prepare the frontend.
 */

import { mkdirSync, cpSync, existsSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');

// Clean dist
if (existsSync(dist)) {
  rmSync(dist, { recursive: true });
}
mkdirSync(dist, { recursive: true });

// Copy all src files to dist
cpSync(resolve(root, 'src'), dist, { recursive: true });

// Copy the landing page as a fallback index if it exists
const publicIndex = resolve(root, 'public/index.html');
const distIndex = resolve(dist, 'index.html');
if (existsSync(publicIndex) && !existsSync(distIndex)) {
  cpSync(publicIndex, distIndex);
}

console.log('✅ Build complete — files copied to dist/');
console.log('   - index.html (PDF Editor)');
console.log('   - smart-ocr-editor.html (OCR Editor)');
console.log('   - image-editor.html (Image Editor)');
console.log('   - analytics.js');
