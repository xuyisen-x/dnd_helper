use rfd::FileDialog;
use std::collections::HashMap;
use std::fs; // 需要引入 serde 进行结构体序列化

use std::sync::Mutex;

// 状态，用于记录 窗口Label -> 对应文件路径 的映射关系
pub struct WindowFiles(pub Mutex<HashMap<String, String>>);

#[tauri::command]
pub async fn load_character_from_disk(
    window: tauri::Window, // 注入当前窗口
    state: tauri::State<'_, WindowFiles>,
) -> Result<String, String> {
    let file_path = FileDialog::new()
        .add_filter("DND 角色卡", &["crst"])
        .pick_file();

    match file_path {
        Some(path) => match fs::read_to_string(&path) {
            Ok(content) => {
                // 更新状态中的映射关系
                let label = window.label().to_string();
                let mut map_lock = state.0.lock().unwrap();
                map_lock.insert(label, path.to_string_lossy().to_string());
                Ok(content)
            }
            Err(e) => Err(format!("文件读取失败: {}", e)),
        },
        None => Err("CANCELLED".to_string()),
    }
}

#[tauri::command]
pub async fn save_character_to_disk(
    window: tauri::Window, // 注入当前窗口
    state: tauri::State<'_, WindowFiles>,
    data_str: String,
    default_filename: String,
) -> Result<(), String> {
    let file_path = FileDialog::new()
        .set_file_name(&default_filename)
        .add_filter("DND 角色卡", &["crst"])
        .save_file();

    match file_path {
        Some(path) => {
            match fs::write(&path, data_str) {
                Ok(_) => {
                    // 更新状态中的映射关系
                    let label = window.label().to_string();
                    let mut map_lock = state.0.lock().unwrap();
                    map_lock.insert(label, path.to_string_lossy().to_string());
                    Ok(())
                }
                Err(e) => Err(format!("文件写入失败: {}", e)),
            }
        }
        None => Err("CANCELLED".to_string()),
    }
}

#[tauri::command]
pub async fn silent_save_to_disk(
    window: tauri::Window, // 注入当前窗口
    state: tauri::State<'_, WindowFiles>,
    data_str: String,
) -> Result<(), String> {
    // 从状态中获取当前窗口对应的文件路径
    let label = window.label();
    let map_lock = state.0.lock().unwrap();
    match map_lock.get(label) {
        Some(p) => fs::write(p, data_str).map_err(|e| format!("自动保存失败: {}", e)),
        None => return Err("没有关联的文件路径，无法自动保存".to_string()),
    }
}

#[tauri::command]
pub async fn get_initial_file(
    window: tauri::Window,
    state: tauri::State<'_, WindowFiles>,
) -> Result<Option<String>, String> {
    let label = window.label();
    let map_lock = state.0.lock().unwrap();

    match map_lock.get(label) {
        None => Ok(None), // Blank window
        Some(path) => match fs::read_to_string(&path) {
            Ok(content) => Ok(Some(content)),
            Err(e) => Err(format!("文件读取失败: {}", e)),
        },
    }
}
