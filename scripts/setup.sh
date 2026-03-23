#!/bin/bash
# ============================================
# OpenPDF Studio — Quick Setup Script
# ============================================
# This script sets up the development environment.
# Run: chmod +x scripts/setup.sh && ./scripts/setup.sh

set -e

echo "================================================"
echo "  OpenPDF Studio - Development Setup"
echo "================================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is required. Install from https://nodejs.org (v18+)"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "ERROR: Node.js 18+ required. Current: $(node -v)"
    exit 1
fi
echo "Node.js: $(node -v)"

# Check pnpm (or install it)
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
fi
echo "pnpm: $(pnpm -v)"

# Install dependencies
echo ""
echo "Installing dependencies..."
pnpm install

echo ""
echo "================================================"
echo "  Setup Complete!"
echo "================================================"
echo ""
echo "Available commands:"
echo "  pnpm dev           - Start web development server"
echo "  pnpm build         - Build for production"
echo "  pnpm tauri:dev     - Start desktop app (requires Rust)"
echo "  pnpm tauri:build   - Build desktop app"
echo "  pnpm mobile:ios    - Run iOS app"
echo "  pnpm mobile:android - Run Android app"
echo ""
echo "Quick start:"
echo "  pnpm dev"
echo "  Then open http://localhost:5173"
echo ""

# Optional: Check for Rust (needed for Tauri desktop)
if command -v rustc &> /dev/null; then
    echo "Rust: $(rustc --version) (Tauri desktop builds enabled)"
else
    echo "NOTE: Rust is not installed."
    echo "  For desktop builds, install Rust: https://rustup.rs"
    echo "  Web development works without Rust."
fi
echo ""
