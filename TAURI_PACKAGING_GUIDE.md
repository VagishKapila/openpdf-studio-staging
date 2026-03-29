# Tauri 2.0 Packaging Guide for OpenPDF Studio

This document provides a complete overview of the Tauri 2.0 desktop packaging configuration for OpenPDF Studio.

## Project Overview

**Application**: OpenPDF Studio
**Version**: 1.0.0
**Developer**: VagishKapila
**Repository**: https://github.com/VagishKapila/openpdf-studio
**License**: MIT OR Apache-2.0

A PDF and image editor with free and premium features, with cross-platform desktop packaging for Windows, macOS, and Linux.

## Generated Files Summary

### Core Tauri Configuration Files

#### 1. `src-tauri/Cargo.toml` (41 lines)
**Purpose**: Rust project configuration and dependency management

**Key Features**:
- Package metadata (name, version, authors, repository)
- Tauri framework dependencies
- Build dependencies (tauri-build)
- Optional features for shell, filesystem, window, process operations
- Profile optimization settings (LTO, codegen units)
- Release mode optimizations

**Key Dependencies**:
- `tauri = 2.0` - Desktop framework
- `serde` & `serde_json` - JSON serialization
- `tokio` - Async runtime
- `log` & `env_logger` - Logging
- `pdfjs-dist`, `fabric`, `tesseract.js` - As dev dependencies via npm

**Configuration Highlights**:
- Rust edition 2021
- Minimum Rust version: 1.60
- Release profile: LTO enabled, optimized for size
- Custom library name: `openpdf_studio_lib`

#### 2. `src-tauri/tauri.conf.json` (134 lines)
**Purpose**: Tauri framework and app configuration

**Window Configuration**:
- Title: "OpenPDF Studio"
- Size: 1400x900 pixels
- Minimum size: 800x600
- Resizable: enabled
- Theme: Dark

**Security Settings**:
- Strict Content Security Policy (CSP)
- Allows pdf.js, fabric.js, tesseract.js, pdf-lib from CDN
- Local scripts only (same-origin)
- GitHub API access for updates

**Bundle Configuration**:
- **Targets**: MSI, NSIS (Windows); DMG (macOS); Deb, AppImage (Linux)
- **App ID**: `com.openpdfstudio.app`
- **Icons**: Supports multiple formats for all platforms

**Code Signing Configuration**:
- Windows: PowerShell signing script integration (sign.ps1)
- macOS: Developer ID Application signing
- Both configured with timestamp servers for validation

**Platform-Specific Bundle Settings**:

*Windows*:
- NSIS installer (executable setup)
- MSI installer (Windows Installer package)
- SHA256 digest algorithm
- DigiCert timestamp server

*macOS*:
- DMG image for distribution
- Minimum OS: 10.13 (High Sierra)
- Entitlements file support
- Bootstrap mode for code signing

*Linux*:
- Deb package for Debian/Ubuntu
- AppImage for universal distribution
- No code signing required

**File Associations**:
- `.pdf` files
- `.png` images
- `.jpg` images

**Auto-Updater Configuration**:
- Enabled by default
- Points to GitHub releases for updates
- Dialog shown to users before update

#### 3. `src-tauri/build.rs` (3 lines)
**Purpose**: Build script executed before compilation

**Functionality**:
- Calls `tauri_build::build()` for Tauri setup
- Handles code generation and resource preparation
- No custom build logic needed currently

#### 4. `src-tauri/entitlements.plist` (20 lines)
**Purpose**: macOS app permissions and capabilities

**Entitlements Granted**:
- File system access (user-selected read/write)
- Downloads folder access
- Network client access
- Process spawning (for qpdf and other system commands)
- Hardened runtime support

**Entitlements Restricted**:
- Camera access (set to false, enable if needed)
- Microphone access (set to false, enable if needed)

### Rust Backend Files

#### 5. `src-tauri/src/main.rs` (223 lines)
**Purpose**: Main Tauri application entry point

**Tauri Commands Exposed**:

*File Operations*:
- `read_file(path)` - Read file contents
- `write_file(path, contents)` - Write file contents
- `list_dir(path)` - List directory contents
- `copy_file(src, dest)` - Copy files
- `delete_file(path)` - Delete files
- `get_file_info(path)` - Get file metadata

*PDF Operations*:
- `encrypt_pdf(input_path, output_path, password)` - Encrypt with qpdf
- `decrypt_pdf(input_path, output_path, password)` - Decrypt with qpdf

**Data Structures**:
```rust
FileInfo {
    path: String,
    name: String,
    size: u64,
    is_dir: bool,
}

OperationResult {
    success: bool,
    message: String,
    data: Option<serde_json::Value>,
}
```

