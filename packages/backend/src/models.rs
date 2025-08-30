use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{types::BigDecimal, FromRow};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Content {
    pub id: Uuid,
    pub content_id: i64,
    pub author_address: String,
    pub content_hash: String,
    pub title: String,
    pub body: String,
    pub uri: Option<String>,
    pub content_type: String,
    pub parent_id: Option<Uuid>,
    pub community_id: Option<String>,
    pub bond_amount: BigDecimal,
    pub status: String,
    pub published_at: DateTime<Utc>,
    pub lock_until: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ContentStatus {
    Published,
    Challenged,
    Disputed,
    Resolved,
}

impl ToString for ContentStatus {
    fn to_string(&self) -> String {
        match self {
            ContentStatus::Published => "published".to_string(),
            ContentStatus::Challenged => "challenged".to_string(),
            ContentStatus::Disputed => "disputed".to_string(),
            ContentStatus::Resolved => "resolved".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Challenge {
    pub id: Uuid,
    pub content_id: Uuid,
    pub challenger_address: String,
    pub reason: String,
    pub evidence: Option<String>,
    pub bond_amount: BigDecimal,
    pub resolved: bool,
    pub guilty: Option<bool>,
    pub created_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub address: String,
    pub username: Option<String>,
    pub sbt_token_id: Option<i64>,
    pub karma: i32,
    pub total_stake: String,
    pub reputation_multiplier: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Vote {
    pub id: Uuid,
    pub content_id: Uuid,
    pub voter_address: String,
    pub vote_type: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ToxicityScore {
    pub id: Uuid,
    pub content_id: Uuid,
    pub score: f32,
    pub model_version: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ChainEvent {
    pub id: Uuid,
    pub block_number: i64,
    pub transaction_hash: String,
    pub event_type: String,
    pub contract_address: String,
    pub data: serde_json::Value,
    pub processed: bool,
    pub created_at: DateTime<Utc>,
    pub processed_at: Option<DateTime<Utc>>,
}

// API Request/Response models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateContentRequest {
    pub title: String,
    pub body: String,
    pub content_type: String,
    pub parent_id: Option<Uuid>,
    pub community_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateContentResponse {
    pub id: Uuid,
    pub content_hash: String,
    pub estimated_gas: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoreContentRequest {
    pub content_id: Uuid,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoreContentResponse {
    pub content_id: Uuid,
    pub score: f32,
    pub toxic: bool,
    pub categories: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoteRequest {
    pub content_id: Uuid,
    pub vote_type: String, // "upvote" or "downvote"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentWithStats {
    pub content: Content,
    pub upvotes: i64,
    pub downvotes: i64,
    pub comments_count: i64,
    pub author: Option<User>,
}
