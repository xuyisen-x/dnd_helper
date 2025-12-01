use tokio::fs;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};
use yaml_rust2::YamlLoader;
use crate::constants::*;
use std::env;

#[derive(Debug)]
struct AppConfig {
    pub server_port: u16,
    pub max_database_connections: u32,
}

async fn read_config() -> AppConfig {
    // 读取配置文件
    let content = fs::read_to_string("config.yaml")
        .await.expect("failed to read config file");
    let docs = YamlLoader::load_from_str(&content)
        .expect("failed to parse config file");
    let doc = &docs[0]; // 只取第一个文档

    // 初始化日志系统
    let (level, warn) =
        match doc["log_level"].as_str() {
            Some(level) => {
                let level = level.to_lowercase();
                match level.as_str() {
                    "error" | "warn" | "info" | "debug" | "trace"=> (level.clone(), None),
                    _ => (DEFAULT_LOG_LEVEL.to_string(),
                          Some(format!("unknown log level {}, using default {}",
                                       level, DEFAULT_LOG_LEVEL)))
                }
            }
            None => (DEFAULT_LOG_LEVEL.to_string(),
                     Some(format!("log_level not found in config, using default {}",
                                  DEFAULT_LOG_LEVEL)))

        };
    tracing_subscriber::registry()
        .with(EnvFilter::new(
            format!("{}={},tower_http={}", env!("CARGO_CRATE_NAME"), level, level)))
        .with(tracing_subscriber::fmt::layer()).init();
    if let Some(warn) = warn { tracing::warn!("{}", warn); }
    tracing::info!(level = %level);
    tracing::debug!("global logger initialized");

    // 读取其他配置
    // 加载好默认配置
    let mut app_config = AppConfig {
        server_port: DEFAULT_PORT,
        max_database_connections: DEFAULT_MAX_DATABASE_CONNECTIONS,
    };

    // 读取服务器端口配置
    match doc["server"]["port"].as_i64() {
        Some(port) if (1024..=65535).contains(&port) => {   // 检查端口范围
            app_config.server_port = port as u16;
        }
        Some(invalid_port) => {                             // 不在范围内，使用默认值
            tracing::warn!(
                "server port {} is out of valid range (1024-65535), using default port {}",
                invalid_port, DEFAULT_PORT
            );
        }
        None => {                                               // 没有找到端口配置，使用默认值
            tracing::warn!("server port not found or invalid type, using default port {}", DEFAULT_PORT);
        }
    }

    match doc["database"]["max_database_connections"].as_i64() {
        Some(max) if (0..=u32::MAX as i64).contains(&max) => {
            app_config.max_database_connections = max as u32;
        }
        Some(invalid_max) => {      // 如果不在范围内，使用默认值
            tracing::warn!(
                "max_database_connections {} is invalid, using default value {}",
                invalid_max, DEFAULT_MAX_DATABASE_CONNECTIONS
            );
        }
        None => {}
    }

    app_config
}

pub async fn init() -> u16 {
    // 读取配置文件，并初始化日志系统
    let app_config = read_config().await;
    tracing::debug!("config loaded: {:?}", app_config);

    app_config.server_port
}