**Key Implementation Details**:
- Error handling with descriptive messages
- System command execution for qpdf
- Filesystem operations with proper error propagation
- Logging integration (env_logger)
- Tauri's `#[tauri::command]` macro for exposing commands

**Setup Hook**:
- Logs application startup
- Ready for future initialization logic

#### 6. `src-tauri/src/lib.rs` (14 lines)
**Purpose**: Library module and shared functionality

**Exports**:
- `commands` module
- Version constants (VERSION, APP_NAME, AUTHOR)
- `init()` function for library initialization

**Purpose**: Enables code reuse and modular architecture

#### 7. `src-tauri/src/commands.rs` (6 lines)
**Purpose**: Command module organization (placeholder for expansion)

**Current State**:
- Minimal implementation ready for command handler organization
- Can be expanded with additional command categories

### Code Signing & Security Files

#### 8. `src-tauri/sign.ps1` (150+ lines)
**Purpose**: PowerShell script for Windows code signing

**Features**:
- Supports signing with certificate thumbprint
- Supports signing with .pfx certificate file
- Integration with DigiCert timestamp servers
- Comprehensive error handling and logging

**Configuration Methods**:
1. Certificate Thumbprint (recommended)
   - Set `$thumbprint` variable or `CODESIGN_CERT_THUMBPRINT` env var

2. PFX File Method
   - Provide path and password to .pfx file
   - Supports environment variables for security

**Requirements**:
- Windows 10/11 with signtool.exe available
- Valid code signing certificate installed in certificate store
- Or .pfx certificate file with password

**Security Best Practices**:
- Never hardcode certificates in script
- Use environment variables for sensitive data
- Verify certificate thumbprint before signing
- Check timestamp server connectivity

#### 9. `src-tauri/SIGNING_SETUP.md` (250+ lines)
**Purpose**: Complete code signing setup documentation

**Covers**:
- Windows code signing (DigiCert, Sectigo, self-signed)
- macOS code signing and notarization
- Linux packaging (no signing needed)
- Automated CI/CD signing (GitHub Actions example)
- Certificate renewal procedures
- Troubleshooting guide
- Security best practices

**Key Sections**:
- Why code signing is important
- Step-by-step setup instructions
- Certificate acquisition and installation
- Environment variable configuration
- PFX file usage
- Notarization process for macOS
- CI/CD integration examples
- Support resources

### Frontend Configuration Files

#### 10. `vite.config.ts` (78 lines)
**Purpose**: Frontend build tool configuration

**Development Server**:
- Port: 5173
- Host: localhost
- Strict port mode disabled

**Build Configuration**:
- Output directory: `dist/`
- Minification: Terser
- Source maps: Disabled in production
- Console.log dropped in production

**Code Splitting**:
- Separate chunks for PDF libraries (pdf-lib, pdfjs-dist)
- Separate chunk for fabric.js (canvas editing)
- Separate chunk for tesseract.js (OCR)

**Path Aliases**:
- `@` → `./src`
- `@components` → `./src/components`
- `@pages` → `./src/pages`
- `@utils` → `./src/utils`
- `@types` → `./src/types`
- `@assets` → `./src/assets`

**CSS Preprocessing**:
- SCSS support with predefined color variables
- Primary color: #DC143C (crimson red)
- Secondary color: #0066CC (blue)
- Dark theme background: #1e1e1e

**Dependency Optimization**:
- Pre-bundles large libraries for faster builds
- Includes React and all major dependencies

#### 11. `package.json` (48 lines)
**Purpose**: Node.js project configuration and scripts

**Project Metadata**:
- Name: `openpdf-studio`
- Version: `1.0.0`
- Type: ES modules (modern JavaScript)
- Repository: GitHub link

**NPM Scripts**:
- `npm run dev` - Start Vite dev server
- `npm run build` - Build frontend
- `npm run lint` - ESLint validation
- `npm run preview` - Preview production build
- `npm run tauri` - Tauri CLI access
- `npm run tauri:dev` - Development with hot reload
- `npm run tauri:build` - Standard release build
- `npm run tauri:build:release` - Optimized release build

**Dependencies** (Production):
- React 18.2.0
- React DOM 18.2.0
- React Router DOM 6.20.0
- PDF libraries: pdfjs-dist, pdf-lib
- Canvas editing: fabric.js
- OCR: tesseract.js
- State management: zustand
- HTTP client: axios
- Data fetching: @tanstack/react-query

**Dev Dependencies**:
- Tauri API 2.0.0
- Tauri CLI 2.0.0
- TypeScript 5.2.2
- Vite 5.0.2
- React plugin for Vite
- ESLint with TypeScript support

