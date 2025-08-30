use alloy::primitives::Address;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use std::str::FromStr;
use std::sync::Arc;

use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfile {
    pub address: String,
    pub username: Option<String>,
    pub karma: i32,
    pub total_stake: String,
    pub reputation_multiplier: i32,
    pub pending_rewards: String,
    pub is_eligible_staker: bool,
}

pub async fn get_user_profile(
    State(state): State<Arc<AppState>>,
    Path(address): Path<String>,
) -> Result<impl IntoResponse, StatusCode> {
    // Get on-chain data
    let user_address = Address::from_str(&address).map_err(|_| StatusCode::BAD_REQUEST)?;

    let stake_info = state
        .chain_client
        .get_stake_info(user_address)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let (karma, _dispute_rate) = state
        .chain_client
        .get_reputation(user_address)
        .await
        .unwrap_or((
            alloy::primitives::U256::from(100),
            alloy::primitives::U256::ZERO,
        ));

    let reputation_multiplier = state
        .chain_client
        .get_reputation_multiplier(user_address)
        .await
        .unwrap_or(alloy::primitives::U256::from(100));

    let pending_rewards = state
        .chain_client
        .get_pending_rewards(user_address)
        .await
        .unwrap_or(alloy::primitives::U256::ZERO);

    let is_eligible = state
        .chain_client
        .is_eligible_staker(user_address)
        .await
        .unwrap_or(false);

    Ok(Json(UserProfile {
        address: address.clone(),
        username: None,
        karma: karma.to::<i32>(),
        total_stake: stake_info.total_amount.to_string(),
        reputation_multiplier: reputation_multiplier.to::<i32>(),
        pending_rewards: pending_rewards.to_string(),
        is_eligible_staker: is_eligible,
    }))
}

pub async fn update_user_profile(
    State(state): State<Arc<AppState>>,
    Path(address): Path<String>,
    Json(update): Json<serde_json::Value>,
) -> Result<impl IntoResponse, StatusCode> {
    // Update user profile in database
    // This would typically require authentication
    Ok(StatusCode::OK)
}
