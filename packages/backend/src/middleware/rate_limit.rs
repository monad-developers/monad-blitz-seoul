use axum::{extract::Request, http::StatusCode, middleware::Next, response::Response};
use dashmap::DashMap;
use std::{
    net::SocketAddr,
    sync::Arc,
    time::{Duration, SystemTime},
};

#[derive(Clone, Debug)]
struct RateLimitEntry {
    count: u32,
    window_start: SystemTime,
}

#[derive(Clone)]
pub struct RateLimiter {
    limits: Arc<DashMap<String, RateLimitEntry>>,
    max_requests: u32,
    window_duration: Duration,
}

impl RateLimiter {
    pub fn new(max_requests: u32, window_seconds: u64) -> Self {
        let limiter = Self {
            limits: Arc::new(DashMap::new()),
            max_requests,
            window_duration: Duration::from_secs(window_seconds),
        };

        // Start cleanup task to remove expired entries
        let limits = limiter.limits.clone();
        let window_duration = limiter.window_duration;

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(60));
            loop {
                interval.tick().await;
                let now = SystemTime::now();

                // Remove expired entries
                limits.retain(|_, entry| {
                    now.duration_since(entry.window_start)
                        .unwrap_or(Duration::ZERO)
                        < window_duration
                });
            }
        });

        limiter
    }

    pub fn check(&self, key: String) -> bool {
        let now = SystemTime::now();

        let mut exceeded = false;

        self.limits
            .entry(key.clone())
            .and_modify(|entry| {
                // Check if window has expired
                if now
                    .duration_since(entry.window_start)
                    .unwrap_or(Duration::ZERO)
                    >= self.window_duration
                {
                    // Reset window
                    entry.count = 1;
                    entry.window_start = now;
                } else {
                    // Increment count in current window
                    entry.count += 1;
                }
                exceeded = entry.count > self.max_requests;
            })
            .or_insert_with(|| RateLimitEntry {
                count: 1,
                window_start: now,
            });

        !exceeded
    }
}

pub async fn rate_limit_middleware(req: Request, next: Next) -> Result<Response, StatusCode> {
    // Get client IP or use a default identifier
    let key = req
        .extensions()
        .get::<SocketAddr>()
        .map(|addr| addr.ip().to_string())
        .unwrap_or_else(|| "anonymous".to_string());

    // Get rate limiter from app state (you'll need to add this to your app state)
    // For now, we'll create a static instance
    static RATE_LIMITER: std::sync::OnceLock<RateLimiter> = std::sync::OnceLock::new();
    let limiter = RATE_LIMITER.get_or_init(|| {
        RateLimiter::new(100, 60) // 100 requests per minute
    });

    if !limiter.check(key) {
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }

    Ok(next.run(req).await)
}

// Alternative: Per-endpoint rate limiting
pub fn create_endpoint_limiter(max_requests: u32, window_seconds: u64) -> RateLimiter {
    RateLimiter::new(max_requests, window_seconds)
}

// Extension trait for easy integration
pub trait RateLimitExt {
    fn with_rate_limit(&self, endpoint: &str, addr: SocketAddr) -> Result<(), String>;
}

impl RateLimitExt for RateLimiter {
    fn with_rate_limit(&self, endpoint: &str, addr: SocketAddr) -> Result<(), String> {
        let key = format!("{}:{}", addr.ip(), endpoint);
        if self.check(key) {
            Ok(())
        } else {
            Err("Rate limit exceeded".to_string())
        }
    }
}
