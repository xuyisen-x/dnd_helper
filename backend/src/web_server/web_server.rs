use std::net::SocketAddr;
use axum::{Router, routing::get};
use tower_http::trace::TraceLayer;
use tower_http::services::{ServeDir, ServeFile};
use crate::utils::app_state::ArcAppState;

pub async fn run_serve(api_port: u16, app_state: ArcAppState) {
    let public_api_routes = Router::new()
        .route("/health", get(|| async { "ok" }));
    let private_api_routes = Router::new()
        .route("/sheets", get(|| async { "ok" }));

    // 创建 Axum 路由
    let api_app = Router::new()
        .merge(public_api_routes)
        .merge(private_api_routes)
        .with_state(app_state)
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([0, 0, 0, 0], api_port));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    tracing::info!("API server listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, api_app).await.unwrap();

    tracing::info!("Shutting down application due to service failure.");
}