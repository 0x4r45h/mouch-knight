use wasm_bindgen::prelude::*;
use sha2::{Sha256, Digest};
use hex;

// The secret key that will be compiled into the WASM binary
// This makes it harder to extract compared to sending it from JS
const SECRET_KEY: &str = "f3a9b5c7d1e8f2a4b6c8d0e2f4a6b8c0"; // Replace with your own secret key

#[wasm_bindgen]
pub fn generate_verification_hash(
    player_address: &str,
    current_score: u32,
    chain_id: u32,
    session_id: u32
) -> String {
    // Combine all parameters with the secret key
    let payload = format!(
        "{}:{}:{}:{}:{}",
        SECRET_KEY,
        player_address,
        current_score,
        chain_id,
        session_id
    );

    // Create a SHA-256 hash
    let mut hasher = Sha256::new();
    hasher.update(payload.as_bytes());
    let result = hasher.finalize();

    // Convert to hex string
    hex::encode(result)
}

// Add a timestamp to the hash to prevent replay attacks
#[wasm_bindgen]
pub fn generate_timed_verification_hash(
    player_address: &str,
    current_score: u32,
    chain_id: u32,
    session_id: u32,
    timestamp: u64
) -> String {
    // Combine all parameters with the secret key and timestamp
    let payload = format!(
        "{}:{}:{}:{}:{}:{}",
        SECRET_KEY,
        player_address,
        current_score,
        chain_id,
        session_id,
        timestamp
    );

    // Create a SHA-256 hash
    let mut hasher = Sha256::new();
    hasher.update(payload.as_bytes());
    let result = hasher.finalize();

    // Convert to hex string
    hex::encode(result)
}