pub const DEFAULT_API_PORT: u16 = 19156;
pub const DEFAULT_MAX_DATABASE_CONNECTIONS: u32 = 5;
pub const DEFAULT_LOG_LEVEL: &str = "debug";
pub const DEFAULT_SQLITE_DB_URL: &str = "sqlite://database.db";
pub const CONFIG_FILE_PATH: &str = "./config.toml";

pub fn default_api_port() -> u16 {
    DEFAULT_API_PORT
}

pub fn default_max_database_connections() -> u32 {
    DEFAULT_MAX_DATABASE_CONNECTIONS
}

pub fn default_log_level() -> String {
    DEFAULT_LOG_LEVEL.to_string()
}

pub fn default_sqlite_db_url() -> String {
    DEFAULT_SQLITE_DB_URL.to_string()
}