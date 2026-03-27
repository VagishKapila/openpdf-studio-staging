# OpenPDF Studio

A PDF and image editor built with Tauri 2.0 and React. Free core features with premium paid tiers.

**Developer**: VagishKapila
**Repository**: https://github.com/VagishKapila/openpdf-studio
**License**: MIT OR Apache-2.0

## Features

- PDF editing and manipulation
- Image editing with canvas-based tools
- OCR capabilities (Tesseract.js)
- PDF encryption/decryption
- Cross-platform desktop application (Windows, macOS, Linux)
- Dark theme UI
- Modern, responsive interface

## Technology Stack

- **Desktop Framework**: Tauri 2.0 (Rust backend)
- **UI Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **PDF Libraries**: pdf.js, pdf-lib
- **Canvas Editing**: Fabric.js
- **OCR**: Tesseract.js
- **State Management**: Zustand
- **HTTP Client**: Axios

## Project Structure

```
openpdf-studio/
├── src/                          # Frontend React application
│   ├── components/               # React components
│   ├── pages/                    # Page components
│   ├── utils/                    # Utility functions
│   ├── types/                    # TypeScript type definitions
│   ├── assets/                   # Static assets
│   ├── App.tsx                   # Main app component
│   └── index.html               # HTML entry point
├── src-tauri/                    # Rust backend for Tauri
│   ├── src/
│   │   ├── main.rs              # Main Tauri application
│   │   ├── lib.rs               # Library module
│   │   └── commands.rs          # Command handlers
│   ├── icons/                    # Application icons
│   ├── Cargo.toml               # Rust dependencies
│   ├── build.rs                 # Build script
│   ├── tauri.conf.json          # Tauri configuration
│   ├── entitlements.plist       # macOS entitlements
│   ├── sign.ps1                 # Windows code signing script
│   └── SIGNING_SETUP.md         # Code signing documentation
├── vite.config.ts               # Vite configuration
├── package.json                 # Node dependencies
├── tsconfig.json               # TypeScript configuration
└── README.md                    # This file
```

## Prerequisites

### System Requirements

