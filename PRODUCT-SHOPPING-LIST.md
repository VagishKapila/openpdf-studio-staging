# OpenPDF Studio — Complete Product & Library Shopping List

Every single library, tool, and service you need to build a free Adobe Acrobat Pro + basic Photoshop replacement. Organized by what it does, why you need it, and how it fits together.

---

## Part 1: Smart PDF Editing (The Adobe Acrobat Killer)

The key insight: users want to open ANY PDF — even a scanned paper document — and edit text, move things around, add signatures, exactly like editing a Word doc. This requires OCR that understands layout, not just text.

### 1.1 PDF Viewing & Rendering

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **PDF.js** (pdfjs-dist) | Renders PDFs in the browser. Mozilla's engine — same one Firefox uses. Handles all PDF specs, text layers, annotations. | Apache 2.0 | Free | `npm install pdfjs-dist` |

**Why this one:** It's the gold standard. Every PDF viewer in the browser uses it. No alternatives come close for rendering quality.

### 1.2 PDF Editing & Creation

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **pdf-lib** | Create new PDFs, add text/images to existing ones, merge, split, embed fonts, fill forms, copy pages between documents. | MIT | Free | `npm install pdf-lib` |
| **PyMuPDF (fitz)** | Heavy-duty PDF manipulation on the backend/desktop. Text extraction with exact positions, text insertion with font matching, image extraction, page manipulation. | AGPL-3.0 | Free | `pip install pymupdf` |
| **pypdf** | Merge, split, rotate, encrypt/decrypt, extract metadata. Lighter weight than PyMuPDF. | BSD | Free | `pip install pypdf` |

**Why all three:** pdf-lib runs in the browser (JavaScript) for the web and desktop app. PyMuPDF is for heavy backend processing when the desktop app needs to do serious PDF surgery (actual text replacement, not just overlay). pypdf handles the simple stuff efficiently.

### 1.3 Smart OCR (The AI Brain)

This is what makes scanned PDFs editable. The OCR doesn't just read text — it detects WHERE each word is, how big it is, and what the layout structure looks like.

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **Tesseract.js 5** | OCR that runs 100% in the browser. Returns word-level bounding boxes, confidence scores, text direction. Supports 100+ languages. | Apache 2.0 | Free | `npm install tesseract.js` |
| **PaddleOCR** (desktop/backend) | More accurate OCR for complex layouts. Handles skewed scans, multi-column layouts, tables within PDFs. Better than Tesseract for messy documents. | Apache 2.0 | Free | `pip install paddleocr paddlepaddle` |
| **OCRmyPDF** (desktop) | One-command tool: takes a scanned PDF, OCRs it, outputs a searchable PDF with text layer aligned to the original. | MPL-2.0 | Free | `pip install ocrmypdf` |

**How they work together:**
- Tesseract.js runs in the browser for instant OCR (user opens scanned PDF → text becomes selectable/editable)
- PaddleOCR runs on desktop for higher accuracy when Tesseract struggles (complex layouts, handwriting)
- OCRmyPDF is the "batch mode" — drop 100 scanned PDFs and make them all searchable

### 1.4 Layout Analysis (Understanding Document Structure)

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **pdfplumber** | Detects tables, columns, headers in PDFs by analyzing visual layout. Character-level coordinate data. | MIT | Free | `pip install pdfplumber` |
| **LayoutParser** | Deep learning model that classifies regions of a document page (title, paragraph, table, figure, list). Pre-trained on academic papers and documents. | Apache 2.0 | Free | `pip install layoutparser` |

**Why you need layout analysis:** Without it, OCR gives you a stream of text. With it, you know "this block is a table" and "this is a heading" and "these two columns should be read separately." This is what makes the editor smart.

### 1.5 Font Detection & Matching

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **fontTools** | Read font metadata, character mappings, glyph information from font files. | MIT | Free | `pip install fonttools` |
| **Google Fonts API** | Free access to 1,500+ open-source fonts for matching detected fonts. | Various open | Free | CDN or download |
| **opentype.js** | Parse and render OpenType fonts in the browser. Used for font matching when editing OCR'd text. | MIT | Free | `npm install opentype.js` |

**The font matching challenge:** When a user edits OCR'd text, the new text needs to look like the original. We analyze the detected font size, weight, and style from OCR bounding boxes, then match to the closest available font.

### 1.6 Canvas & Annotations

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **Fabric.js** | Full canvas library for adding text, shapes, images, freehand drawing, signatures on top of PDF pages. Objects are selectable, movable, resizable. | MIT | Free | `npm install fabric` |

