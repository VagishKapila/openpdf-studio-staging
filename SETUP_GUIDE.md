# OpenPDF Studio - Complete Setup Guide

This guide walks you through setting up the OpenPDF Studio development environment from scratch.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Prerequisites Installation](#prerequisites-installation)
3. [Project Setup](#project-setup)
4. [Development Workflow](#development-workflow)
5. [Building for Distribution](#building-for-distribution)
6. [Code Signing Setup](#code-signing-setup)
7. [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements

- **Node.js**: v18.0 or higher
- **npm**: v9.0 or higher (comes with Node.js)
- **Rust**: Latest stable version
- **RAM**: 2GB minimum, 4GB+ recommended
- **Disk Space**: 2GB free space (including dependencies)

### Operating System Support

- **Windows**: Windows 10 (Build 1903) or Windows 11
- **macOS**: macOS 10.13 (High Sierra) or later
- **Linux**: Most modern distributions (Ubuntu 18.04+, Fedora 30+, Debian 10+)

## Prerequisites Installation

### Step 1: Install Node.js

Download from https://nodejs.org/ (choose LTS version)

**Verify installation:**
```bash
node --version
npm --version
```

### Step 2: Install Rust

Visit https://rustup.rs/ and run the installer:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

After installation, add Rust to your PATH:
```bash
source $HOME/.cargo/env
```

**Verify installation:**
```bash
rustc --version
cargo --version
```

### Step 3: Platform-Specific Dependencies

#### Windows

1. **Install Visual Studio or Build Tools**
   - Option A: Download Visual Studio Community (free)
     - https://visualstudio.microsoft.com/downloads/
     - Select "Desktop development with C++"

   - Option B: Install Visual Studio Build Tools only
     - https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

2. **Install Windows SDK**
   - Usually included with Visual Studio
   - If separate installation needed: https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/

3. **Optional: Install qpdf for PDF encryption**
   ```powershell
   # Using Chocolatey
   choco install qpdf

   # Or download from: https://github.com/qpdf/qpdf/releases
   ```

#### macOS

1. **Install Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```

2. **Install qpdf**
   ```bash
   brew install qpdf
   ```

3. **Ensure proper permissions**
   ```bash
   # Allow Git to work with Xcode
   sudo xcode-select --switch /Library/Developer/CommandLineTools
   ```

#### Linux (Ubuntu/Debian)

1. **Install build essentials and WebKit dependencies**
   ```bash
   sudo apt-get update
   sudo apt-get install -y \
     build-essential \
     curl \
     wget \
     libssl-dev \
     pkg-config \
     libgtk-3-dev \
     libwebkit2gtk-4.0-dev \
     libappindicator3-dev \
     librsvg2-dev \
     patchelf \
     qpdf
   ```

#### Linux (Fedora/RHEL)

```bash
sudo dnf install -y \
  @development-tools \
  gtk3-devel \
  webkit2gtk3-devel \
  libappindicator-gtk3-devel \
  librsvg2-devel \
  qpdf
```

#### Linux (Arch)

```bash
sudo pacman -S --needed \
  base-devel \
  gtk3 \
  webkit2gtk \
  libappindicator-gtk3 \
  librsvg \
  qpdf
```

## Project Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/VagishKapila/openpdf-studio.git
cd openpdf-studio
```

### Step 2: Install Node Dependencies

```bash
npm install
```

This installs all frontend dependencies listed in package.json.

### Step 3: Install Tauri CLI (Global)

```bash
npm install -g @tauri-apps/cli@latest
```

Or use the local version:
```bash
npx tauri --version
```

### Step 4: Verify Setup

Test that everything is working:

```bash
# Check Node
node --version

# Check npm
npm --version

# Check Rust
rustc --version
cargo --version

# Check Tauri
tauri --version

# Check project dependencies
npm list | head -20
```

All should show version numbers without errors.

## Development Workflow

### Development Mode

The fastest way to develop is with hot reload:

```bash
npm run tauri:dev
```

This:
1. Starts the Vite dev server on http://localhost:5173
2. Launches the Tauri app window
3. Enables hot module reloading (HMR)
4. Shows console logs in the app window

**Navigation:**
- Edit files and save → Changes appear instantly
- Check console for any errors
- Restart the app (Ctrl+R or Cmd+R) if needed

### Frontend-Only Development

To work on the UI without launching Tauri:

```bash
npm run dev
```

Then open http://localhost:5173 in your browser.

**Benefits:**
- Faster dev startup
- Browser DevTools work directly
- Standard React debugging

**Limitations:**
- Tauri commands won't work
- Use mock data or API calls instead
- Test with `npm run tauri:dev` before committing

### Building Frontend

```bash
npm run build
```

Output goes to `dist/` directory.

### Linting & Code Quality

```bash
npm run lint
```

Fix automatically fixable issues:
```bash
npm run lint -- --fix
```

## Building for Distribution

### Development Build

```bash
npm run tauri:build
```

Creates unoptimized binaries useful for testing.

**Output locations:**
- Windows: `src-tauri/target/release/bundle/msi/` and `nsis/`
- macOS: `src-tauri/target/release/bundle/macos/`
- Linux: `src-tauri/target/release/bundle/deb/` and `appimage/`

### Production Build (Recommended)

```bash
npm run tauri:build:release
```

Creates optimized, smaller binaries with:
- Tree-shaking
- Code minification
- LTO (Link Time Optimization)
- Compression

**File sizes (typical):**
- Windows MSI: ~80-120MB
- macOS DMG: ~90-130MB
- Linux AppImage: ~70-100MB
- Linux Deb: ~50-80MB

## Code Signing Setup

### Windows Code Signing

**IMPORTANT**: Skip if just testing locally. Required for distribution.

1. **Obtain a certificate**
   - Production: Purchase from DigiCert, Sectigo, or Comodo
   - Testing: Create self-signed certificate

2. **Configure signing**
   - See `src-tauri/SIGNING_SETUP.md` for detailed instructions
   - Update `tauri.conf.json` or set environment variables

3. **Build signed**
   ```bash
   npm run tauri:build:release
   ```

### macOS Code Signing

**Requires Apple Developer account ($99/year)**

1. **Setup Apple Developer**
   - Create account at developer.apple.com
   - Generate signing certificate in Xcode

2. **Configure in Xcode**
   - Xcode → Preferences → Accounts
   - Select your team
   - Manage Certificates

3. **Update tauri.conf.json**
   ```json
   "macOS": {
     "signingIdentity": "Developer ID Application: Your Name"
   }
   ```

4. **Build and notarize**
   ```bash
   npm run tauri:build:release
   # Then notarize the DMG for distribution
   ```

### Linux (No Signing Required)

Linux packages don't require code signing. Simply build:

```bash
npm run tauri:build:release
```

Distribute:
- `.deb` files for Debian/Ubuntu
- `.AppImage` for universal Linux distribution

## Directory Structure

After setup, your project looks like:

```
openpdf-studio/
├── src/                      # React frontend
│   ├── components/           # Reusable components
│   ├── pages/               # Page components
│   ├── utils/               # Helper functions
│   ├── types/               # TypeScript types
│   ├── assets/              # Images, fonts, etc
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── src-tauri/               # Rust backend
│   ├── src/
│   │   ├── main.rs         # Entry point
│   │   ├── lib.rs          # Library code
│   │   └── commands.rs     # Tauri commands
│   ├── icons/              # App icons
│   ├── Cargo.toml          # Rust dependencies
│   ├── build.rs            # Build script
│   ├── tauri.conf.json     # Tauri config
│   ├── entitlements.plist  # macOS entitlements
│   └── SIGNING_SETUP.md    # Signing guide
├── dist/                    # Built frontend (generated)
├── vite.config.ts          # Vite config
├── tsconfig.json           # TypeScript config
├── package.json            # Node dependencies
├── README.md               # Main documentation
└── SETUP_GUIDE.md          # This file
```

## Environment Variables

Create a `.env.local` file for local development:

```env
# API endpoints (if any)
VITE_API_URL=http://localhost:3000
VITE_ENV=development

# Optional
VITE_DEBUG=true
```

For code signing (if needed):
```env
# Windows
CODESIGN_CERT_THUMBPRINT=your_thumbprint_here

# macOS
APPLE_CERTIFICATE=/path/to/certificate.p8
APPLE_CERTIFICATE_PASSWORD=your_password
APPLE_SIGNING_IDENTITY=Developer ID Application: Your Name

# Linux (usually not needed)
```

## Development Tips

### Hot Reload
- Frontend changes: Automatic (HMR)
- Rust changes: Must rebuild (Ctrl+C, then `npm run tauri:dev`)
- Config changes: Must rebuild

### Debugging

**Frontend (React):**
```bash
# Use browser DevTools when running npm run dev
# Or in Tauri app: right-click → Inspect
```

**Rust (Backend):**
```bash
# Use debug logs
log::debug!("My debug message");
log::info!("My info message");

# Or RUST_LOG environment variable
RUST_LOG=debug npm run tauri:dev
```

**Console Output:**
```bash
# Frontend errors appear in:
# 1. Browser console (when using npm run dev)
# 2. Tauri app console (right-click app window → Inspect)

# Backend errors appear in:
# 1. Terminal/console output
# 2. Tauri app console
```

### Performance Profiling

**Frontend:**
```bash
# Build profiling bundle
npm run build -- --profile default

# Analyze bundle size
npm install -g rollup-plugin-visualizer
```

**Rust:**
```bash
# Compile in release mode
npm run tauri:build:release

# Profile at runtime
RUST_LOG=trace npm run tauri:dev
```

## Common Tasks

### Add a new Tauri command

1. Add function in `src-tauri/src/main.rs`
2. Decorate with `#[tauri::command]`
3. Add to `invoke_handler!` macro
4. Call from React using `invoke('command_name')`

### Add a new npm dependency

```bash
npm install package-name

# Or as dev dependency
npm install --save-dev package-name

# Or specific version
npm install package-name@1.2.3
```

### Add a new React page

1. Create file in `src/pages/MyPage.tsx`
2. Import in router configuration
3. Add route in App.tsx

### Update dependencies

```bash
# Check for updates
npm outdated

# Update all
npm update

# Update specific package
npm install package@latest
```

## Troubleshooting

### "command not found: cargo"

**Solution**: Cargo isn't in your PATH
```bash
# Reinstall Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Or add to PATH manually
export PATH="$HOME/.cargo/bin:$PATH"
```

### "Cannot find module '@tauri-apps/api'"

**Solution**: Dependencies not installed
```bash
npm install
```

### WebKit not found (Linux)

**Solution**: Install dev dependencies
```bash
# Ubuntu/Debian
sudo apt-get install libwebkit2gtk-4.0-dev

# Fedora
sudo dnf install webkit2gtk3-devel
```

### Code signing certificate not found (Windows)

**Solution**: See `src-tauri/SIGNING_SETUP.md`

### "qpdf not found" when building

**Solution**: Install qpdf system package
```bash
# macOS
brew install qpdf

# Linux
sudo apt-get install qpdf

# Windows
choco install qpdf
```

### Application won't start

**Solution**: Check console logs
```bash
# Frontend errors
right-click app window → Inspect

# Rust panics
RUST_LOG=debug npm run tauri:dev

# Check file permissions
ls -la src-tauri/target/release/
```

## Getting Help

- **Documentation**: See README.md
- **Tauri Docs**: https://tauri.app/
- **Issues**: https://github.com/VagishKapila/openpdf-studio/issues
- **Discussions**: https://github.com/VagishKapila/openpdf-studio/discussions

## Next Steps

1. Run `npm run tauri:dev` to start developing
2. Open `src/App.tsx` to start editing the UI
3. Check `src-tauri/src/main.rs` for backend commands
4. Read individual file READMEs for more details

Happy coding! 🚀
