// 将vue3构建的前端静态资源嵌入到后端中
use rust_embed::RustEmbed; // 用于嵌入静态资源
use mime_guess::from_path; // 用于根据文件路径猜测 MIME 类型
use std::borrow::Cow;      // 用于处理静态资源的路径
use axum::{
    http::{Response, StatusCode},
    body::Body,
    extract::Request,
};

// 使用 RustEmbed 嵌入前端构建目录中的静态资源
#[derive(RustEmbed)]
#[folder = "../frontend/dist/"]
struct Dist;

fn not_found() -> Response<Body> {
    Response::builder()
        .status(StatusCode::NOT_FOUND)
        .body(Body::from("Not Found"))
        .unwrap()
}

pub async fn static_handler(req: Request) -> Response<Body> {
    let path = req.uri().path().trim_start_matches('/');

    // 若为空路径，则默认返回 index.html
    let path = if path.is_empty() { "index.html" } else { path };

    match Dist::get(path) {
        Some(content) => {
            let body = match content.data {
                Cow::Borrowed(b) => Body::from(b),
                Cow::Owned(b) => Body::from(b),
            };

            let mime = from_path(path).first_or_octet_stream();
            Response::builder()
                .status(StatusCode::OK)
                .header("Content-Type", mime.as_ref())
                .body(body)
                .unwrap()
        }
        None => {
            if path.contains('.') {
                return not_found();
            }
            match Dist::get("index.html") {
                Some(content) => {
                    let body = match content.data {
                        Cow::Borrowed(b) => Body::from(b),
                        Cow::Owned(b) => Body::from(b),
                    };

                    let mime = from_path("index.html").first_or_octet_stream();
                    Response::builder()
                        .status(StatusCode::OK)
                        .header("Content-Type", mime.as_ref())
                        .body(body)
                        .unwrap()
                }
                None => not_found(),
            }
        }
    }
}
