# OpenPDF Studio App Icons

This directory contains the application icons for OpenPDF Studio in various formats and sizes required for Tauri desktop packaging.

## Required Icons

### Windows Icons
- **icon.ico** (256x256, 48x48, 32x32, 16x16)
  - Used for Windows executable and taskbar
  - Multi-resolution ICO file
  - Can be generated from PNG using ImageMagick or online tools

### macOS Icons
- **icon.icns** (512x512 and variants)
  - macOS app bundle icon
  - Required for .dmg and .app distribution
  - Generated from PNG or high-resolution source

### Linux Icons
- **32x32.png** - Used in file managers and application launchers
- **128x128.png** - Used in larger contexts
- **128x128@2x.png** - High-DPI version for modern displays

### Cross-platform
- **icon.png** - General purpose icon (512x512 recommended)

## Icon Specifications

### Minimum Requirements
- **Format**: PNG with transparent background (for cross-platform)
- **Color Space**: RGBA (with alpha channel for transparency)
- **DPI**: 72 DPI or higher
- **Background**: Transparent (PNG RGBA)

### Recommended Design

The OpenPDF Studio icon should incorporate:
1. **PDF Symbol** - Subtle PDF or document representation
2. **Studio Concept** - Creative tools, palette, or workspace imagery
3. **Color Palette** - Professional colors (suggest: Red/Orange #DC143C, Blue #0066CC)
4. **Simplicity** - Recognizable at small sizes (16x16, 32x32)
5. **Uniqueness** - Distinctive design that stands out in application menus

## How to Generate Icons

### From High-Resolution PNG

**Using ImageMagick (Linux/macOS):**
```bash
# Create Windows ICO from 256x256 PNG
convert icon.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico

# Create macOS ICNS from PNG
# First install png2icns tool or use online converter
png2icns icon.icns icon.png
```

**Using ImageMagick (Windows):**
```powershell
magick convert icon.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico
```

**Using Python PIL:**
```python
from PIL import Image

# Create ICO for Windows
img = Image.open('icon.png')
img.save('icon.ico', format='ICO', sizes=[(256, 256), (128, 128), (96, 96), (64, 64), (48, 48), (32, 32), (16, 16)])

# Create ICNS for macOS (requires additional tools or services)
```

### Online Tools

If you don't have command-line tools:

1. **icoconvert.com** - Convert PNG to ICO
2. **iconverticons.com** - ICO and ICNS conversion
3. **cloudconvert.com** - Multiple format conversion including ICNS
4. **img2go.com** - Online image conversion

## Icon Sizes Reference

| Size | Format | Used For |
|------|--------|----------|
| 512x512 | PNG | Original/master icon |
| 256x256 | PNG, ICO | High-resolution display |
| 128x128 | PNG, ICO, ICNS | Standard display |
| 128x128@2x | PNG | High-DPI displays |
| 64x64 | ICO, ICNS | Medium display |
| 48x48 | ICO, ICNS | Taskbar, file manager |
| 32x32 | PNG, ICO, ICNS | File manager, menu |
| 16x16 | ICO | Window title bar |

## macOS ICNS Creation

For macOS, creating a proper ICNS file from PNG:

**Using Xcode (macOS only):**
1. Open Assets.xcassets in your Xcode project
2. Create an App Icon set
3. Drag your PNG to fill all required sizes
4. Xcode generates the ICNS file automatically

**Using online ICNS converter:**
1. Upload your 512x512 PNG to cloudconvert.com or similar
2. Select output format: ICNS
3. Download the generated .icns file

**Using Apple's iconutil (macOS):**
```bash
# Create .iconset folder with properly named PNG files
mkdir icon.iconset
cp icon512.png icon.iconset/icon_512x512.png
cp icon256.png icon.iconset/icon_256x256.png
# ... add other sizes ...

# Convert to ICNS
iconutil -c icns icon.iconset -o icon.icns
```

## Windows ICO Creation

**Using Magick Image Magic:**
```bash
convert icon.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico
```

**Detailed approach for best results:**
```bash
# Create multiple sized PNGs first
convert icon.png -resize 256x256 icon-256.png
convert icon.png -resize 128x128 icon-128.png
convert icon.png -resize 96x96 icon-96.png
convert icon.png -resize 64x64 icon-64.png
convert icon.png -resize 48x48 icon-48.png
convert icon.png -resize 32x32 icon-32.png
convert icon.png -resize 16x16 icon-16.png

# Combine into single ICO file
convert icon-256.png icon-128.png icon-96.png icon-64.png icon-48.png icon-32.png icon-16.png icon.ico
```

## Linux PNG Icons

Simply ensure you have PNG files at the required sizes:
- 32x32.png
- 128x128.png
- 128x128@2x.png (for high-DPI displays)

You can resize using ImageMagick:
```bash
convert icon.png -resize 32x32 32x32.png
convert icon.png -resize 128x128 128x128.png
convert icon.png -resize 256x256 128x128@2x.png
```

## Tauri Configuration

The `tauri.conf.json` already references the icon files:

```json
"icon": [
  "icons/32x32.png",
  "icons/128x128.png",
  "icons/128x128@2x.png",
  "icons/icon.icns",
  "icons/icon.ico"
]
```

Simply place your icon files in this directory with the correct names.

## Testing Icons

After generating icons:

1. **Windows**: Right-click an EXE and verify the icon displays
2. **macOS**: Right-click the app and check the icon in Finder
3. **Linux**: Icons should appear in application menus and file managers

## Icon Guidelines

- **Keep it simple**: Avoid fine details that won't render at small sizes
- **Ensure contrast**: Make sure the icon is readable at 16x16 pixels
- **Use proper colors**: Avoid very bright colors that may clash
- **Test at all sizes**: Verify the icon looks good at every scale
- **Consider dark mode**: Ensure the icon is visible on both light and dark backgrounds

## Resources

- **Design Inspiration**: Behance, Dribbble
- **Icon Design Tools**: Figma, Adobe Illustrator, Inkscape
- **Icon Conversion**: CloudConvert, icoconvert.com
- **Apple Icon Guidelines**: https://developer.apple.com/design/human-interface-guidelines/macos/icons-and-images/app-icon/
- **Windows Icon Guidelines**: https://docs.microsoft.com/en-us/windows/win32/uxguide/vis-icons

## Example Directory Structure

```
src-tauri/icons/
├── README.md                    (this file)
├── icon.png                     (512x512, master)
├── icon.ico                     (Windows)
├── icon.icns                    (macOS)
├── 32x32.png                    (Linux)
├── 128x128.png                  (Linux)
└── 128x128@2x.png               (Linux high-DPI)
```

## Notes

- All icon files should use transparent backgrounds where possible
- Keep a high-resolution source file (SVG preferred) for future scaling
- Update icons in all formats when making design changes
- Consider color accessibility (WCAG guidelines)
