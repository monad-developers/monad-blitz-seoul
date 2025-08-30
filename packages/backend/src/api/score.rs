use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    models::{ScoreContentRequest, ScoreContentResponse, ToxicityScore},
    AppState,
};

pub async fn score_content(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ScoreContentRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    // Simple toxicity scoring based on keywords (for demo)
    // In production, you would call an ML model service
    let score = calculate_toxicity_score(&req.text);
    let toxic = score > 0.7;

    let categories = if toxic {
        vec!["harassment".to_string(), "hate_speech".to_string()]
    } else {
        vec![]
    };

    // Save score to database
    let toxicity_score = ToxicityScore {
        id: Uuid::new_v4(),
        content_id: req.content_id,
        score,
        model_version: Some("demo_v1".to_string()),
        metadata: Some(serde_json::json!({
            "categories": categories.clone(),
            "text_length": req.text.len(),
        })),
        created_at: chrono::Utc::now(),
    };

    state
        .db
        .save_toxicity_score(toxicity_score)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(ScoreContentResponse {
        content_id: req.content_id,
        score,
        toxic,
        categories,
    }))
}

fn calculate_toxicity_score(text: &str) -> f32 {
    // Simple keyword-based scoring for demo
    // In production, use a proper ML model
    let toxic_keywords = vec![
        "hate", "kill", "die", "stupid", "idiot", "moron", "scam", "fraud", "fake", "spam",
    ];

    let text_lower = text.to_lowercase();
    let mut score: f32 = 0.0;

    for keyword in toxic_keywords {
        if text_lower.contains(keyword) {
            score += 0.2;
        }
    }

    // Check for excessive caps
    let caps_ratio = text.chars().filter(|c| c.is_uppercase()).count() as f32 / text.len() as f32;
    if caps_ratio > 0.5 {
        score += 0.3;
    }

    // Check for excessive punctuation
    let punct_count = text.chars().filter(|c| *c == '!' || *c == '?').count();
    if punct_count > 5 {
        score += 0.2;
    }

    score.min(1.0)
}

pub async fn batch_score(
    State(state): State<Arc<AppState>>,
    Json(requests): Json<Vec<ScoreContentRequest>>,
) -> Result<impl IntoResponse, StatusCode> {
    let mut responses = Vec::new();

    for req in requests {
        let score = calculate_toxicity_score(&req.text);
        let toxic = score > 0.7;

        let categories = if toxic {
            vec!["harassment".to_string()]
        } else {
            vec![]
        };

        responses.push(ScoreContentResponse {
            content_id: req.content_id,
            score,
            toxic,
            categories,
        });
    }

    Ok(Json(responses))
}

// This would be called by an external ML service if available
pub async fn ml_score_webhook(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<serde_json::Value>,
) -> Result<impl IntoResponse, StatusCode> {
    // Process ML model results from external service
    // Store in database
    Ok(StatusCode::OK)
}
