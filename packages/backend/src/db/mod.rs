use alloy::primitives::U256;
use sqlx::{postgres::PgPoolOptions, types::BigDecimal, PgPool};
use std::str::FromStr;
use std::time::Duration;
use uuid::Uuid;

use crate::models::*;
use anyhow::Result;

#[derive(Clone)]
pub struct Database {
    pool: PgPool,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self> {
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .acquire_timeout(Duration::from_secs(3))
            .connect(database_url)
            .await?;

        // Run migrations
        sqlx::migrate!("./migrations").run(&pool).await?;

        Ok(Self { pool })
    }

    // Content operations
    pub async fn create_content(&self, content: Content) -> Result<Uuid> {
        let id = Uuid::new_v4();

        sqlx::query!(
            r#"
            INSERT INTO contents (
                id, content_id, author_address, content_hash, title, body,
                uri, content_type, parent_id, community_id, bond_amount, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            "#,
            id,
            content.content_id,
            content.author_address,
            content.content_hash,
            content.title,
            content.body,
            content.uri,
            content.content_type,
            content.parent_id,
            content.community_id,
            content.bond_amount,
            content.status
        )
        .execute(&self.pool)
        .await?;

        Ok(id)
    }

    pub async fn get_content(&self, id: Uuid) -> Result<Option<Content>> {
        let content = sqlx::query_as!(
            Content,
            r#"
            SELECT * FROM contents WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(content)
    }

    pub async fn get_content_by_chain_id(&self, content_id: i64) -> Result<Option<Content>> {
        let content = sqlx::query_as!(
            Content,
            r#"
            SELECT * FROM contents WHERE content_id = $1
            "#,
            content_id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(content)
    }

    pub async fn update_content_status(
        &self,
        content_id: U256,
        status: ContentStatus,
    ) -> Result<()> {
        let content_id = content_id.to::<i64>();
        let status_str = status.to_string();

        sqlx::query!(
            r#"
            UPDATE contents SET status = $1, updated_at = NOW()
            WHERE content_id = $2
            "#,
            status_str,
            content_id
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_contents_by_community(
        &self,
        community_id: &str,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<ContentWithStats>> {
        let contents = sqlx::query!(
            r#"
            SELECT 
                c.*,
                COUNT(DISTINCT v1.id) FILTER (WHERE v1.vote_type = 'upvote') as upvotes,
                COUNT(DISTINCT v2.id) FILTER (WHERE v2.vote_type = 'downvote') as downvotes,
                COUNT(DISTINCT c2.id) as comments_count,
                u.address as user_address,
                u.username,
                u.karma,
                u.reputation_multiplier
            FROM contents c
            LEFT JOIN votes v1 ON c.id = v1.content_id AND v1.vote_type = 'upvote'
            LEFT JOIN votes v2 ON c.id = v2.content_id AND v2.vote_type = 'downvote'
            LEFT JOIN contents c2 ON c.id = c2.parent_id
            LEFT JOIN users u ON c.author_address = u.address
            WHERE c.community_id = $1 AND c.content_type = 'post'
            GROUP BY c.id, u.address
            ORDER BY c.published_at DESC
            LIMIT $2 OFFSET $3
            "#,
            community_id,
            limit,
            offset
        )
        .fetch_all(&self.pool)
        .await?;

        // Convert to ContentWithStats
        let mut result = Vec::new();
        for row in contents {
            let content = Content {
                id: row.id,
                content_id: row.content_id,
                author_address: row.author_address.clone(),
                content_hash: row.content_hash,
                title: row.title,
                body: row.body,
                uri: row.uri,
                content_type: row.content_type,
                parent_id: row.parent_id,
                community_id: row.community_id,
                bond_amount: row.bond_amount,
                status: row.status,
                published_at: row.published_at,
                lock_until: row.lock_until,
                created_at: row.created_at,
                updated_at: row.updated_at,
            };

            let author = if let Some(username) = row.username {
                Some(User {
                    address: row.user_address,
                    username: Some(username),
                    sbt_token_id: None,
                    karma: row.karma.unwrap_or(100),
                    total_stake: "0".to_string(),
                    reputation_multiplier: row.reputation_multiplier.unwrap_or(100),
                    created_at: chrono::Utc::now(),
                    updated_at: chrono::Utc::now(),
                })
            } else {
                None
            };

            result.push(ContentWithStats {
                content,
                upvotes: row.upvotes.unwrap_or(0),
                downvotes: row.downvotes.unwrap_or(0),
                comments_count: row.comments_count.unwrap_or(0),
                author,
            });
        }

        Ok(result)
    }

    // Challenge operations
    pub async fn create_challenge(
        &self,
        content_id: U256,
        challenger_address: String,
        reason: u8,
        evidence: Option<String>,
    ) -> Result<Uuid> {
        let content_id_i64 = content_id.to::<i64>();

        // Get content UUID from content_id
        let content = self
            .get_content_by_chain_id(content_id_i64)
            .await?
            .ok_or(anyhow::anyhow!("Content not found"))?;

        let id = Uuid::new_v4();
        let reason_str = format!("{}", reason);

        sqlx::query!(
            r#"
            INSERT INTO challenges (
                id, content_id, challenger_address, reason, evidence, bond_amount
            ) VALUES ($1, $2, $3, $4, $5, $6)
            "#,
            id,
            content.id,
            challenger_address,
            reason_str,
            evidence,
            BigDecimal::from_str("200000000000000000").unwrap() // 0.2 MDT
        )
        .execute(&self.pool)
        .await?;

        Ok(id)
    }

    pub async fn resolve_challenge(&self, content_id: U256, guilty: bool) -> Result<()> {
        let content_id_i64 = content_id.to::<i64>();

        let content = self
            .get_content_by_chain_id(content_id_i64)
            .await?
            .ok_or(anyhow::anyhow!("Content not found"))?;

        sqlx::query!(
            r#"
            UPDATE challenges 
            SET resolved = true, guilty = $1, resolved_at = NOW()
            WHERE content_id = $2 AND resolved = false
            "#,
            guilty,
            content.id
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    // User operations
    pub async fn create_or_update_user(&self, user: User) -> Result<()> {
        sqlx::query!(
            r#"
            INSERT INTO users (address, username, sbt_token_id, karma, total_stake, reputation_multiplier)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (address) DO UPDATE SET
                username = EXCLUDED.username,
                sbt_token_id = EXCLUDED.sbt_token_id,
                karma = EXCLUDED.karma,
                total_stake = EXCLUDED.total_stake,
                reputation_multiplier = EXCLUDED.reputation_multiplier,
                updated_at = NOW()
            "#,
            user.address,
            user.username,
            user.sbt_token_id,
            user.karma,
            BigDecimal::from_str(&user.total_stake).unwrap(),
            user.reputation_multiplier
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn update_user_stake(&self, address: String, amount: U256) -> Result<()> {
        let amount_str = amount.to_string();

        sqlx::query!(
            r#"
            UPDATE users SET total_stake = $1, updated_at = NOW()
            WHERE address = $2
            "#,
            BigDecimal::from_str(&amount_str).unwrap(),
            address
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    // Vote operations
    pub async fn create_vote(
        &self,
        content_id: Uuid,
        voter_address: String,
        vote_type: String,
    ) -> Result<()> {
        let id = Uuid::new_v4();

        sqlx::query!(
            r#"
            INSERT INTO votes (id, content_id, voter_address, vote_type)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (content_id, voter_address) DO UPDATE SET
                vote_type = EXCLUDED.vote_type
            "#,
            id,
            content_id,
            voter_address,
            vote_type
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    // Toxicity score operations
    pub async fn save_toxicity_score(&self, score: ToxicityScore) -> Result<()> {
        sqlx::query!(
            r#"
            INSERT INTO toxicity_scores (id, content_id, score, model_version, metadata)
            VALUES ($1, $2, $3, $4, $5)
            "#,
            score.id,
            score.content_id,
            score.score as f64,
            score.model_version,
            score.metadata
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    // Chain event operations
    pub async fn track_chain_event(
        &self,
        block_number: u64,
        transaction_hash: String,
        event_type: &str,
        data: serde_json::Value,
    ) -> Result<()> {
        sqlx::query!(
            r#"
            INSERT INTO chain_events (
                id, block_number, transaction_hash, event_type, 
                contract_address, data, processed
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
            Uuid::new_v4(),
            block_number as i64,
            transaction_hash,
            event_type,
            "0x0000000000000000000000000000000000000000", // placeholder
            data,
            false
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn store_chain_event(&self, event: ChainEvent) -> Result<()> {
        sqlx::query!(
            r#"
            INSERT INTO chain_events (
                id, block_number, transaction_hash, event_type, 
                contract_address, data, processed, processed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
            event.id,
            event.block_number,
            event.transaction_hash,
            event.event_type,
            event.contract_address,
            event.data,
            event.processed,
            event.processed_at
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn record_slashing(
        &self,
        user_address: String,
        amount: U256,
        reason: String,
    ) -> Result<()> {
        // Store slashing event in chain_events table
        let event = ChainEvent {
            id: Uuid::new_v4(),
            block_number: 0,
            transaction_hash: "".to_string(),
            event_type: "Slashed".to_string(),
            contract_address: "".to_string(),
            data: serde_json::json!({
                "user": user_address,
                "amount": amount.to_string(),
                "reason": reason,
            }),
            processed: true,
            created_at: chrono::Utc::now(),
            processed_at: Some(chrono::Utc::now()),
        };

        self.store_chain_event(event).await?;
        Ok(())
    }

    pub async fn record_dispute_resolution(
        &self,
        dispute_id: U256,
        guilty: bool,
        guilty_votes: U256,
        not_guilty_votes: U256,
    ) -> Result<()> {
        let event = ChainEvent {
            id: Uuid::new_v4(),
            block_number: 0,
            transaction_hash: "".to_string(),
            event_type: "DisputeResolved".to_string(),
            contract_address: "".to_string(),
            data: serde_json::json!({
                "disputeId": dispute_id.to_string(),
                "guilty": guilty,
                "guiltyVotes": guilty_votes.to_string(),
                "notGuiltyVotes": not_guilty_votes.to_string(),
            }),
            processed: true,
            created_at: chrono::Utc::now(),
            processed_at: Some(chrono::Utc::now()),
        };

        self.store_chain_event(event).await?;
        Ok(())
    }
}