**Why Fabric.js over Konva.js for PDF annotations:** Fabric.js has better text editing support (inline editing, cursor positioning, text selection) which is critical for a PDF editor. Konva is better for layer-heavy image editing (we use it there).

### 1.7 Digital Signatures

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **Fabric.js** (reused) | Draw signatures on canvas (freehand drawing mode). | MIT | Free | (already installed) |
| **node-signpdf** | Cryptographic PDF signing — adds real digital certificates to PDFs, not just images. | MIT | Free | `npm install node-signpdf` |
| **pdf-lib** (reused) | Embed signature images into PDF pages. | MIT | Free | (already installed) |
| **PKI.js** | Full public key infrastructure for browser-based certificate operations. | BSD-3 | Free | `npm install pkijs` |

**Two types of signatures:**
1. **Visual signatures** — Drawing/typing your name and placing it on the PDF (what most people need)
2. **Digital signatures** — Cryptographically signed with a certificate (legally binding, enterprise use)

### 1.8 Form Filling

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **pdf-lib** (reused) | Detect form fields (text, checkbox, dropdown, radio) and fill them programmatically. | MIT | Free | (already installed) |
| **PDF.js** (reused) | Render form fields interactively so users can click and type into them. | Apache 2.0 | Free | (already installed) |

### 1.9 File Operations

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **FileSaver.js** | Trigger browser file downloads (save edited PDFs). | MIT | Free | `npm install file-saver` |
| **JSZip** | Create zip files in the browser (batch export). | MIT/GPLv3 | Free | `npm install jszip` |
| **qpdf** (desktop) | Command-line tool for PDF encryption, decryption, linearization. Handles password protection properly. | Apache 2.0 | Free | `apt install qpdf` or `brew install qpdf` |

---

## Part 2: Basic Photoshop Features (The Image Editor)

These are the features that cover 80% of what people use Photoshop for: crop, resize, adjust colors, add text, remove backgrounds.

### 2.1 Core Canvas Engine

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **Konva.js** | Canvas library with native layer support, blending modes, group management. Each layer is its own canvas for performance. | MIT | Free | `npm install konva` |
| **react-konva** | React bindings for Konva (since our app is React-based). | MIT | Free | `npm install react-konva` |

**Why Konva for image editing (not Fabric.js):** Konva has native layer support — each layer is a separate canvas element, just like Photoshop. It supports blending modes (multiply, screen, overlay, etc.) natively. Fabric.js is better for PDF annotations; Konva is better for image editing.

### 2.2 Image Filters & Adjustments

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **Konva.js** (built-in filters) | Blur, brighten, contrast, emboss, enhance, grayscale, invert, noise, pixelate, posterize, sepia, threshold. | MIT | Free | (already installed) |
| **CamanJS** | Additional filters: vibrance, exposure, curves, channels, vignette, tilt-shift. More artistic control. | BSD | Free | `npm install caman` |
| **Pixels.js** | 100+ Instagram-style filters for one-click effects. | MIT | Free | `npm install pixels.js` |

**How they layer:** Konva handles real-time interactive adjustments (sliders for brightness/contrast). CamanJS adds precision controls (curves, channel mixing). Pixels.js adds fun preset filters.

