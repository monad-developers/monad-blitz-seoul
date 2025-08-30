use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use sha3::{Digest, Keccak256};
use sqlx::types::BigDecimal;
use std::str::FromStr;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    models::{Content, CreateContentRequest, CreateContentResponse},
    AppState,
};

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub community_id: Option<String>,
}

pub async fn create_content(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateContentRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    // Generate content hash
    let mut hasher = Keccak256::new();
    hasher.update(req.title.as_bytes());
    hasher.update(req.body.as_bytes());
    let hash_result = hasher.finalize();
    let content_hash = format!("0x{}", hex::encode(hash_result));

    // Create content in database
    let content = Content {
        id: Uuid::new_v4(),
        content_id: 0, // Will be updated after on-chain publication
        author_address: "0x0000000000000000000000000000000000000000".to_string(), // Will be set from wallet
        content_hash: content_hash.clone(),
        title: req.title,
        body: req.body,
        uri: None,
        content_type: req.content_type,
        parent_id: req.parent_id,
        community_id: req.community_id,
        bond_amount: BigDecimal::from_str("100000000000000000").unwrap(), // 0.1 MDT
        status: "pending".to_string(),
        published_at: chrono::Utc::now(),
        lock_until: Some(chrono::Utc::now() + chrono::Duration::days(7)),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    let content_id = state
        .db
        .create_content(content.clone())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(CreateContentResponse {
        id: content_id,
        content_hash,
        estimated_gas: Some("200000".to_string()),
    }))
}

pub async fn get_content(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, StatusCode> {
    let content = state
        .db
        .get_content(id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match content {
        Some(c) => Ok(Json(c)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

pub async fn list_contents(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ListQuery>,
) -> Result<impl IntoResponse, StatusCode> {
    let limit = query.limit.unwrap_or(20).min(100);
    let offset = query.offset.unwrap_or(0);
    let community_id = query.community_id.unwrap_or_else(|| "default".to_string());

    let contents = state
        .db
        .get_contents_by_community(&community_id, limit, offset)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(contents))
}

pub async fn get_content_by_hash(
    State(_state): State<Arc<AppState>>,
    Path(_hash): Path<String>,
) -> Result<Json<Content>, StatusCode> {
    // Query database for content with this hash
    // This is a simplified version - you'd need to add this query to the Database impl
    Err(StatusCode::NOT_IMPLEMENTED)
}

#[derive(Debug, Serialize)]
pub struct ContentStats {
    pub total_contents: i64,
    pub total_challenges: i64,
    pub total_resolved: i64,
}

pub async fn get_stats(
    State(_state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    // Get statistics from database
    // This is a simplified version - you'd need to add these queries to the Database impl
    Ok(Json(ContentStats {
        total_contents: 0,
        total_challenges: 0,
        total_resolved: 0,
    }))
}
