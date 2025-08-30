use alloy::sol;

// Contract ABIs from JSON files using sol! macro
sol!(
    #[allow(missing_docs)]
    #[sol(rpc)]
    MdtToken,
    "abis/MdtToken.json"
);

sol!(
    #[allow(missing_docs)]
    #[sol(rpc)]
    ContentRegistry,
    "abis/ContentRegistry.json"
);

sol!(
    #[allow(missing_docs)]
    #[sol(rpc)]
    StakingVault,
    "abis/StakingVault.json"
);

sol!(
    #[allow(missing_docs)]
    #[sol(rpc)]
    ReputationSBT,
    "abis/ReputationSBT.json"
);

sol!(
    #[allow(missing_docs)]
    #[sol(rpc)]
    ModerationGame,
    "abis/ModerationGame.json"
);

sol!(
    #[allow(missing_docs)]
    #[sol(rpc)]
    StakingRewards,
    "abis/StakingRewards.json"
);
