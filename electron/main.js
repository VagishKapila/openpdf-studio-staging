/**
 * Electron Main Process (Alternative to Tauri)
 *
 * Use this if Tauri doesn't work for your setup.
 * Tauri is recommended for production (smaller bundle, less memory).
 * Electron is easier to set up for development/prototyping.
 *
 * To use Electron instead of Tauri:
 * 1. npm install electron electron-builder --save-dev
 * 2. Add "main": "electron/main.js" to package.json
 * 3. Add scripts: "electron:dev": "electron .", "electron:build": "electron-builder"
 */

const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Recent files storage
const RECENT_FILES_PATH = path.join(app.getPath('userData'), 'recent-files.json');
const MAX_RECENT_FILES = 12;

function getRecentFiles() {
  try {
    if (fs.existsSync(RECENT_FILES_PATH)) {
      const data = JSON.parse(fs.readFileSync(RECENT_FILES_PATH, 'utf8'));
      // Filter out files that no longer exist
      return data.filter(f => fs.existsSync(f.path));
    }
  } catch(e) { console.error('Error reading recent files:', e); }
  return [];
}

function saveRecentFiles(files) {
  try {
    fs.writeFileSync(RECENT_FILES_PATH, JSON.stringify(files, null, 2));
  } catch(e) { console.error('Error saving recent files:', e); }
}

function addRecentFile(fileInfo) {
  let recent = getRecentFiles();
  // Remove existing entry with same path
  recent = recent.filter(f => f.path !== fileInfo.path);
  // Add to front
  recent.unshift({
    path: fileInfo.path,
    name: fileInfo.name || path.basename(fileInfo.path),
    size: fileInfo.size || 0,
    date: new Date().toISOString(),
    type: fileInfo.type || (fileInfo.path.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'),
  });
  // Limit
  recent = recent.slice(0, MAX_RECENT_FILES);
  saveRecentFiles(recent);
  updateRecentFilesMenu();
  return recent;
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'DocPix Studio',
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    // Modern look
    titleBarStyle: 'hiddenInset', // macOS
    backgroundColor: '#0f172a',
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Custom menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const { filePaths } = await dialog.showOpenDialog(mainWindow, {
              filters: [
                { name: 'PDF Files', extensions: ['pdf'] },
                { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'] },
                { name: 'All Files', extensions: ['*'] },
              ],
              properties: ['openFile'],
            });
            if (filePaths.length > 0) {
              mainWindow.webContents.send('file-opened', filePaths[0]);
              try {
                const stats = fs.statSync(filePaths[0]);
                addRecentFile({ path: filePaths[0], name: path.basename(filePaths[0]), size: stats.size });
              } catch(e) {}
            }
          },
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('save-file'),
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: async () => {
            const { filePath } = await dialog.showSaveDialog(mainWindow, {
              filters: [
                { name: 'PDF Files', extensions: ['pdf'] },
                { name: 'PNG Image', extensions: ['png'] },
              ],
            });
            if (filePath) {
              mainWindow.webContents.send('save-file-as', filePath);
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Print...',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow.webContents.print(),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => mainWindow.webContents.send('zoom-in'),
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow.webContents.send('zoom-out'),
        },
        {
          label: 'Fit to Window',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow.webContents.send('zoom-fit'),
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About DocPix Studio',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About DocPix Studio',
              message: 'DocPix Studio v0.1.0',
              detail: 'AI-powered PDF & Image Editor. Free core features, premium tools available.\n\nLicense: MIT\nhttps://github.com/VagishKapila/openpdf-studio',
            });
          },
        },
        {
          label: 'GitHub Repository',
          click: () => {
            require('electron').shell.openExternal('https://github.com/your-username/openpdf-studio');
          },
        },
      ],
    },
  ];

  // macOS specific menu
  if (process.platform === 'darwin') {
    menuTemplate.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

function updateRecentFilesMenu() {
  // This rebuilds the application menu with updated recent files
  // Called after each file open/clear
  const recent = getRecentFiles();
  const recentSubmenu = recent.length > 0
    ? [
        ...recent.map(f => ({
          label: f.name,
          sublabel: f.path,
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('file-opened', f.path);
              addRecentFile(f);
            }
          }
        })),
        { type: 'separator' },
        { label: 'Clear Recent Files', click: () => { saveRecentFiles([]); updateRecentFilesMenu(); } },
      ]
    : [{ label: 'No Recent Files', enabled: false }];

  // Rebuild menu with recent files
  // Get the current menu template structure
  const appMenu = Menu.getApplicationMenu();
  if (appMenu) {
    const fileMenu = appMenu.items.find(item => item.label === 'File');
    if (fileMenu && fileMenu.submenu) {
      // Try to find existing Recent Files menu or insert new one
      const recentIndex = fileMenu.submenu.items.findIndex(item => item.label === 'Recent Files');
      if (recentIndex >= 0) {
        fileMenu.submenu.items[recentIndex] = { label: 'Recent Files', submenu: recentSubmenu };
      } else {
        // Insert after Open
        fileMenu.submenu.items.splice(1, 0, { label: 'Recent Files', submenu: recentSubmenu });
        fileMenu.submenu.items.splice(2, 0, { type: 'separator' });
      }
      Menu.setApplicationMenu(appMenu);
    }
  }
}

// IPC Handlers for native file operations
ipcMain.handle('read-file', async (event, filePath) => {
  return fs.readFileSync(filePath);
});

ipcMain.handle('write-file', async (event, filePath, data) => {
  fs.writeFileSync(filePath, Buffer.from(data));
  return true;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  return dialog.showSaveDialog(mainWindow, options);
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  return dialog.showOpenDialog(mainWindow, options);
});

ipcMain.handle('get-recent-files', () => getRecentFiles());

ipcMain.handle('add-recent-file', (event, fileInfo) => addRecentFile(fileInfo));

ipcMain.handle('clear-recent-files', () => {
  saveRecentFiles([]);
  updateRecentFilesMenu();
  return true;
});

ipcMain.handle('remove-recent-file', (event, filePath) => {
  let recent = getRecentFiles();
  recent = recent.filter(f => f.path !== filePath);
  saveRecentFiles(recent);
  updateRecentFilesMenu();
  return recent;
});

ipcMain.handle('open-file-path', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);
    addRecentFile({ path: filePath, name: path.basename(filePath), size: stats.size });
    return { data: data.buffer, name: path.basename(filePath), size: stats.size };
  } catch(e) {
    return { error: e.message };
  }
});

ipcMain.handle('get-app-version', () => app.getVersion());

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Handle file open via OS (double-click PDF to open in app)
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send('file-opened', filePath);
    try {
      const stats = fs.statSync(filePath);
      addRecentFile({ path: filePath, name: path.basename(filePath), size: stats.size });
    } catch(e) {}
  }
});