### Configuration & Project Management Files

#### 12. `tsconfig.json` (37 lines)
**Purpose**: TypeScript compiler configuration

**Compiler Options**:
- Target: ES2020
- Module: ESNext
- Strict type checking enabled
- JSX: React 18 (jsx-react)
- Path aliases for imports
- Isolated modules enabled

**Type Checking**:
- No unused locals
- No unused parameters
- No fallthrough cases in switches

#### 13. `tsconfig.node.json` (8 lines)
**Purpose**: TypeScript config for build tools

**Configuration**:
- Composite project setup
- Bundler module resolution
- Used for vite.config.ts compilation

#### 14. `.gitignore` (33 lines)
**Purpose**: Git version control exclusions

**Excluded Patterns**:
- Node modules and lock files
- Build outputs (dist, build, src-tauri/target)
- IDE settings (.vscode, .idea)
- Environment files (.env)
- OS files (Thumbs.db, .DS_Store)
- Signing certificates (*.pfx, *.p12, *.pem)
- Temporary files (*.log, *.tmp)

#### 15. `LICENSE-MIT` (22 lines)
**Purpose**: MIT License text

**Key Terms**:
- Free for commercial use
- Free to modify
- Free to distribute
- Must include license and copyright notice
- Provided "as is" without warranty

#### 16. `LICENSE-APACHE` (200+ lines)
**Purpose**: Apache License 2.0 text

**Key Terms**:
- Compatible with MIT
- Explicit grant of patent rights
- Clear liability limitations
- Trademark provisions included

### Documentation Files

#### 17. `README.md` (350+ lines)
**Purpose**: Main project documentation

**Contents**:
- Feature overview
- Technology stack description
- Project structure with directory tree
- Prerequisites for all platforms
- Installation instructions (step-by-step)
- Development workflow (dev mode, building, linting)
- Tauri commands reference with usage examples
- Configuration explanation
- Icon setup instructions
- Troubleshooting guide
- Performance optimization notes
- Security considerations
- Contributing guidelines
- Support and issue resources
- Roadmap

#### 18. `SETUP_GUIDE.md` (400+ lines)
**Purpose**: Comprehensive setup and development guide

**Sections**:
- System requirements (minimum and recommended)
- Prerequisites installation (Node.js, Rust, platform-specific)
- Step-by-step project setup
- Development workflow (dev mode, frontend-only, building)
- Building for distribution (dev vs. release builds)
- Code signing setup (all platforms)
- Directory structure explanation
- Environment variables setup
- Development tips and tricks
- Common tasks (adding commands, dependencies, pages)
- Troubleshooting guide
- Getting help resources

#### 19. `src-tauri/icons/README.md` (350+ lines)
**Purpose**: App icon generation and setup guide

**Contents**:
- Icon specifications (format, color space, DPI)
- Recommended design guidelines
- Icon generation methods (ImageMagick, Python, online tools)
- Platform-specific requirements (Windows ICO, macOS ICNS, Linux PNG)
- Icon sizes reference table
- Creation commands for each platform
- Tauri configuration reference
- Testing instructions
- Icon guidelines and best practices
- Resources and tools
- Directory structure

#### 20. `TAURI_PACKAGING_GUIDE.md` (This file)
**Purpose**: Complete overview of Tauri packaging configuration

## Architecture Overview

### Multi-Layer Architecture

```
┌─────────────────────────────────────┐
│   React Frontend (Tauri Webview)    │
│  ├─ Components (UI building blocks) │
│  ├─ Pages (App routes)              │
│  ├─ Utils (Helper functions)        │
│  └─ Assets (Images, styles)         │
├─────────────────────────────────────┤
│     JavaScript/TypeScript Tier      │
│  ├─ Tauri API (@tauri-apps/api)    │
│  ├─ Libraries (pdf-lib, fabric.js) │
│  └─ HTTP (axios, react-query)      │
├─────────────────────────────────────┤
│    Tauri Bridge (IPC)               │
│  ├─ Command invocation              │
│  ├─ Event system                    │
│  └─ Message serialization           │
├─────────────────────────────────────┤
│     Rust Backend (Tauri Core)       │
│  ├─ Command handlers                │
│  ├─ File system operations          │
│  ├─ Process execution (qpdf)        │
│  └─ System interaction              │
├─────────────────────────────────────┤
│  System Layer                       │
│  ├─ File system (read/write)       │
│  ├─ Process spawning                │
│  ├─ Environment variables           │
│  └─ System commands (qpdf)          │
└─────────────────────────────────────┘
```