### 2.3 Selection Tools

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **Konva.js** (built-in) | Rectangular and elliptical selection via shape drawing. | MIT | Free | (already installed) |
| **magic-wand-js** | Magic wand / fuzzy selection — click a region and select similar colors (like Photoshop's magic wand). | MIT | Free | `npm install magic-wand-js` |
| **lasso-canvas-image** | Freehand lasso selection — draw around an area to select it. | MIT | Free | `npm install lasso-canvas-image` |

### 2.4 Drawing & Painting

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **Konva.js** (built-in) | Freehand drawing (brush), eraser (via globalCompositeOperation), line, shapes. | MIT | Free | (already installed) |
| **perfect-freehand** | Pressure-sensitive, smooth freehand strokes. Makes drawn lines look professional. | MIT | Free | `npm install perfect-freehand` |

### 2.5 AI Background Removal

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **@imgly/background-removal** | Remove image backgrounds 100% in the browser. No server, no API key, no cost. Uses ML models downloaded once. | AGPL-3.0 | Free | `npm install @imgly/background-removal` |
| **ONNX Runtime Web** | Run any ONNX ML model in the browser. Can run Segment Anything Model (SAM2) for advanced selection. | MIT | Free | `npm install onnxruntime-web` |
| **Transformers.js** | Hugging Face models in the browser. Image segmentation, object detection, all client-side. | Apache 2.0 | Free | `npm install @xenova/transformers` |

**Recommended approach:** Start with @imgly/background-removal (it just works). Later add ONNX Runtime + SAM2 for "click to select any object" (like Photoshop's Select Subject).

### 2.6 Color Picker

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **EyeDropper API** (browser native) | Pick any color from the screen. Built into Chrome/Edge. No library needed. | N/A | Free | Built-in browser API |
| **react-colorful** | Lightweight color picker component for React. | MIT | Free | `npm install react-colorful` |

### 2.7 History / Undo-Redo

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **Custom implementation** | Action-based undo/redo stack. Store commands (not snapshots) for memory efficiency. | N/A | Free | Built in-house |
| **zustand** (already in stack) | State management that makes undo/redo easy via middleware. | MIT | Free | (already installed) |

### 2.8 Export

All handled by browser Canvas APIs and existing libraries:
- **PNG**: canvas.toBlob('image/png')
- **JPEG**: canvas.toBlob('image/jpeg', quality)
- **WebP**: canvas.toBlob('image/webp', quality)
- **SVG**: Fabric.js / Konva.js native SVG export
- **PDF**: pdf-lib (embed the edited image into a PDF)

---

## Part 3: Cross-Platform Packaging

### 3.1 Desktop App (Windows + Mac + Linux)

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **Tauri 2.0** | Package the web app as a native desktop app. Uses OS WebView (not bundled Chromium). App size: ~5-10MB. Auto-updates. | MIT/Apache 2.0 | Free | `npm install @tauri-apps/cli` |
| **Rust** | Required by Tauri for the native backend. Handles file I/O, system integration. | MIT/Apache 2.0 | Free | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |

**Alternative (easier but bigger):**

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **Electron** | Package web app as desktop app. Bundles Chromium. App size: ~150MB. More mature ecosystem. | MIT | Free | `npm install electron` |

**Recommendation:** Start with Electron for faster development, then migrate to Tauri for production (smaller app size, better performance).

### 3.2 Mobile App (iOS + Android)

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **Capacitor** | Wrap the React web app as a native mobile app. Access to native APIs (camera, filesystem, share). | MIT | Free | `npm install @capacitor/core @capacitor/cli` |
| **@capacitor/camera** | Access phone camera for document scanning. | MIT | Free | `npm install @capacitor/camera` |
| **@capacitor/filesystem** | Read/write files on the device. | MIT | Free | `npm install @capacitor/filesystem` |
| **@capacitor/share** | Share PDFs with other apps. | MIT | Free | `npm install @capacitor/share` |

### 3.3 Web App Hosting

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **Vercel** | Host the web app. Free tier: 100GB bandwidth, custom domain, SSL. | N/A | Free tier | `npm install vercel` |
| **Cloudflare Pages** | Alternative host. Free tier: unlimited bandwidth. | N/A | Free tier | Dashboard setup |

---

## Part 4: Build & Development Tools

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **Vite** | Build tool. Lightning-fast dev server, optimized production builds. | MIT | Free | `npm install vite` |
| **TypeScript** | Type safety. Catches bugs before runtime. Essential for a project this size. | Apache 2.0 | Free | `npm install typescript` |
| **React 18** | UI framework. Component-based, huge ecosystem. | MIT | Free | `npm install react react-dom` |
| **Zustand** | State management. Simpler than Redux, perfect for this use case. | MIT | Free | `npm install zustand` |
| **Tailwind CSS** | Utility-first CSS framework. Fast styling, dark mode built in. | MIT | Free | `npm install tailwindcss` |
| **Vitest** | Testing framework. Vite-native, fast, compatible with Jest API. | MIT | Free | `npm install vitest` |
| **ESLint** | Code quality. Catches common mistakes. | MIT | Free | `npm install eslint` |
| **pnpm** | Package manager. Faster than npm, saves disk space. | MIT | Free | `npm install -g pnpm` |

---

## Part 5: CI/CD & Distribution

| Product | What It Does | License | Cost | Install |
|---------|-------------|---------|------|---------|
| **GitHub Actions** | Automated builds, tests, releases. Free for open-source projects. | N/A | Free (OSS) | .github/workflows/ |
| **GitHub Releases** | Host desktop app downloads (Windows .msi, Mac .dmg, Linux .AppImage). | N/A | Free | Automatic via CI |

---

## Part 6: Services & Accounts Needed

| Service | Why | Cost |
|---------|-----|------|
| **GitHub account** | Host code, issues, releases, CI/CD | Free |
| **Domain name** (e.g., openpdfstudio.com) | Web app URL, branding | ~$12/year |
| **Apple Developer Account** | Publish iOS app + notarize Mac app | $99/year |
| **Google Play Developer Account** | Publish Android app | $25 one-time |
| **Vercel account** | Host web app | Free tier |
| **SignPath** (optional) | Windows code signing for open source | Free for OSS |

---

## Complete Bill of Materials

### JavaScript/TypeScript Packages (npm install)

```bash
# Core PDF
pdfjs-dist pdf-lib fabric file-saver jszip tesseract.js opentype.js node-signpdf pkijs

# Image Editor
konva react-konva caman magic-wand-js lasso-canvas-image perfect-freehand react-colorful
@imgly/background-removal onnxruntime-web @xenova/transformers

# Cross-Platform
@tauri-apps/cli @capacitor/core @capacitor/cli @capacitor/camera
@capacitor/filesystem @capacitor/share

# Build & Dev
react react-dom typescript vite @vitejs/plugin-react zustand
tailwindcss postcss autoprefixer vitest eslint

# State Management
zustand
```

### Python Packages (pip install)

```bash
# Used by desktop app backend for heavy PDF processing
pymupdf pypdf pdfplumber paddleocr paddlepaddle ocrmypdf
fonttools reportlab pytesseract pdf2image layoutparser
```

### System Tools

```bash
# Desktop dependencies
qpdf        # PDF encryption/decryption
poppler     # PDF utilities (pdftotext, pdfimages)
tesseract   # System OCR engine (used by pytesseract)
rust        # Required by Tauri
```

---

## How the Smart OCR Editing Flow Works

Here is the step-by-step flow when a user opens a scanned PDF and wants to edit text:

```
User drops scanned PDF into the app
         │
         ▼
    ┌──────────────┐
    │  PDF.js       │  Render the PDF page as visible image
    │  (viewer)     │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ Tesseract.js  │  OCR the rendered page
    │ (browser OCR) │  → Returns: each word + its bounding box + confidence
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ Layout        │  Analyze the OCR results:
    │ Analysis      │  - Group words into lines
    │               │  - Detect paragraphs, tables, headers
    │               │  - Identify columns
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ Fabric.js     │  Create editable text objects on canvas:
    │ (canvas)      │  - Each detected text block → editable IText
    │               │  - Positioned exactly over the original
    │               │  - Font size matched from bounding box height
    │               │  - User can click any text and edit it
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ pdf-lib       │  Save changes back to PDF:
    │ (save)        │  - White rectangle over old text area
    │               │  - New text drawn in matched position/size
    │               │  - Or: flatten annotations as image layer
    └──────────────┘
```

**The result:** User opens a scanned contract, clicks on a date, changes it from "March 1" to "March 15", clicks Save. Done. Just like editing a Word document.

---

## How the Image Editor Works

```
User opens an image (PNG, JPG, etc.)
         │
         ▼
    ┌──────────────┐
    │ Konva.js      │  Load image onto layered canvas
    │ (layers)      │  Layer 0: Original image
    │               │  Layer 1: Adjustments
    │               │  Layer 2: Drawing
    │               │  Layer 3: Text
    └──────┬───────┘
           │
    User applies edits:
    ├── Crop/Resize/Rotate → Konva transforms
    ├── Brightness/Contrast → Konva built-in filters
    ├── Artistic filters → CamanJS / Pixels.js
    ├── Draw/Paint → Konva freehand + perfect-freehand
    ├── Add text → Konva.Text objects
    ├── Select region → magic-wand-js / lasso
    ├── Remove background → @imgly/background-removal
    └── Color pick → EyeDropper API
           │
           ▼
    ┌──────────────┐
    │ Export        │  canvas.toBlob() → PNG/JPEG/WebP
    │               │  Or embed into PDF via pdf-lib
    └──────────────┘
```

---

## Summary: Total Product Count

| Category | # of Products | Cost |
|----------|-------------|------|
| PDF viewing & editing | 4 libraries | Free |
| Smart OCR (AI) | 3 libraries | Free |
| Layout analysis | 2 libraries | Free |
| Font handling | 3 libraries | Free |
| Canvas & annotations | 1 library | Free |
| Digital signatures | 2 libraries | Free |
| Image editor core | 2 libraries | Free |
| Image filters | 3 libraries | Free |
| Selection tools | 2 libraries | Free |
| Drawing tools | 1 library | Free |
| AI background removal | 3 libraries | Free |
| Color picker | 1 library | Free |
| Cross-platform | 5 packages | Free |
| Build tools | 9 packages | Free |
| Python backend | 9 packages | Free |
| System tools | 3 tools | Free |
| **Services/accounts** | **5 accounts** | **~$136/yr** |
| **TOTAL** | **~48 products** | **~$136/year** |

All third-party libraries used are open-source. The only recurring costs are domain registration and app store accounts.
