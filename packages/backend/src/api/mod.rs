pub mod content;
pub mod score;
pub mod user;
pub mod vote;

use alloy::providers::Provider;
use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use serde_json::json;
use std::sync::Arc;

use crate::AppState;

pub async fn health_check() -> impl IntoResponse {
    Json(json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339(),
    }))
}

pub async fn chain_status(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    // Get latest block number from provider
    let provider = state.chain_client.provider();
    let block_number = provider
        .get_block_number()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(json!({
        "connected": true,
        "block_number": block_number,
        "chain_id": state.config.chain_id,
    })))
}
