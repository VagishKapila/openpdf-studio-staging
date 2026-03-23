#!/usr/bin/env node
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

const outputPath = path.resolve(path.dirname(import.meta.url.replace('file://', '')), '../app-icon.png');

// Create SVG with the icon design
const svgImage = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Rounded square background -->
  <rect width="1024" height="1024" rx="200" ry="200" fill="url(#bgGradient)"/>

  <!-- Document shape with rounded corners -->
  <g transform="translate(362, 312)">
    <!-- Main document rectangle -->
    <rect width="300" height="400" rx="20" ry="20" fill="white"/>

    <!-- Crimson fold corner (top-right) -->
    <polygon points="300,0 300,60 240,0" fill="#DC143C"/>

    <!-- Fold line accent -->
    <line x1="240" y1="0" x2="240" y2="60" stroke="#DC143C" stroke-width="3"/>
    <line x1="240" y1="60" x2="300" y2="60" stroke="#DC143C" stroke-width="3"/>

    <!-- PDF text in center -->
    <text x="150" y="210" font-size="120" font-weight="bold" font-family="Arial, sans-serif"
          text-anchor="middle" fill="#1a1a2e">PDF</text>

    <!-- Decorative lines to suggest document content -->
    <line x1="40" y1="280" x2="260" y2="280" stroke="#e0e0e0" stroke-width="8" stroke-linecap="round"/>
    <line x1="40" y1="320" x2="260" y2="320" stroke="#e0e0e0" stroke-width="8" stroke-linecap="round"/>
    <line x1="40" y1="360" x2="200" y2="360" stroke="#e0e0e0" stroke-width="8" stroke-linecap="round"/>
  </g>
</svg>
`;

// Convert SVG to PNG using sharp
sharp(Buffer.from(svgImage))
  .png()
  .toFile(outputPath)
  .then(info => {
    console.log(`Icon generated successfully at ${outputPath}`);
    console.log(`File size: ${info.size} bytes`);
  })
  .catch(err => {
    console.error('Error generating icon:', err);
    process.exit(1);
  });
