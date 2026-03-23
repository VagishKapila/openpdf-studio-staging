// Tauri main window setup with commands for file operations and PDF handling
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::path::{Path, PathBuf};
use std::fs;
use serde::{Deserialize, Serialize};
use std::process::Command;

mod commands;
use commands::*;

#[derive(Debug, Serialize, Deserialize)]
struct FileInfo {
    path: String,
    name: String,
    size: u64,
    is_dir: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct OperationResult {
    success: bool,
    message: String,
    data: Option<serde_json::Value>,
}

/// Read file contents from the filesystem
/// Usage: invoke('read_file', { path: '/path/to/file' })
#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

/// Write file contents to the filesystem
/// Usage: invoke('write_file', { path: '/path/to/file', contents: 'data' })
#[tauri::command]
fn write_file(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, &contents)
        .map_err(|e| format!("Failed to write file: {}", e))
}

/// List directory contents
/// Usage: invoke('list_dir', { path: '/path/to/dir' })
#[tauri::command]
fn list_dir(path: String) -> Result<Vec<FileInfo>, String> {
    let entries = fs::read_dir(&path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    let mut files = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let metadata = entry.metadata()
            .map_err(|e| format!("Failed to get metadata: {}", e))?;

        let path = entry.path();
        let name = path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        files.push(FileInfo {
            path: path.to_string_lossy().to_string(),
            name,
            size: metadata.len(),
            is_dir: metadata.is_dir(),
        });
    }

    Ok(files)
}

/// Copy a file from source to destination
/// Usage: invoke('copy_file', { src: '/path/to/src', dest: '/path/to/dest' })
#[tauri::command]
fn copy_file(src: String, dest: String) -> Result<(), String> {
    fs::copy(&src, &dest)
        .map_err(|e| format!("Failed to copy file: {}", e))?;
    Ok(())
}

/// Delete a file
/// Usage: invoke('delete_file', { path: '/path/to/file' })
#[tauri::command]
fn delete_file(path: String) -> Result<(), String> {
    fs::remove_file(&path)
        .map_err(|e| format!("Failed to delete file: {}", e))
}

/// Encrypt a PDF file using qpdf
/// Note: Requires qpdf to be installed on the system
/// Usage: invoke('encrypt_pdf', { input_path: '/path/to/input.pdf', output_path: '/path/to/output.pdf', password: 'secret123' })
#[tauri::command]
fn encrypt_pdf(input_path: String, output_path: String, password: String) -> Result<OperationResult, String> {
    // Check if qpdf is available on the system
    let qpdf_check = Command::new("qpdf")
        .arg("--version")
        .output();

    if qpdf_check.is_err() {
        return Ok(OperationResult {
            success: false,
            message: "qpdf is not installed. Please install qpdf to use PDF encryption.".to_string(),
            data: None,
        });
    }

    // Run qpdf with encryption parameters
    let output = Command::new("qpdf")
        .arg("--encrypt")
        .arg(&password)
        .arg(&password)
        .arg("256")
        .arg("--")
        .arg(&input_path)
        .arg(&output_path)
        .output()
        .map_err(|e| format!("Failed to execute qpdf: {}", e))?;

    if output.status.success() {
        Ok(OperationResult {
            success: true,
            message: "PDF encrypted successfully".to_string(),
            data: Some(serde_json::json!({
                "output_path": output_path
            })),
        })
    } else {
        let error_msg = String::from_utf8_lossy(&output.stderr).to_string();
        Ok(OperationResult {
            success: false,
            message: format!("PDF encryption failed: {}", error_msg),
            data: None,
        })
    }
}

/// Decrypt a PDF file using qpdf
/// Usage: invoke('decrypt_pdf', { input_path: '/path/to/input.pdf', output_path: '/path/to/output.pdf', password: 'secret123' })
#[tauri::command]
fn decrypt_pdf(input_path: String, output_path: String, password: String) -> Result<OperationResult, String> {
    let qpdf_check = Command::new("qpdf")
        .arg("--version")
        .output();

    if qpdf_check.is_err() {
        return Ok(OperationResult {
            success: false,
            message: "qpdf is not installed. Please install qpdf to use PDF decryption.".to_string(),
            data: None,
        });
    }

    let output = Command::new("qpdf")
        .arg("--password=" + &password)
        .arg("--empty-password-is-explicit")
        .arg(&input_path)
        .arg(&output_path)
        .output()
        .map_err(|e| format!("Failed to execute qpdf: {}", e))?;

    if output.status.success() {
        Ok(OperationResult {
            success: true,
            message: "PDF decrypted successfully".to_string(),
            data: Some(serde_json::json!({
                "output_path": output_path
            })),
        })
    } else {
        let error_msg = String::from_utf8_lossy(&output.stderr).to_string();
        Ok(OperationResult {
            success: false,
            message: format!("PDF decryption failed: {}", error_msg),
            data: None,
        })
    }
}

/// Get file metadata
/// Usage: invoke('get_file_info', { path: '/path/to/file' })
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
        .invoke_handler(tauri::generate_handler![
            read_file,
            write_file,
            list_dir,
            copy_file,
            delete_file,
            encrypt_pdf,
            decrypt_pdf,
            get_file_info,
        ])
        .setup(|app| {
            // Set up any app-wide initialization here
            log::info!("OpenPDF Studio starting up");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
