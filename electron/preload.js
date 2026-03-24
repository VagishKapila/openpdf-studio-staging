const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFile: (filePath) => ipcRenderer.invoke('open-file-path', filePath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),

  // Recent files
  getRecentFiles: () => ipcRenderer.invoke('get-recent-files'),
  addRecentFile: (fileInfo) => ipcRenderer.invoke('add-recent-file', fileInfo),
  clearRecentFiles: () => ipcRenderer.invoke('clear-recent-files'),
  removeRecentFile: (filePath) => ipcRenderer.invoke('remove-recent-file', filePath),

  // Events from main process
  onFileOpened: (callback) => ipcRenderer.on('file-opened', (event, filePath) => callback(filePath)),
  onSaveFile: (callback) => ipcRenderer.on('save-file', () => callback()),
  onSaveFileAs: (callback) => ipcRenderer.on('save-file-as', (event, filePath) => callback(filePath)),

  // App info
  isElectron: true,
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
});
