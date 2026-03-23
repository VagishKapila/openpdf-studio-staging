# PowerShell script for code signing Windows executables
# This script is called during the Tauri build process to sign the generated .msi and .exe files
#
# SETUP INSTRUCTIONS FOR CODE SIGNING ON WINDOWS:
# ================================================
#
# 1. OBTAIN A CODE SIGNING CERTIFICATE
#    - Purchase a certificate from a trusted CA (DigiCert, Sectigo, Comodo, etc.)
#    - Or use a self-signed certificate for testing (not recommended for production)
#    - Self-signed: New-SelfSignedCertificate -CertStoreLocation "cert:\CurrentUser\My" -Subject "CN=OpenPDF Studio"
#
# 2. INSTALL THE CERTIFICATE
#    - Import the certificate into your system certificate store
#    - Ensure the private key is accessible to the signing user
#
# 3. UPDATE THIS SCRIPT
#    - Replace THUMBPRINT with your certificate's thumbprint
#    - Replace CERTSUBJECT with your certificate's subject
#    - If using a .pfx file, add the path below
#
# 4. SET ENVIRONMENT VARIABLES (Optional but recommended)
#    - Create a system environment variable: CODESIGN_CERT_THUMBPRINT
#    - Store your certificate thumbprint there for security
#
# 5. CONFIGURE tauri.conf.json
#    - Update the "certificateThumbprint" field under windows -> bundle -> nsis
#    - Update the "certificateThumbprint" field under windows -> bundle -> msi
#    - Or set via environment variable: TAURI_WINDOWS_CERTIFICATE_THUMBPRINT
#
# 6. SIGNING WITH A .PFX FILE
#    - You can also sign with a .pfx file and password
#    - Uncomment the section below and provide your .pfx path and password

param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Paths
)

# Certificate thumbprint - UPDATE THIS WITH YOUR CERTIFICATE THUMBPRINT
$thumbprint = if ($env:CODESIGN_CERT_THUMBPRINT) { $env:CODESIGN_CERT_THUMBPRINT } else { "YOUR_CERTIFICATE_THUMBPRINT_HERE" }

# Certificate subject (alternative method) - UPDATE THIS WITH YOUR CERTIFICATE SUBJECT
$certSubject = "CN=OpenPDF Studio"

# Timestamp server URL (DigiCert timestamp server)
$timestampUrl = "http://timestamp.digicert.com"

# Optional: If using a .pfx file, uncomment and configure:
# $pfxPath = "C:\path\to\your\certificate.pfx"
# $pfxPassword = "your-pfx-password"
# SignWithPFX($pfxPath, $pfxPassword, $Paths)

# Function to sign files using certificate thumbprint
function SignWithThumbprint {
    param(
        [string]$Thumbprint,
        [string[]]$FilePaths
    )

    foreach ($file in $FilePaths) {
        Write-Host "Signing $file with thumbprint $Thumbprint..."

        # Find the certificate in the certificate store
        $cert = Get-ChildItem -Path "Cert:\CurrentUser\My" | Where-Object { $_.Thumbprint -eq $Thumbprint }

        if ($null -eq $cert) {
            $cert = Get-ChildItem -Path "Cert:\LocalMachine\My" | Where-Object { $_.Thumbprint -eq $Thumbprint }
        }

        if ($null -eq $cert) {
            Write-Error "Certificate with thumbprint $Thumbprint not found!"
            exit 1
        }

        # Use signtool to sign the file
        $signtoolPath = "C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe"
        if (-not (Test-Path $signtoolPath)) {
            $signtoolPath = "signtool"  # Try to find signtool in PATH
        }

        & $signtoolPath sign /f $cert.PSPath /t $timestampUrl /fd sha256 /v $file

        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to sign $file"
            exit 1
        }
    }
}

# Function to sign files using a .pfx certificate file
function SignWithPFX {
    param(
        [string]$PfxPath,
        [string]$Password,
        [string[]]$FilePaths
    )

    if (-not (Test-Path $PfxPath)) {
        Write-Error "PFX file not found at $PfxPath"
        exit 1
    }

    foreach ($file in $FilePaths) {
        Write-Host "Signing $file with PFX certificate..."

        $signtoolPath = "C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe"
        if (-not (Test-Path $signtoolPath)) {
            $signtoolPath = "signtool"
        }

        & $signtoolPath sign /f $PfxPath /p $Password /t $timestampUrl /fd sha256 /v $file

        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to sign $file"
            exit 1
        }
    }
}

# Main execution
if ($thumbprint -eq "YOUR_CERTIFICATE_THUMBPRINT_HERE") {
    Write-Warning "Certificate thumbprint not configured. Signing will be skipped."
    Write-Warning "To enable code signing:"
    Write-Warning "1. Configure a code signing certificate"
    Write-Warning "2. Update the `$thumbprint variable in this script"
    Write-Warning "3. Or set CODESIGN_CERT_THUMBPRINT environment variable"
    exit 0
}

SignWithThumbprint -Thumbprint $thumbprint -FilePaths $Paths