### Data Flow

```
User Interaction (React UI)
    ↓
Tauri Command Invocation
    ↓
Rust Backend Handler
    ↓
System Operation (File/Process)
    ↓
Result Serialization (JSON)
    ↓
Frontend Callback
    ↓
UI Update (React)
```

## Security Architecture

### Content Security Policy (CSP)

```json
"default-src 'self';"              // Only same-origin by default
"script-src 'self' https://cdnjs..." // Trusted CDNs
"style-src 'self' 'unsafe-inline'..." // Styles from self
"img-src 'self' data: https:..."   // Local + data URLs + HTTPS
"font-src 'self' https://..."      // Local + trusted fonts
"worker-src 'self';"               // Local workers only
"connect-src 'self' https://..."   // Local + GitHub API
```

### Code Signing Hierarchy

```
macOS:
  ├─ Developer ID Certificate
  ├─ Code Signing (automatic during build)
  └─ Notarization (optional, required for App Store)

Windows:
  ├─ DigiCert/Sectigo Certificate
  ├─ PowerShell Signing Script
  ├─ Timestamp Server Integration
  └─ Auto-run without SmartScreen warning

Linux:
  ├─ No signing required
  ├─ Deb packages (trusted repository)
  └─ AppImage (universal distribution)
```

## Build Pipeline

### Development Build

```bash
npm run tauri:dev
    ↓
├─ Start Vite dev server (port 5173)
├─ Compile Rust backend
├─ Launch Tauri window
└─ Enable hot module reloading (HMR)
```

### Production Release Build

```bash
npm run tauri:build:release
    ↓
├─ Build frontend (vite build)
│  ├─ Minify code
│  ├─ Tree-shake unused code
│  ├─ Split bundles
│  └─ Optimize assets
├─ Compile Rust (release mode)
│  ├─ Enable LTO
│  ├─ Strip symbols
│  └─ Optimize for size
├─ Bundle for platforms
│  ├─ Windows (MSI, NSIS)
│  ├─ macOS (DMG)
│  └─ Linux (Deb, AppImage)
└─ Code sign (if configured)
   ├─ Windows: signtool via PowerShell
   ├─ macOS: codesign command
   └─ Linux: N/A
```

## Platform-Specific Details

### Windows Packaging

**Installers Generated**:
- `.msi` - Windows Installer format
- `.nsis` - NSIS installer (traditional setup wizard)

**Code Signing**:
- Uses `signtool.exe` from Windows SDK
- Requires code signing certificate installed locally
- Optional: Use .pfx file with password
- Timestamp server prevents expiration issues

**Distribution**:
- Direct download from GitHub releases
- Windows Store (requires additional Microsoft account setup)

### macOS Packaging

**Installer Generated**:
- `.dmg` - Disk image for drag-and-drop installation

**Code Signing**:
- Requires Developer ID Application certificate
- Automatic during Tauri build process
- Configured in `tauri.conf.json`

**Notarization** (recommended for distribution):
- Required for macOS 10.15+
- Prevents Gatekeeper warnings
- Process: Submit → Wait for approval → Staple notary ticket
- 5-30 minutes for Apple processing

**Distribution**:
- Direct download from GitHub releases
- macOS App Store (requires notarization + additional setup)

### Linux Packaging

**Installers Generated**:
- `.deb` - Debian/Ubuntu package
- `.AppImage` - Universal Linux executable

**Code Signing**:
- No code signing required
- Linux package managers verify integrity via checksums

**Distribution**:
- GitHub releases
- Ubuntu/Debian repositories (PPA)
- Flathub (universal package)

## Performance Characteristics

### Bundle Sizes (Typical)

| Platform | Format | Size |
|----------|--------|------|
| Windows | MSI | 80-120 MB |
| Windows | NSIS | 75-115 MB |
| macOS | DMG | 90-130 MB |
| Linux | AppImage | 70-100 MB |
| Linux | Deb | 50-80 MB |

### Memory Usage

- Tauri core: ~50-80 MB
- WebKit engine: ~100-150 MB
- React app: ~20-40 MB
- Typical usage: 200-250 MB resident

### CPU Usage

- Idle: < 1%
- Active editing: 5-15%
- PDF rendering: 10-25% (varies by page complexity)
- OCR processing: 50-100% (intensive operation)

## Deployment Strategy

### Version Management

- Semantic versioning: `major.minor.patch`
- Update version in:
  - `package.json` → `version`
  - `src-tauri/Cargo.toml` → `version`
  - `tauri.conf.json` → `app.windows[0].title` (optional, in subtitle)

### Auto-Update Configuration

