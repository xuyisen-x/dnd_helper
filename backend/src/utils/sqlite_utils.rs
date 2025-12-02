use std::str::FromStr;
use std::time::Duration;
use sqlx::{Pool, Sqlite};
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions};

use sqlx::FromRow;
use chrono::NaiveDateTime;

#[derive(Debug, FromRow)]
pub struct User {
    pub user_id: i64,
    pub username: String,
    pub password_hash: String,
}

#[derive(Debug, FromRow)]
pub struct CharacterSheet {
    pub sheet_id: i64,
    pub name: String,
    pub oss_key: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub owner_id: i64,
}

#[derive(Debug, FromRow)]
pub struct Permission {
    pub card_id: i64,
    pub user_id: i64,
    pub permission_level: i64,
}

async fn init_tables(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
    // --- 表 1: 用户表 ---
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL
        );
        "#
    ).execute(pool).await?;

    // --- 表 2: 角色卡表 ---
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS character_sheets (
            sheet_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            oss_key TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            owner_id INTEGER NOT NULL,
            FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE
        );
        "#
    ).execute(pool).await?;

    // --- 自动化触发器---
    sqlx::query(
        r#"
        CREATE TRIGGER IF NOT EXISTS update_character_sheets_timestamp
        AFTER UPDATE ON character_sheets
        FOR EACH ROW
        WHEN old.updated_at = new.updated_at
        BEGIN
            UPDATE character_sheets SET updated_at = CURRENT_TIMESTAMP WHERE sheet_id = old.sheet_id;
        END;
        "#
    ).execute(pool).await?;

    // --- 表 3: 权限表 ---
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS permissions (
            sheet_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            permission_level INTEGER NOT NULL,
            PRIMARY KEY (sheet_id, user_id),
            FOREIGN KEY (sheet_id) REFERENCES character_sheets(sheet_id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        );
        "#
    ).execute(pool).await?;

    Ok(())
}

pub async fn init_sqlite(max_database_connections: u32, sqlite_db_url: &str) -> Result<Pool<Sqlite>, sqlx::Error> {
    let connection_options =
        SqliteConnectOptions::from_str(sqlite_db_url)?
            // 关键设置：如果文件不存在，自动创建
            .create_if_missing(true)
            // 开启 WAL 模式。
            .journal_mode(SqliteJournalMode::Wal)
            // 开启外键约束
            .foreign_keys(true)
            // 稍微调高一点忙等待时间，避免高并发时偶尔的 "database is locked"
            .busy_timeout(Duration::from_secs(5));
    let pool = SqlitePoolOptions::new()
        .max_connections(max_database_connections)
        .connect_with(connection_options)
        .await?;

    init_tables(&pool).await?;

    Ok(pool)
}