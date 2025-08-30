mod api;
mod chain;
mod config;
mod db;
mod middleware;
mod models;
mod workers;

use axum::{
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::{error, info};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::{
    chain::{ChainClient, EventListener},
    config::Config,
    db::Database,
};

#[derive(Clone)]
pub struct AppState {
    pub db: Database,
    pub chain_client: ChainClient,
    pub config: Config,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "monaddit_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("Starting Monaddit backend server");

    // Load configuration
    let config = Config::from_env().expect("Failed to load configuration");
    info!("Configuration loaded");

    // Initialize database
    let db = Database::new(&config.database_url)
        .await
        .expect("Failed to connect to database");
    info!("Database connected");

    // Initialize chain client
    let chain_client = ChainClient::new(config.clone())
        .await
        .expect("Failed to initialize chain client");
    info!("Chain client initialized");

    // Create app state
    let app_state = Arc::new(AppState {
        db: db.clone(),
        chain_client,
        config: config.clone(),
    });

    // Start event listener in background
    let event_db = db.clone();
    let event_config = config.clone();
    tokio::spawn(async move {
        let listener = EventListener::new(event_config, event_db);
        if let Err(e) = listener.start().await {
            error!("Event listener error: {}", e);
        }
    });
    info!("Event listener started");

    // Start rewards worker in background
    let rewards_state = app_state.clone();
    tokio::spawn(async move {
        workers::rewards::start_rewards_worker(rewards_state).await;
    });
    info!("Rewards worker started");

    // Build router
    let app = Router::new()
        // Health check
        .route("/health", get(api::health_check))
        .route("/chain/status", get(api::chain_status))
        // Content endpoints
        .route("/api/content", post(api::content::create_content))
        .route("/api/content/{id}", get(api::content::get_content))
        .route("/api/contents", get(api::content::list_contents))
        .route(
            "/api/content/hash/{hash}",
            get(api::content::get_content_by_hash),
        )
        .route("/api/stats", get(api::content::get_stats))
        // Scoring endpoints
        .route("/api/score", post(api::score::score_content))
        .route("/api/score/batch", post(api::score::batch_score))
        .route("/api/webhook/ml-score", post(api::score::ml_score_webhook))
        // Vote endpoints
        .route("/api/vote/{content_id}", post(api::vote::create_vote))
        // User endpoints
        .route("/api/user/{address}", get(api::user::get_user_profile))
        .route("/api/user/{address}", post(api::user::update_user_profile))
        // Add state
        .with_state(app_state)
        // Add middleware
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .layer(TraceLayer::new_for_http());

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.backend_port));
    info!("Server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("Failed to bind address");

    axum::serve(listener, app)
        .await
        .expect("Failed to start server");

    Ok(())
}