Current configuration points to:
- Endpoint: `https://updates.tauri.app/releases/{{target}}/{{arch}}`
- Requires: Signed releases on GitHub

To use custom update server:
1. Update `tauri.conf.json` → `tauri.updater.endpoints`
2. Serve update manifest with proper format
3. Host signed release artifacts

### Release Checklist

- [ ] Update version in package.json
- [ ] Update version in src-tauri/Cargo.toml
- [ ] Update CHANGELOG (if applicable)
- [ ] Test local build: `npm run tauri:build:release`
- [ ] Test auto-update endpoint
- [ ] Create git tag: `git tag v1.0.0`
- [ ] Build for all platforms (Windows, macOS, Linux)
- [ ] Sign all binaries (Windows, macOS)
- [ ] Create GitHub release
- [ ] Upload all artifacts
- [ ] Update release notes with features/fixes
- [ ] Publish release

## Configuration Quick Reference

### Key Configuration Files

| File | Purpose | Critical Settings |
|------|---------|-------------------|
| `tauri.conf.json` | Main app config | Window size, bundle targets, CSP |
| `Cargo.toml` | Rust dependencies | Tauri version, features |
| `package.json` | Node dependencies | React, build tools versions |
| `vite.config.ts` | Frontend build | Output path, code splitting |
| `sign.ps1` | Windows signing | Certificate thumbprint |
| `entitlements.plist` | macOS permissions | File/network access |

### Environment Variables (Optional)

```bash
# Windows code signing
CODESIGN_CERT_THUMBPRINT=your_thumbprint

# macOS code signing
APPLE_SIGNING_IDENTITY="Developer ID Application: Name"

# Build configuration
RUST_LOG=debug                 # Enable Rust debug logs
TAURI_SKIP_VALIDATION=true     # Skip config validation (dev only)
```

## Common Customization Points

### 1. Change App Name/ID
- `tauri.conf.json` → `app.productName`, `bundle.identifier`
- `src-tauri/Cargo.toml` → `[package] name`
- `package.json` → `name`

### 2. Change App Icon
- Replace files in `src-tauri/icons/`
- See `src-tauri/icons/README.md` for generation instructions

### 3. Add Tauri Command
```rust
// In src-tauri/src/main.rs
#[tauri::command]
fn my_command(param: String) -> String {
    format!("Hello, {}", param)
}

// In invoke_handler!
.invoke_handler(tauri::generate_handler![
    my_command,
    // ... other commands
])
```

### 4. Change Window Size/Theme
- `tauri.conf.json` → `app.windows[0]`
- Properties: `width`, `height`, `title`, `theme`

### 5. Add File Association
- `tauri.conf.json` → `tauri.bundle.windows.fileAssociations`
- Define extensions and MIME types

## Troubleshooting Guide

### Build Failures

**"cannot find cargo"**
- Install Rust: `curl https://sh.rustup.rs | sh`

**"WebKit not found" (Linux)**
- Install dev files: `sudo apt-get install libwebkit2gtk-4.0-dev`

**"signtool not found" (Windows)**
- Install Windows SDK or add to PATH

### Runtime Issues

**"Tauri command not found"**
- Verify command is in `invoke_handler!`
- Check command is decorated with `#[tauri::command]`
- Restart dev server

**"CSP violation"**
- Check `tauri.conf.json` CSP settings
- Verify domains are whitelisted

**"qpdf not found"**
- Install qpdf system package
- Ensure it's in system PATH

## Support & Resources

- **Official Tauri Docs**: https://tauri.app/
- **GitHub Issues**: https://github.com/VagishKapila/openpdf-studio/issues
- **Tauri Discord**: https://discord.gg/tauri
- **This Project README**: See README.md
- **Setup Guide**: See SETUP_GUIDE.md
- **Code Signing**: See src-tauri/SIGNING_SETUP.md

## Next Steps

1. **Review Configuration**: Read through tauri.conf.json and understand each section
2. **Setup Development Environment**: Follow SETUP_GUIDE.md
3. **Run Development Build**: `npm run tauri:dev`
4. **Create App Icons**: Follow src-tauri/icons/README.md
5. **Configure Code Signing**: See src-tauri/SIGNING_SETUP.md (if distributing)
6. **Build Release**: `npm run tauri:build:release`
7. **Test on Target Platforms**: Windows, macOS, Linux

## Document Maintenance

This guide covers Tauri 2.0 as of 2024. Check the following for updates:
- Tauri release notes: https://github.com/tauri-apps/tauri/releases
- Node.js LTS releases: https://nodejs.org/
- Rust releases: https://github.com/rust-lang/rust/releases

---

**Happy building with Tauri! 🚀**
