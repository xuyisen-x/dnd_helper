mod file_manager;

use std::{
    collections::{HashMap, HashSet},
    sync::{
        atomic::{AtomicUsize, Ordering},
        Mutex,
    },
};

use file_manager::{
    get_initial_file, load_character_from_disk, save_character_to_disk, silent_save_to_disk,
    WindowFiles,
};
use tauri::{Emitter, Manager}; // 别忘了引入宏

static WINDOW_COUNTER: AtomicUsize = AtomicUsize::new(1);

// 状态，用于记录哪些没有绑定文件路径的窗口已经被修改了（脏窗口）
struct DirtyWindows(pub Mutex<HashSet<String>>);
struct AppWindows(pub Mutex<HashSet<String>>);

// 寻找一个既没有绑定文件（不在 map 中），也没有被编辑过（不在 dirty_set 中）的空白窗口
fn find_blank_window(app: &tauri::AppHandle) -> Option<String> {
    let all_windows = app.state::<AppWindows>();
    let all_set = all_windows.0.lock().unwrap();

    let file_state = app.state::<WindowFiles>();
    let map = file_state.0.lock().unwrap();

    let dirty_state = app.state::<DirtyWindows>();
    let dirty_set = dirty_state.0.lock().unwrap();

    // 遍历花名册中的标签
    for label in all_set.iter() {
        if !map.contains_key(label) && !dirty_set.contains(label) {
            return Some(label.clone()); // 找到纯净的空白窗标签！
        }
    }
    None
}

fn create_app_window(app: &tauri::AppHandle, file_path: Option<String>) {
    let state = app.state::<WindowFiles>();

    // 1. 防止多开，遍历HashMap，如果已经被打开，激活对应窗口即可
    if let Some(target_path) = &file_path {
        let map_lock = state.0.lock().unwrap();
        let label = map_lock.iter().find_map(|(k, v)| {
            if v == target_path {
                Some(k.clone())
            } else {
                None
            }
        });
        if let Some(label) = label {
            if let Some(window) = app.get_webview_window(&label) {
                window.show().ok();
                window.set_focus().ok();
                return;
            }
        }
    }

    // 2. 劫持不脏的空白窗口（如果有），避免重复打开多个窗口
    if let Some(path) = &file_path {
        if let Some(blank_label) = find_blank_window(app) {
            // 劫持它！更新映射表
            let state = app.state::<WindowFiles>();
            state
                .0
                .lock()
                .unwrap()
                .insert(blank_label.clone(), path.clone());

            // 尝试通知前端（冷启动时底层可能还没建好，没关系，前端会主动拉取）
            if let Some(blank_window) = app.get_webview_window(&blank_label) {
                let _ = blank_window.emit("hijack-file", path.clone());
            }

            return; // 劫持成功，无需再建新窗
        }
    }

    // 3. 生成一个唯一的窗口Label，并直接写入状态（防止竞态条件）
    let label = format!(
        "sheet-window_{}",
        WINDOW_COUNTER.fetch_add(1, Ordering::Relaxed)
    );
    app.state::<AppWindows>()
        .0
        .lock()
        .unwrap()
        .insert(label.clone());
    // 4. 没有被打开，创建新窗口
    tauri::WebviewWindowBuilder::new(
        app,
        label.clone(),
        tauri::WebviewUrl::App("index.html".into()),
    )
    .title("DND电子角色卡")
    .inner_size(1200.0, 800.0)
    .resizable(true)
    .fullscreen(false)
    .build()
    .expect("failed to create window");

    // 5. 创建成功后，记录窗口与文件的绑定关系
    if let Some(path) = file_path {
        let mut map_lock = state.0.lock().unwrap();
        map_lock.insert(label, path);
    }
}

#[tauri::command]
fn mark_window_dirty(window: tauri::Window, state: tauri::State<'_, DirtyWindows>) {
    state.0.lock().unwrap().insert(window.label().to_string());
}

#[tauri::command]
fn new_window(app: tauri::AppHandle) {
    create_app_window(&app, None);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .manage(WindowFiles(Mutex::new(HashMap::new())))
        .manage(DirtyWindows(Mutex::new(HashSet::new())))
        .manage(AppWindows(Mutex::new(HashSet::new())))
        .plugin(tauri_plugin_single_instance::init(|app_handle, args, _| {
            // 🌟 时机 A：Windows/Linux 已运行时的二次启动
            if args.len() > 1 && args[1].ends_with(".crst") {
                create_app_window(app_handle, Some(args[1].clone()));
            } else {
                create_app_window(app_handle, None);
            }
        }))
        .setup(|app| {
            // 🌟 时机 B：Windows/Linux 冷启动
            let args: Vec<String> = std::env::args().collect();
            if args.len() > 1 && args[1].ends_with(".crst") {
                create_app_window(app.handle(), Some(args[1].clone()));
            } else {
                if app.state::<AppWindows>().0.lock().unwrap().is_empty() {
                    create_app_window(app.handle(), None); // 冷启动时没有文件参数，给个新空白页
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_character_to_disk,
            load_character_from_disk,
            silent_save_to_disk,
            get_initial_file,
            mark_window_dirty,
            new_window
        ]);

    let app = builder
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(|app_handle, event| {
        match event {
            // 🌟 时机 C：macOS 双击文件
            tauri::RunEvent::Opened { urls } => {
                urls.into_iter().for_each(|url| {
                    if let Ok(path) = url.to_file_path() {
                        let path_str = path.to_string_lossy().to_string();
                        if path_str.ends_with(".crst") {
                            create_app_window(app_handle, Some(path_str));
                        }
                    }
                });
            }
            // 关闭窗口时，从状态中移除对应关系
            tauri::RunEvent::WindowEvent {
                label,
                event: window_event,
                ..
            } => {
                if let tauri::WindowEvent::Destroyed = window_event {
                    app_handle
                        .state::<WindowFiles>()
                        .0
                        .lock()
                        .unwrap()
                        .remove(&label);
                    app_handle
                        .state::<DirtyWindows>()
                        .0
                        .lock()
                        .unwrap()
                        .remove(&label);
                    app_handle
                        .state::<AppWindows>()
                        .0
                        .lock()
                        .unwrap()
                        .remove(&label);
                }
            }
            _ => {}
        }
    })
}