- **Node.js**: v18 or higher
- **Rust**: Latest stable (install from https://rustup.rs/)
- **Tauri CLI**: Install via npm

### Platform-Specific Requirements

#### Windows
- Visual Studio 2019+ or Visual Studio Build Tools
- Windows 10/11 SDK
- Optional: Code signing certificate (for production builds)

#### macOS
- Xcode 13+ or Command Line Tools
- Apple Developer Account (for code signing)
- Optional: Code signing certificate

#### Linux
- GTK 3.6+ development files
- WebKitGTK 2.38+ development files
- Optional: qpdf for PDF encryption features

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/VagishKapila/openpdf-studio.git
cd openpdf-studio
```

### 2. Install Dependencies

```bash
# Install Node/npm dependencies
npm install

# Install Tauri CLI
npm install -g @tauri-apps/cli
```

### 3. Install Rust (if not already installed)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 4. Platform-Specific Setup

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf qpdf

# Fedora
sudo dnf install -y gtk3-devel webkit2gtk3-devel libappindicator-gtk3-devel librsvg2-devel qpdf
```

#### macOS
```bash
# Install Xcode Command Line Tools (if not already installed)
xcode-select --install

# Install qpdf for PDF encryption support
brew install qpdf
```

#### Windows
```powershell
# Install Visual Studio Build Tools or Visual Studio Community
# Visit: https://visualstudio.microsoft.com/downloads/

# Install qpdf using Chocolatey (optional)
choco install qpdf
# Or download from: https://github.com/qpdf/qpdf/releases
```

## Development

### Running in Development Mode

```bash
npm run tauri:dev
```

This will:
1. Start the Vite dev server (http://localhost:5173)
2. Launch the Tauri application
3. Enable hot module reloading (HMR)

### Building for Production

```bash
# Build everything (frontend + Tauri)
npm run tauri:build

# Build with release optimizations
npm run tauri:build:release
```

The built application will be in `src-tauri/target/release/bundle/`.

### Frontend Development Only

If you only want to work on the UI without the Tauri framework:

```bash
npm run dev
```

Then open http://localhost:5173 in your browser.

### Building Frontend Only

```bash
npm run build
```

Output will be in the `dist/` directory.

## Code Signing & Distribution

### Important: Windows Code Signing

To prevent Windows SmartScreen warnings and false virus flags:

1. **Obtain a Code Signing Certificate**
   - Purchase from DigiCert, Sectigo, or Comodo
   - Or create a self-signed certificate for testing

2. **Configure Signing**
   - See `src-tauri/SIGNING_SETUP.md` for detailed instructions
   - Update `tauri.conf.json` with your certificate thumbprint
   - Or set `CODESIGN_CERT_THUMBPRINT` environment variable

3. **Build Signed Release**
   ```bash
   npm run tauri:build:release
   ```

### macOS Code Signing

1. **Obtain Developer Certificate**
   - Sign up for Apple Developer Program ($99/year)
   - Create signing certificate in Xcode

2. **Configure Signing**
   - See `src-tauri/SIGNING_SETUP.md` for detailed instructions
   - Update `tauri.conf.json` with your signing identity

3. **Notarize for Distribution**
   ```bash
   # After building, notarize the .dmg
   xcrun altool --notarize-app --file ./OpenPDF\ Studio.dmg \
     --primary-bundle-id com.openpdfstudio.app \
     -u appleid@example.com -p app-specific-password
   ```

### Linux Packaging

Linux automatically packages as:
- `.deb` for Debian/Ubuntu
- `.AppImage` for universal distribution

No code signing required on Linux.

## Available Commands

### Frontend Commands
- `npm run dev` - Start Vite dev server
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

### Tauri Commands
- `npm run tauri:dev` - Run in development mode with hot reload
- `npm run tauri:build` - Build for production
- `npm run tauri:build:release` - Build with optimizations

## Tauri Commands (Backend)

The Tauri backend exposes these commands to the frontend:

### File Operations
- `read_file(path: string)` - Read file contents
- `write_file(path: string, contents: string)` - Write file contents
- `list_dir(path: string)` - List directory contents
- `copy_file(src: string, dest: string)` - Copy a file
- `delete_file(path: string)` - Delete a file
- `get_file_info(path: string)` - Get file metadata

### PDF Operations
- `encrypt_pdf(input_path: string, output_path: string, password: string)` - Encrypt PDF with password
- `decrypt_pdf(input_path: string, output_path: string, password: string)` - Decrypt PDF

### Usage in React

```typescript
import { invoke } from '@tauri-apps/api/tauri';

// Read a file
const contents = await invoke('read_file', { path: '/path/to/file' });

// Encrypt a PDF
const result = await invoke('encrypt_pdf', {
  inputPath: '/path/to/input.pdf',
  outputPath: '/path/to/output.pdf',
  password: 'secret123'
});
```

## Configuration

### Tauri Configuration (tauri.conf.json)

Key configurations:

```json
{
  "app": {
    "windows": [{
      "title": "OpenPDF Studio",
      "width": 1400,
      "height": 900
    }],
    "security": {
      "csp": "..." // Content Security Policy
    }
  },
  "tauri": {
    "bundle": {
      "targets": ["msi", "nsis", "dmg", "deb", "appimage"],
      "windows": {
        "certificateThumbprint": "YOUR_CERT_THUMBPRINT"
      }
    },
    "updater": {
      "active": true,
      "endpoints": ["https://updates.tauri.app/releases/{{target}}/{{arch}}"]
    }
  }
}
```

### App Icons

Place icon files in `src-tauri/icons/`:
- `icon.ico` - Windows executable icon
- `icon.icns` - macOS app icon
- `32x32.png`, `128x128.png`, `128x128@2x.png` - Linux icons

See `src-tauri/icons/README.md` for icon generation instructions.

## Troubleshooting

### Issue: "command not found: cargo"

**Solution**: Install Rust using rustup
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Issue: WebKitGTK not found (Linux)

**Solution**: Install development files
```bash
sudo apt-get install libwebkit2gtk-4.0-dev
```

### Issue: Code signing failures on Windows

**Solution**: See `src-tauri/SIGNING_SETUP.md` for detailed troubleshooting

### Issue: macOS Gatekeeper warning

**Solution**: Notarize the application (see Code Signing section above)

### Issue: PDF encryption command not found

**Solution**: Install qpdf on your system
```bash
# macOS
brew install qpdf

# Linux (Ubuntu/Debian)
sudo apt-get install qpdf

# Windows
choco install qpdf
# Or download: https://github.com/qpdf/qpdf/releases
```

## Performance Optimization

### Bundle Size
- The default build uses tree-shaking and code splitting
- pdf.js and fabric.js are split into separate chunks
- Vite minification reduces the final bundle by ~70%

### Runtime Performance
- Tauri uses native WebKit engine (very performant)
- Large PDF operations run in a background thread
- OCR processing is offloaded to Tesseract.js workers

## Security Considerations

### Content Security Policy (CSP)

The app includes a strict CSP that allows:
- Local scripts only (same-origin)
- Trusted CDNs for libraries (pdf.js, fabric.js, tesseract.js)
- GitHub API for auto-updates

### File System Access

- All file operations are sandboxed by Tauri
- The app only reads/writes user-selected files
- No access to system files outside user's home directory

### Code Integrity

- All builds are code-signed (Windows/macOS)
- Enable auto-updates to receive security patches
- Review dependencies regularly with `npm audit`

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

For major changes, please open an issue first to discuss.

## License

OpenPDF Studio is dual-licensed under MIT OR Apache-2.0. See LICENSE files for details.

## Support & Issues

- **Bug Reports**: https://github.com/VagishKapila/openpdf-studio/issues
- **Feature Requests**: https://github.com/VagishKapila/openpdf-studio/discussions
- **Documentation**: Check the docs/ directory

## Roadmap

- [ ] Web-based version
- [ ] Batch processing
- [ ] Advanced OCR features
- [ ] Plugin system
- [ ] Cloud synchronization
- [ ] Mobile app (React Native)

## Acknowledgments

Built with:
- [Tauri](https://tauri.app/) - Desktop framework
- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [pdf.js](https://mozilla.github.io/pdf.js/) - PDF rendering
- [Fabric.js](http://fabricjs.com/) - Canvas editing
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR

## Stay Updated

- Watch the repository for release notifications
- Enable auto-updates in the app settings
- Follow releases at: https://github.com/VagishKapila/openpdf-studio/releases

---

**Happy editing! 📄✨**
