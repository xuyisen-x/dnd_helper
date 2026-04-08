use rusqlite::Connection;
use serde::Serialize;
use std::fs;
use tauri::Manager;

// 建议将数据库文件名提取为常量
const DB_NAME: &str = "dnd_history.db";
const LIMIT_NUM: i32 = 50; // 获取最近文件的默认数量

fn get_db_connection(app: &tauri::AppHandle) -> Result<Connection, String> {
    // 获取系统标准的应用数据目录
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    // 如果目录不存在，创建它
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    }
    // 数据库文件的完整路径
    let db_path = app_dir.join(DB_NAME);

    // 打开连接
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    // 设置5秒的忙等待，避免数据库被锁时立即报错
    conn.busy_timeout(std::time::Duration::from_secs(5))
        .map_err(|e| e.to_string())?;

    // 开启WAL模式和适度的同步策略，提升并发性能
    conn.execute_batch(
        "PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;",
    )
    .map_err(|e| e.to_string())?;

    Ok(conn)
}

fn prune_file_history(conn: &Connection) {
    let sql = "
        DELETE FROM file_history 
        WHERE id NOT IN (
            SELECT id 
            FROM file_history 
            ORDER BY last_opened DESC 
            LIMIT 50
        );
    ";

    // 执行删除语句，忽略可能发生的非致命错误
    let _ = conn.execute(sql, ());
}

// 初始化数据库，这个函数必须是同步的，因为它在应用启动阶段被调用，而且一定要先于任何可能访问数据库的操作执行
pub fn init_db(app: &tauri::AppHandle) -> Result<(), String> {
    let conn = get_db_connection(app)?;

    // 建表：使用 INSERT OR REPLACE 策略，所以 path 设为 UNIQUE
    conn.execute(
        "CREATE TABLE IF NOT EXISTS file_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT UNIQUE NOT NULL,
            last_opened DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        (),
    )
    .map_err(|e| e.to_string())?;

    // 手动创建时间戳索引，优化按时间排序的查询性能
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_last_opened ON file_history(last_opened);",
        (),
    )
    .map_err(|e| e.to_string())?;

    prune_file_history(&conn); // 启动时清理历史记录，保持数据库轻量

    Ok(())
}

// 在文件被打开或者保存时调用这个函数，记录文件路径和打开时间
pub fn record_file_open_history(app: &tauri::AppHandle, file_path: &str) {
    let app_clone = app.clone();
    let file_path_clone = file_path.to_string();

    // 使用 spawn_blocking 处理所有的同步 SQLite 操作，尽量避免阻塞
    // 记录文件打开历史并不是性能敏感的操作，所以即使偶尔有点延迟也不会影响用户体验
    tauri::async_runtime::spawn_blocking(move || {
        if let Ok(conn) = get_db_connection(&app_clone) {
            let _ = conn.execute(
                "INSERT INTO file_history (path, last_opened) 
                 VALUES (?1, CURRENT_TIMESTAMP)
                 ON CONFLICT(path) DO UPDATE SET last_opened = CURRENT_TIMESTAMP",
                (file_path_clone,),
            );
            prune_file_history(&conn);
        }
    });
}

// 文件打开失败的时候调用这个函数，删除历史记录中的对应项，保持历史列表的准确性
pub fn remove_file_from_history(app: &tauri::AppHandle, file_path: &str) {
    let app_clone = app.clone();
    let file_path_clone = file_path.to_string();

    tauri::async_runtime::spawn_blocking(move || {
        if let Ok(conn) = get_db_connection(&app_clone) {
            let _ = conn.execute(
                "DELETE FROM file_history WHERE path = ?1",
                (file_path_clone,),
            );
        }
    });
}

#[tauri::command]
pub async fn manual_remove_history(app: tauri::AppHandle, file_path: String) -> Result<(), String> {
    remove_file_from_history(&app, &file_path);
    Ok(())
}

// 暴露给前端的命令，用于获取最近打开的文件列表
#[derive(Serialize)]
pub struct FileHistoryEntry {
    pub id: i32,
    pub path: String,
    pub last_opened: String, // SQLite 的 CURRENT_TIMESTAMP 是字符串格式，前端可以直接 new Date() 解析
}

#[tauri::command]
pub async fn get_recent_files(app: tauri::AppHandle) -> Result<Vec<FileHistoryEntry>, String> {
    let app_clone = app.clone();

    // 把耗时的磁盘读取和 SQL 执行扔进后台阻塞池
    let entries =
        tauri::async_runtime::spawn_blocking(move || -> Result<Vec<FileHistoryEntry>, String> {
            let conn = get_db_connection(&app_clone)?;

            // 准备查询语句，按时间倒序，并限制条数
            let mut stmt = conn
                .prepare(
                    "SELECT id, path, last_opened 
             FROM file_history 
             ORDER BY last_opened DESC 
             LIMIT ?1",
                )
                .map_err(|e| e.to_string())?;

            // 执行查询并把每一行（Row）映射成我们的 FileHistoryEntry 结构体
            let history_iter = stmt
                .query_map([LIMIT_NUM], |row| {
                    Ok(FileHistoryEntry {
                        id: row.get(0)?,
                        path: row.get(1)?,
                        last_opened: row.get(2)?,
                    })
                })
                .map_err(|e| e.to_string())?;

            // 收集结果
            let results: Vec<FileHistoryEntry> = history_iter
                .filter_map(|entry| entry.ok()) // 过滤掉可能的错误行
                .collect();

            Ok(results)
        })
        .await
        .map_err(|e| format!("后台线程执行失败: {}", e))??;
    // 注意这里有两个 ??，第一个处理 spawn_blocking 的失败，第二个处理内部闭包的失败

    Ok(entries)
}
