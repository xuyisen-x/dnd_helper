use std::sync::Arc;
use sqlx::SqlitePool;

#[derive(Debug)]
pub struct AppState {
    pub database_connection_pool: SqlitePool,
}
pub type ArcAppState = Arc<AppState>;