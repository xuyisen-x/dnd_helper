use std::net::SocketAddr;
use axum::{Router, routing::get};
use tower_http::trace::TraceLayer;

pub async fn run_serve(port: u16) {
    // 创建 Axum 路由
    let app = Router::new()
        .fallback_service(get(super::embed::static_handler))
        // 添加 TraceLayer  以便于日志记录和追踪
        .layer(TraceLayer::new_for_http());

    // 注册监听地址和端口
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();

    // 启动服务器
    tracing::debug!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap()
}