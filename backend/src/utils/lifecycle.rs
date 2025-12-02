use tokio::fs;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};
use crate::constants::*;
use std::env;
use crate::utils::sqlite_utils::init_sqlite;
use crate::utils::app_state::AppState;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct AppConfig {
    #[serde(default = "default_static_port")]
    pub static_port: u16,
    #[serde(default = "default_api_port")]
    pub api_port: u16,
    #[serde(default = "default_max_database_connections")]
    pub max_database_connections: u32,
    #[serde(default = "default_log_level")]
    pub log_level: String,
    #[serde(default = "default_sqlite_db_url")]
    pub sqlite_db_url: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            static_port: default_static_port(),
            api_port: default_api_port(),
            max_database_connections: default_max_database_connections(),
            log_level: default_log_level(),
            sqlite_db_url: default_sqlite_db_url(),
        }
    }
}

async fn read_config() -> AppConfig {
    let mut warning_messages: Vec<String> = vec![];

    let app_config = match fs::read_to_string(CONFIG_FILE_PATH).await {
        Ok(content) => {
            toml::from_str::<AppConfig>(&content).unwrap_or_else(
                |e| {
                    warning_messages.push(format!(
                        "Failed to parse config file at '{}': {}. Using default configuration.",
                        CONFIG_FILE_PATH, e
                    ));
                    AppConfig::default()
                })
        }
        Err(e) => {
            // 文件不存在或不可读
            warning_messages.push(format!(
                "Config file not found at '{}' ({}). Using default configuration.",
                CONFIG_FILE_PATH, e
            ));
            AppConfig::default()
        }
    };

    let log_level = app_config.log_level.to_lowercase();
    let log_level = match log_level.as_str() {
        "error" | "warn" | "info" | "debug" | "trace" => log_level,
        _ => {
            warning_messages.push(format!(
                "Unknown log level '{}', using default '{}'.",
                app_config.log_level, DEFAULT_LOG_LEVEL
            ));
            DEFAULT_LOG_LEVEL.to_string()
        }
    };

    tracing_subscriber::registry()
        .with(EnvFilter::new(
            format!("{}={},tower_http={}", env!("CARGO_CRATE_NAME"), log_level, log_level)))
        .with(tracing_subscriber::fmt::layer()).init();

    for warning in warning_messages {
        tracing::warn!("{}", warning);
    };

    tracing::info!("app config loaded: {:?}", app_config);

    app_config
}



pub async fn init() -> (u16, u16, AppState) {
    // 读取配置文件，并初始化日志系统
    let app_config = read_config().await;
    // 初始化 SQLite 数据库连接池
    let database_connection_pool = init_sqlite(
        app_config.max_database_connections,
        &app_config.sqlite_db_url)
        .await.expect("failed to create database pool");
    let app_state = AppState { database_connection_pool };

    (app_config.static_port, app_config.api_port, app_state)
}