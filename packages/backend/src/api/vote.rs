use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use std::sync::Arc;
use uuid::Uuid;

use crate::{models::VoteRequest, AppState};

pub async fn create_vote(
    State(state): State<Arc<AppState>>,
    Path(content_id): Path<Uuid>,
    Json(req): Json<VoteRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    // TODO: Get voter address from authenticated user
    let voter_address = "0x0000000000000000000000000000000000000000".to_string();

    state
        .db
        .create_vote(content_id, voter_address, req.vote_type)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::OK)
}
