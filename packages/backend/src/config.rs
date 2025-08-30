use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Config {
    // Database
    pub database_url: String,

    // Blockchain
    pub rpc_url: String,
    pub chain_id: u64,

    // Contract addresses
    pub mdt_token_address: String,
    pub staking_vault_address: String,
    pub content_registry_address: String,
    pub moderation_game_address: String,
    pub reputation_sbt_address: String,
    pub staking_rewards_address: String,
    pub treasury_address: String,

    // Server
    pub backend_port: u16,
    pub backend_host: String,

    // API
    pub api_secret_key: String,

    // ML Scoring
    pub scoring_service_url: Option<String>,
    pub scoring_api_key: Option<String>,
}

impl Config {
    pub fn from_env() -> Result<Self, env::VarError> {
        dotenv::dotenv().ok();

        Ok(Config {
            database_url: env::var("DATABASE_URL")?,
            rpc_url: env::var("MONAD_RPC_URL")?,
            chain_id: env::var("MONAD_CHAIN_ID")?
                .parse()
                .map_err(|_| env::VarError::NotPresent)?,
            mdt_token_address: env::var("MDT_TOKEN_ADDRESS")?,
            staking_vault_address: env::var("STAKING_VAULT_ADDRESS")?,
            content_registry_address: env::var("CONTENT_REGISTRY_ADDRESS")?,
            moderation_game_address: env::var("MODERATION_GAME_ADDRESS")?,
            reputation_sbt_address: env::var("REPUTATION_SBT_ADDRESS")?,
            staking_rewards_address: env::var("STAKING_REWARDS_ADDRESS")?,
            treasury_address: env::var("TREASURY_ADDRESS")?,
            backend_port: env::var("BACKEND_PORT")
                .unwrap_or_else(|_| "8787".to_string())
                .parse()
                .unwrap_or(8787),
            backend_host: env::var("BACKEND_HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            api_secret_key: env::var("API_SECRET_KEY")?,
            scoring_service_url: env::var("SCORING_SERVICE_URL").ok(),
            scoring_api_key: env::var("SCORING_API_KEY").ok(),
        })
    }
}
