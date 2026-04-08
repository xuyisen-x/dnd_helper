use rfd::FileDialog;
use std::collections::HashMap;
use tauri::Manager;
use tokio::fs;

use std::sync::Mutex;

use crate::database_manager::{record_file_open_history, remove_file_from_history};

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
        Some(path) => {
            // 复用load_target_character_from_disk，dont repeat yourself
            load_target_character_from_disk(window, state, path.to_string_lossy().to_string()).await
        }
        None => Err("CANCELLED".to_string()),
    }
}

#[tauri::command]
pub async fn load_target_character_from_disk(
    window: tauri::Window, // 注入当前窗口
    state: tauri::State<'_, WindowFiles>,
    file_path: String,
) -> Result<String, String> {
    match fs::read_to_string(&file_path).await {
        Ok(content) => {
            // 更新状态中的映射关系
            let label = window.label().to_string();
            let mut map_lock = state.0.lock().unwrap();
            map_lock.insert(label, file_path.clone());
            // 保存历史记录
            record_file_open_history(&window.app_handle(), &file_path);
            Ok(content)
        }
        Err(e) => {
            // 读取失败时，如果之前有记录的路径，尝试删除历史记录中的对应项
            remove_file_from_history(&window.app_handle(), &file_path);
            Err(format!("文件读取失败: {}", e))
        }
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
            match fs::write(&path, data_str).await {
                Ok(_) => {
                    // 更新状态中的映射关系
                    let label = window.label().to_string();
                    let mut map_lock = state.0.lock().unwrap();
                    map_lock.insert(label, path.to_string_lossy().to_string());
                    // 保存历史记录
                    record_file_open_history(&window.app_handle(), &path.to_string_lossy());
                    Ok(())
                }
                Err(e) => {
                    // 保存失败时，如果之前有记录的路径，尝试删除历史记录中的对应项
                    remove_file_from_history(&window.app_handle(), &path.to_string_lossy());
                    Err(format!("文件写入失败: {}", e))
                }
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
    let file_path = {
        let map_lock = state.0.lock().unwrap();
        map_lock.get(label).cloned()
    };
    match file_path {
        Some(p) => {
            let result = fs::write(&p, data_str).await;
            match result {
                Ok(_) => {
                    // 保存历史记录
                    record_file_open_history(&window.app_handle(), p.as_str());
                    Ok(())
                }
                Err(e) => {
                    // 保存失败时，如果之前有记录的路径，尝试删除历史记录中的对应项
                    remove_file_from_history(&window.app_handle(), p.as_str());
                    Err(format!("自动保存失败: {}", e))
                }
            }
        }
        None => return Err("没有关联的文件路径，无法自动保存".to_string()),
    }
}

#[tauri::command]
pub async fn get_initial_file(
    window: tauri::Window,
    state: tauri::State<'_, WindowFiles>,
) -> Result<Option<String>, String> {
    let label = window.label();

    let file_path = {
        let map_lock = state.0.lock().unwrap();
        map_lock.get(label).cloned()
    };

    match file_path {
        None => Ok(None), // Blank window
        Some(path) => match fs::read_to_string(&path).await {
            Ok(content) => {
                // 保存历史记录
                record_file_open_history(&window.app_handle(), path.as_str());
                Ok(Some(content))
            }
            Err(e) => {
                // 保存失败时，如果之前有记录的路径，尝试删除历史记录中的对应项
                remove_file_from_history(&window.app_handle(), path.as_str());
                Err(format!("文件读取失败: {}", e))
            }
        },
    }
}
