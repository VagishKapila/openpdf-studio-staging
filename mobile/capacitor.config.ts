import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.openpdfstudio.app',
  appName: 'OpenPDF Studio',
  webDir: '../dist',
  server: {
    // During development, use the Vite dev server
    // url: 'http://localhost:5173',
    // cleartext: true,
  },
  plugins: {
    // Camera plugin for document scanning
    Camera: {
      presentationStyle: 'fullScreen',
    },
    // File system access
    Filesystem: {
      directory: 'Documents',
    },
    // Share PDFs with other apps
    Share: {},
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    // Dark status bar to match our dark theme
    preferredContentMode: 'mobile',
  },
  android: {
    // Allow opening files from other apps
    allowMixedContent: false,
    captureInput: false,
    // Dark theme
    backgroundColor: '#0f172a',
    // Handle PDF file intents
    // Add to AndroidManifest.xml:
    // <intent-filter>
    //   <action android:name="android.intent.action.VIEW" />
    //   <category android:name="android.intent.category.DEFAULT" />
    //   <data android:mimeType="application/pdf" />
    // </intent-filter>
  },
};

export default config;
