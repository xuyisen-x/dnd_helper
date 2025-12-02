use std::net::SocketAddr;
use axum::{Router, routing::get};
use tower_http::trace::TraceLayer;
use tower_http::services::{ServeDir, ServeFile};
use crate::utils::app_state::ArcAppState;

pub async fn run_serve(static_port: u16, api_port: u16, app_state: ArcAppState) {
    let serve_dir = ServeDir::new("./dist")
        .not_found_service(ServeFile::new("./dist/index.html"));

    let static_app = Router::new()
        .fallback_service(serve_dir)
        .layer(TraceLayer::new_for_http());

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

    let handle_static = tokio::spawn(async move {
        let addr = SocketAddr::from(([0, 0, 0, 0], static_port));
        let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
        tracing::info!("static resources listening on {}", listener.local_addr().unwrap());
        axum::serve(listener, static_app).await.unwrap()
    });

    let handle_api = tokio::spawn(async move {
        let addr = SocketAddr::from(([0, 0, 0, 0], api_port));
        let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
        tracing::info!("API server listening on {}", listener.local_addr().unwrap());
        axum::serve(listener, api_app).await.unwrap()
    });

    tokio::select! {
        result = handle_static => {
            tracing::error!("Static server exited unexpectedly: {:?}", result);
        }
        result = handle_api => {
            tracing::error!("API server exited unexpectedly: {:?}", result);
        }
    }

    tracing::info!("Shutting down application due to sub-service failure.");
}