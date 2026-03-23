// OpenPDF Studio — Tauri v2 desktop app
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct FileInfo {
    path: String,
    name: String,
    size: u64,
    is_dir: bool,
}

/// Read file contents from the filesystem
#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

/// Write file contents to the filesystem
#[tauri::command]
fn write_file(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, &contents)
        .map_err(|e| format!("Failed to write file: {}", e))
}

/// List directory contents
#[tauri::command]
fn list_dir(path: String) -> Result<Vec<FileInfo>, String> {
    let entries = fs::read_dir(&path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    let mut files = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let metadata = entry.metadata()
            .map_err(|e| format!("Failed to get metadata: {}", e))?;

        let p = entry.path();
        let name = p.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        files.push(FileInfo {
            path: p.to_string_lossy().to_string(),
            name,
            size: metadata.len(),
            is_dir: metadata.is_dir(),
        });
    }
    Ok(files)
}

/// Copy a file
#[tauri::command]
fn copy_file(src: String, dest: String) -> Result<(), String> {
    fs::copy(&src, &dest)
        .map_err(|e| format!("Failed to copy file: {}", e))?;
    Ok(())
}

/// Delete a file
#[tauri::command]
fn delete_file(path: String) -> Result<(), String> {
    fs::remove_file(&path)
        .map_err(|e| format!("Failed to delete file: {}", e))
}

/// Get file metadata
#[tauri::command]
fn get_file_info(path: String) -> Result<FileInfo, String> {
    let metadata = fs::metadata(&path)
        .map_err(|e| format!("Failed to get metadata: {}", e))?;

    let path_obj = Path::new(&path);
    let name = path_obj.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();

    Ok(FileInfo {
        path,
        name,
        size: metadata.len(),
        is_dir: metadata.is_dir(),
    })
}

fn main() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            read_file,
            write_file,
            list_dir,
            copy_file,
            delete_file,
            get_file_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
