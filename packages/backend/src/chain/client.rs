use alloy::{
    primitives::{address, Address, B256, U256},
    providers::{Provider, ProviderBuilder},
};

use crate::chain::contracts::*;
use crate::config::Config;
use anyhow::Result;

// DynProvider is the erased provider type
type DynProvider = alloy::providers::DynProvider;

#[derive(Clone)]
pub struct ChainClient {
    provider: DynProvider,
    config: Config,
}

impl ChainClient {
    pub async fn new(config: Config) -> Result<Self> {
        // Create HTTP provider
        let regular_provider = ProviderBuilder::new().connect(&config.rpc_url).await?;

        // Use the erased method to obtain a DynProvider
        let dyn_provider = regular_provider.erased();

        Ok(Self {
            provider: dyn_provider,
            config,
        })
    }

    pub fn provider(&self) -> DynProvider {
        self.provider.clone()
    }

    // Get latest block number
    pub async fn get_latest_block(&self) -> Result<u64> {
        let block = self.provider.get_block_number().await?;
        Ok(block)
    }

    // Contract interaction methods
    pub async fn get_content_info(&self, content_id: U256) -> Result<ContentInfo> {
        let contract = ContentRegistry::new(
            self.config.content_registry_address.parse()?,
            &self.provider,
        );

        // This would call the getContent method
        // The actual method names depend on your contract ABI
        // let result = contract.getContent(content_id).call().await?;

        // Placeholder for now
        Ok(ContentInfo {
            author: address!("0000000000000000000000000000000000000000"),
            content_hash: B256::default(),
            uri: String::new(),
            bond: U256::ZERO,
            published_at: U256::ZERO,
            lock_until: U256::ZERO,
            status: 0,
        })
    }

    pub async fn get_stake_info(&self, user: Address) -> Result<StakeInfo> {
        let contract =
            StakingVault::new(self.config.staking_vault_address.parse()?, &self.provider);

        // This would call the getStakeInfo method
        // let result = contract.getStakeInfo(user).call().await?;

        // Placeholder for now
        Ok(StakeInfo {
            total_amount: U256::ZERO,
            available: U256::ZERO,
            locked: U256::ZERO,
            staked_at: U256::ZERO,
            stake_age: U256::ZERO,
        })
    }

    pub async fn get_reputation(&self, user: Address) -> Result<(U256, U256)> {
        let contract =
            ReputationSBT::new(self.config.reputation_sbt_address.parse()?, &self.provider);

        // This would call the getReputation method
        // let result = contract.getReputation(user).call().await?;

        Ok((U256::from(100), U256::ZERO))
    }

    pub async fn get_reputation_multiplier(&self, user: Address) -> Result<U256> {
        let contract =
            ReputationSBT::new(self.config.reputation_sbt_address.parse()?, &self.provider);

        // This would call the getReputationMultiplier method
        // let result = contract.getReputationMultiplier(user).call().await?;

        Ok(U256::from(100))
    }

    pub async fn get_pending_rewards(&self, user: Address) -> Result<U256> {
        let contract =
            StakingRewards::new(self.config.staking_rewards_address.parse()?, &self.provider);

        // This would call the getPendingRewards method
        // let result = contract.getPendingRewards(user).call().await?;

        Ok(U256::ZERO)
    }

    pub async fn is_eligible_staker(&self, user: Address) -> Result<bool> {
        let contract =
            StakingVault::new(self.config.staking_vault_address.parse()?, &self.provider);

        // This would call the isEligibleStaker method
        // let result = contract.isEligibleStaker(user).call().await?;

        Ok(true)
    }
}

// Data structures for contract returns
pub struct ContentInfo {
    pub author: Address,
    pub content_hash: B256,
    pub uri: String,
    pub bond: U256,
    pub published_at: U256,
    pub lock_until: U256,
    pub status: u8,
}

pub struct StakeInfo {
    pub total_amount: U256,
    pub available: U256,
    pub locked: U256,
    pub staked_at: U256,
    pub stake_age: U256,
}
