use std::sync::Arc;

mod web_server;
mod utils;
mod constants;

#[global_allocator] // 配置全局分配器为 mimalloc
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

#[tokio::main]
async fn main() {
    let (static_port, api_port, app_state) = utils::lifecycle::init().await;
    web_server::run_serve(static_port, api_port, Arc::new(app_state)).await;
}
