use actix_files::Files;
use actix_multipart::form::{
    MultipartForm,
    tempfile::{TempFile, TempFileConfig},
};
use actix_web::{App, Error, HttpResponse, HttpServer, Responder, middleware, web};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

#[derive(Debug, MultipartForm)]
struct UploadForm {
    #[multipart(rename = "file")]
    files: Vec<TempFile>,
}

#[derive(Debug, Serialize, Deserialize)]
struct WalletAddress {
    id: i64,
    address: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
struct AddWalletRequest {
    address: String,
}

// 데이터베이스 초기화
async fn init_database() -> Result<SqlitePool, sqlx::Error> {
    let pool = SqlitePool::connect("sqlite:./wallet.db").await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS wallet_addresses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            address TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(&pool)
    .await?;

    Ok(pool)
}

// 지갑 주소 추가
async fn add_wallet_address(
    pool: web::Data<SqlitePool>,
    req: web::Json<AddWalletRequest>,
) -> Result<impl Responder, Error> {
    let address = req.address.trim();

    if address.is_empty() {
        return Ok(HttpResponse::BadRequest().json(json!({
            "error": "Wallet address cannot be empty"
        })));
    }

    // 기본적인 지갑 주소 형식 검증 (이더리움 주소 기준)
    if !address.starts_with("0x") || address.len() != 42 {
        return Ok(HttpResponse::BadRequest().json(json!({
            "error": "Invalid wallet address format"
        })));
    }

    match sqlx::query("INSERT INTO wallet_addresses (address) VALUES (?)")
        .bind(address)
        .execute(pool.get_ref())
        .await
    {
        Ok(result) => {
            let id = result.last_insert_rowid();
            Ok(HttpResponse::Created().json(json!({
                "id": id,
                "address": address,
                "message": "Wallet address added successfully"
            })))
        }
        Err(sqlx::Error::Database(db_err))
            if db_err.message().contains("UNIQUE constraint failed") =>
        {
            Ok(HttpResponse::Conflict().json(json!({
                "error": "Wallet address already exists"
            })))
        }
        Err(e) => {
            log::error!("Database error: {}", e);
            Ok(HttpResponse::InternalServerError().json(json!({
                "error": "Failed to add wallet address"
            })))
        }
    }
}

// 모든 지갑 주소 조회
async fn get_all_wallet_addresses(pool: web::Data<SqlitePool>) -> Result<impl Responder, Error> {
    match sqlx::query(
        "SELECT id, address, created_at FROM wallet_addresses ORDER BY created_at DESC",
    )
    .fetch_all(pool.get_ref())
    .await
    {
        Ok(rows) => {
            let wallets: Vec<_> = rows
                .iter()
                .map(|row| {
                    json!({
                        "id": row.get::<i64, _>("id"),
                        "address": row.get::<String, _>("address"),
                        "created_at": row.get::<String, _>("created_at")
                    })
                })
                .collect();

            Ok(HttpResponse::Ok().json(json!({
                "wallets": wallets,
                "count": wallets.len()
            })))
        }
        Err(e) => {
            log::error!("Database error: {}", e);
            Ok(HttpResponse::InternalServerError().json(json!({
                "error": "Failed to fetch wallet addresses"
            })))
        }
    }
}

async fn upload_files(
    MultipartForm(form): MultipartForm<UploadForm>,
) -> Result<impl Responder, Error> {
    if form.files.is_empty() {
        return Ok(HttpResponse::BadRequest().json(json!({
            "error": "No files uploaded"
        })));
    }

    let mut uploaded_urls = Vec::new();

    for f in form.files {
        let original_filename = f.file_name.unwrap_or_else(|| "unknown".to_string());
        let file_extension = std::path::Path::new(&original_filename)
            .extension()
            .and_then(|ext| ext.to_str())
            .map(|ext| format!(".{}", ext))
            .unwrap_or_default();

        let unique_filename = format!("{}{}", Uuid::new_v4(), file_extension);
        let sanitized_filename = sanitize_filename::sanitize(&unique_filename);

        let file_path = format!("./uploads/{}", sanitized_filename);

        log::info!("Saving file to: {}", file_path);

        match f.file.persist(&file_path) {
            Ok(_) => {
                let file_url = format!(
                    "https://monad.newjeans.cloud/uploads/{}",
                    sanitized_filename
                );
                uploaded_urls.push(file_url);
                log::info!("File saved successfully: {}", sanitized_filename);
            }
            Err(e) => {
                log::error!("Failed to save file {}: {}", sanitized_filename, e);
                return Ok(HttpResponse::InternalServerError().json(json!({
                    "error": format!("Failed to save file: {}", e)
                })));
            }
        }
    }

    if uploaded_urls.len() == 1 {
        Ok(HttpResponse::Ok().json(json!({
            "url": uploaded_urls[0]
        })))
    } else {
        Ok(HttpResponse::Ok().json(json!({
            "urls": uploaded_urls
        })))
    }
}

async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(json!({
        "status": "ok",
        "message": "Monad NewJeans File Server is running"
    }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    // 데이터베이스 초기화
    let pool = init_database()
        .await
        .expect("Failed to initialize database");
    log::info!("Database initialized successfully");

    log::info!("Creating uploads directory");
    std::fs::create_dir_all("./uploads")?;

    log::info!("Starting HTTP server at http://localhost:10901");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .wrap(middleware::Logger::default())
            .app_data(TempFileConfig::default().directory("./uploads"))
            .app_data(web::PayloadConfig::new(20 * 1024 * 1024))
            // Health check endpoint
            .route("/health", web::get().to(health_check))
            // File upload endpoint
            .route("/upload", web::post().to(upload_files))
            // Wallet address endpoints
            .route("/wallets", web::get().to(get_all_wallet_addresses))
            .route("/wallets", web::post().to(add_wallet_address))
            // Static file service for uploaded files
            .service(Files::new("/static", "./uploads/"))
    })
    .bind(("127.0.0.1", 10901))?
    .workers(2)
    .run()
    .await
}
