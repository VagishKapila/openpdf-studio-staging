# Code Signing Setup for OpenPDF Studio

This document provides instructions for setting up code signing for Windows and macOS builds to prevent security warnings and virus flag issues.

## Why Code Signing?

Code signing:
- Prevents Windows SmartScreen warnings ("Unknown publisher")
- Prevents macOS Gatekeeper warnings
- Builds user trust in your application
- Is required for distribution through Windows Store or macOS App Store
- Ensures code integrity and authenticity

## Windows Code Signing Setup

### Prerequisites

1. **Windows SDK Tools**
   - Install the Windows 10/11 SDK to get signtool.exe
   - Or install Visual Studio with Windows development tools

2. **Obtain a Code Signing Certificate**

   **Option A: Production Certificate (Recommended)**
   - Purchase from a trusted CA:
     - DigiCert (https://www.digicert.com/)
     - Sectigo (https://sectigo.com/)
     - Comodo (https://comodosslstore.com/)
   - Cost: typically $250-400/year
   - Install the certificate in your certificate store
   - Note the certificate thumbprint

   **Option B: Self-Signed Certificate (Testing Only)**
   ```powershell
   New-SelfSignedCertificate -CertStoreLocation "cert:\CurrentUser\My" `
     -Subject "CN=OpenPDF Studio" `
     -KeyAlgorithm RSA `
     -KeyLength 2048 `
     -NotAfter (Get-Date).AddYears(1)
   ```

### Configuration

1. **Find Your Certificate Thumbprint**
   ```powershell
   Get-ChildItem -Path Cert:\CurrentUser\My | Where-Object { $_.Subject -like "*OpenPDF*" } | Format-Table Thumbprint
   ```

2. **Update Environment Variable**
   ```powershell
   [System.Environment]::SetEnvironmentVariable("CODESIGN_CERT_THUMBPRINT", "YOUR_THUMBPRINT_HERE", "User")
   ```
   Restart PowerShell or terminal for changes to take effect.

3. **Update tauri.conf.json**
   ```json
   "windows": {
     "certificateThumbprint": "YOUR_THUMBPRINT_HERE",
     "digestAlgorithm": "sha256",
     "timestampUrl": "http://timestamp.digicert.com",
     "sign": "./sign.ps1"
   }
   ```

4. **Test the Signing Script**
   ```powershell
   .\src-tauri\sign.ps1 "path\to\executable.exe"
   ```

### Using a .pfx File

If you have a .pfx certificate file:

1. **Update sign.ps1**
   ```powershell
   $pfxPath = "C:\path\to\certificate.pfx"
   $pfxPassword = "your-password"
   SignWithPFX($pfxPath, $pfxPassword, $Paths)
   ```

2. **Or use environment variables**
   ```powershell
   [System.Environment]::SetEnvironmentVariable("CODESIGN_PFX_PATH", "C:\path\to\cert.pfx", "User")
   [System.Environment]::SetEnvironmentVariable("CODESIGN_PFX_PASSWORD", "password", "User")
   ```

### Build and Sign

```powershell
# Sign is automatic during build
npm run tauri build -- --release

# Or manually sign an existing binary
.\src-tauri\sign.ps1 "src-tauri\target\release\openpdf-studio.exe"
```

### Troubleshooting Windows Signing

- **signtool not found**: Install Windows SDK or add to PATH
- **Certificate not found**: Verify thumbprint matches installed cert
- **Access denied**: Run PowerShell as Administrator
- **Timestamp server error**: Check internet connection or use different server

## macOS Code Signing Setup

### Prerequisites

1. **Apple Developer Account**
   - Sign up at https://developer.apple.com/
   - Cost: $99/year for individual developer account

2. **Create Signing Certificate**
   - In Xcode: Preferences > Accounts > Manage Certificates
   - Or use Keychain Access to import certificate

3. **Download Provisioning Profile** (optional, for App Store)
   - Not required for direct distribution

### Configuration

1. **Find Your Signing Identity**
   ```bash
   security find-identity -v -p codesigning ~/Library/Keychains/login.keychain
   ```
   Look for "Developer ID Application: Your Name"

2. **Update tauri.conf.json**
   ```json
   "macOS": {
     "signingIdentity": "Developer ID Application: VagishKapila",
     "entitlements": "src-tauri/entitlements.plist",
     "minimumSystemVersion": "10.13"
   }
   ```

3. **Update Entitlements** (src-tauri/entitlements.plist)
   - Already configured for common permissions
   - Add additional entitlements as needed for your features

### Build and Sign

```bash
npm run tauri build -- --release
```

Tauri will automatically code sign the app bundle during the build process.

### Notarization (Required for macOS 10.15+)

To distribute on macOS Monterey and later:

1. **Enable Hardened Runtime**
   - Tauri does this automatically for you

2. **Submit for Notarization**
   ```bash
   xcrun altool --notarize-app --file ./OpenPDF\ Studio.dmg \
     --primary-bundle-id com.openpdfstudio.app \
     -u appleid@example.com -p app-specific-password
   ```

3. **Wait for Approval**
   - Apple processes notarization in 5-30 minutes
   - Check status with:
   ```bash
   xcrun altool --notarization-info REQUEST_UUID -u appleid@example.com
   ```

4. **Staple Notarization**
   ```bash
   xcrun stapler staple ./OpenPDF\ Studio.dmg
   ```

### Troubleshooting macOS Signing

- **Signing identity not found**: Check Keychain or create new certificate
- **Entitlements error**: Verify plist is valid XML
- **Gatekeeper warning**: Ensure notarization ticket is stapled

## Automated CI/CD Signing

For automated builds (GitHub Actions, etc.):

### GitHub Actions Example

```yaml
name: Build and Sign

on:
  release:
    types: [published]

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Install dependencies (Ubuntu)
        if: runner.os == 'Linux'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf qpdf

      - name: Build
        run: npm run tauri build -- --release
        env:
          CODESIGN_CERT_THUMBPRINT: ${{ secrets.WINDOWS_CERT_THUMBPRINT }}
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: artifacts-${{ matrix.os }}
          path: src-tauri/target/release/bundle
```

## Certificate Renewal

- **Windows**: Certificates typically valid for 1-3 years
- **macOS**: Developer certificates valid for 1 year, must renew annually
- Set a calendar reminder to renew before expiration

## Additional Resources

- Tauri Signing Documentation: https://tauri.app/v1/guides/distribution/sign-tauri-app
- Windows Code Signing: https://docs.microsoft.com/en-us/windows-hardware/drivers/dashboard/get-a-code-signing-certificate
- macOS Notarization: https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution
- DigiCert Code Signing Guide: https://www.digicert.com/code-signing/guides/code-signing

## Security Best Practices

1. **Never commit certificates** to version control
2. **Use environment variables** for sensitive data
3. **Rotate certificates** periodically
4. **Use strong passwords** for certificate storage
5. **Limit access** to signing credentials
6. **Audit** all signing operations
7. **Keep tools updated** (signtool, xcode, etc.)

## Support

For issues or questions:
- File an issue on GitHub: https://github.com/VagishKapila/openpdf-studio/issues
- Check Tauri documentation: https://tauri.app/
