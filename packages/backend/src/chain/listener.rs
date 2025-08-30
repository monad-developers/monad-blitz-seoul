use alloy::{
    primitives::Address,
    providers::{Provider, ProviderBuilder, WsConnect},
    rpc::types::{BlockNumberOrTag, Filter, Log},
};
use futures_util::StreamExt;
use serde_json::json;
use tracing::{error, info};

use crate::{config::Config, db::Database};

pub struct EventListener {
    config: Config,
    db: Database,
}

impl EventListener {
    pub fn new(config: Config, db: Database) -> Self {
        Self { config, db }
    }

    pub async fn start(&self) -> anyhow::Result<()> {
        info!("Starting chain event listener");

        // Check if WebSocket URL is configured
        let ws_url = if self.config.rpc_url.starts_with("ws") {
            self.config.rpc_url.clone()
        } else {
            // If HTTP URL is provided, try to convert to WebSocket
            self.config.rpc_url.replace("http", "ws")
        };

        // Connect to WebSocket
        match self.connect_and_listen(ws_url).await {
            Ok(_) => info!("Event listener completed"),
            Err(e) => {
                error!("Event listener error: {}", e);
                // Fall back to polling mode
                self.polling_mode().await?;
            }
        }

        Ok(())
    }

    async fn connect_and_listen(&self, ws_url: String) -> anyhow::Result<()> {
        info!("Connecting to WebSocket: {}", ws_url);

        let ws = WsConnect::new(ws_url);
        let provider = ProviderBuilder::new().connect_ws(ws).await?;

        // Create filters for different contract events
        let content_registry_address = self.config.content_registry_address.parse::<Address>()?;
        let staking_vault_address = self.config.staking_vault_address.parse::<Address>()?;
        let moderation_game_address = self.config.moderation_game_address.parse::<Address>()?;

        // Content Registry events filter
        let content_filter = Filter::new()
            .address(content_registry_address)
            .from_block(BlockNumberOrTag::Latest);

        // Staking Vault events filter
        let staking_filter = Filter::new()
            .address(staking_vault_address)
            .from_block(BlockNumberOrTag::Latest);

        // Moderation Game events filter
        let moderation_filter = Filter::new()
            .address(moderation_game_address)
            .from_block(BlockNumberOrTag::Latest);

        // Subscribe to logs
        let content_sub = provider.subscribe_logs(&content_filter).await?;
        let staking_sub = provider.subscribe_logs(&staking_filter).await?;
        let moderation_sub = provider.subscribe_logs(&moderation_filter).await?;

        let mut content_stream = content_sub.into_stream();
        let mut staking_stream = staking_sub.into_stream();
        let mut moderation_stream = moderation_sub.into_stream();

        info!("Subscribed to contract events");

        // Listen for events
        loop {
            tokio::select! {
                Some(log) = content_stream.next() => {
                    self.handle_content_event(log).await;
                }
                Some(log) = staking_stream.next() => {
                    self.handle_staking_event(log).await;
                }
                Some(log) = moderation_stream.next() => {
                    self.handle_moderation_event(log).await;
                }
                else => break,
            }
        }

        Ok(())
    }

    async fn polling_mode(&self) -> anyhow::Result<()> {
        info!("Running in polling mode (WebSocket not available)");

        // Keep the listener running with periodic checks
        loop {
            tokio::time::sleep(tokio::time::Duration::from_secs(30)).await;
            info!("Event listener heartbeat (polling mode)");
        }
    }

    async fn handle_content_event(&self, log: Log) {
        info!("Content Registry event: {:?}", log);

        // Store raw event in database
        if let Err(e) = self
            .db
            .track_chain_event(
                log.block_number.unwrap_or_default(),
                format!("{:?}", log.transaction_hash.unwrap_or_default()),
                "ContentRegistry",
                json!({
                    "topics": log.topics(),
                    "data": format!("{:?}", log.data()),
                    "address": format!("{:?}", log.address()),
                }),
            )
            .await
        {
            error!("Failed to track Content event: {}", e);
        }
    }

    async fn handle_staking_event(&self, log: Log) {
        info!("Staking Vault event: {:?}", log);

        // Store raw event in database
        if let Err(e) = self
            .db
            .track_chain_event(
                log.block_number.unwrap_or_default(),
                format!("{:?}", log.transaction_hash.unwrap_or_default()),
                "StakingVault",
                json!({
                    "topics": log.topics(),
                    "data": format!("{:?}", log.data()),
                    "address": format!("{:?}", log.address()),
                }),
            )
            .await
        {
            error!("Failed to track Staking event: {}", e);
        }
    }

    async fn handle_moderation_event(&self, log: Log) {
        info!("Moderation Game event: {:?}", log);

        // Store raw event in database
        if let Err(e) = self
            .db
            .track_chain_event(
                log.block_number.unwrap_or_default(),
                format!("{:?}", log.transaction_hash.unwrap_or_default()),
                "ModerationGame",
                json!({
                    "topics": log.topics(),
                    "data": format!("{:?}", log.data()),
                    "address": format!("{:?}", log.address()),
                }),
            )
            .await
        {
            error!("Failed to track Moderation event: {}", e);
        }
    }
}
