// OpenPDF Studio Library Module
// This module provides shared functionality for the Tauri application

pub mod commands;

/// Version information for OpenPDF Studio
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const APP_NAME: &str = "OpenPDF Studio";
pub const AUTHOR: &str = "VagishKapila";

/// Initialize the library
pub fn init() {
    log::info!("Initializing {} v{}", APP_NAME, VERSION);
}
