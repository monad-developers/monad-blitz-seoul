# 데이터 구조 설계 (Contract Implementation Ready)

## 1. Monster NFT Data Structures

### Monster Struct
```solidity
/**
 * @dev Core data structure representing a Monster NFT
 * Each monster has base stats determined by Chainlink VRF and bonus stats from prediction market outcomes
 */
struct Monster {
    uint256 tokenId;                // Unique ERC-721 token identifier
    string name;                    // Player-chosen monster name (max 32 chars)
    MonsterType monsterType;        // Element type affecting battle bonuses
    BaseStats baseStats;            // Initial stats from VRF (immutable)
    BonusStats bonusStats;          // Additional stats from prediction success (mutable)
    uint256 createdAt;              // Block timestamp of minting
    uint256 totalBattles;           // Total battles participated in
    uint256 wins;                   // Number of battles won
    address owner;                  // Current NFT owner
    uint256[] predictionIssueIds;   // Array of associated prediction issues (3-5 per monster)
    bool isAlive;                   // Battle status (false = needs revival)
}

/**
 * @dev Monster element types that determine Data Feed bonuses and battle interactions
 * Each type has different reactions to market/weather conditions
 */
enum MonsterType {
    FIRE,       // +20% ATK on sunny weather, +10% ATK when BTC rises
    WATER,      // +25% SPD on rain, +15% SPD when stablecoin depegs
    EARTH,      // +15% DEF when VIX high, stable in all conditions
    AIR,        // +20% SPD when NASDAQ rises, +10% dodge in storms
    CRYPTO      // +10% all stats when ETH rises >5%
}

/**
 * @dev Base statistics determined by Chainlink VRF during minting
 * These values are immutable and represent the monster's genetic potential
 */
struct BaseStats {
    uint256 hp;          // Hit Points: 100-200 range (determines survivability)
    uint256 attack;      // Attack Power: 50-100 range (damage dealt per turn)
    uint256 defense;     // Defense: 30-80 range (damage reduction)
    uint256 speed;       // Speed: 40-90 range (turn order and dodge chance)
}

/**
 * @dev Bonus statistics earned through successful prediction market participation
 * These accumulate over time as players stake on correct outcomes
 */
struct BonusStats {
    uint256 hpBonus;            // Additional HP from health-related predictions
    uint256 attackBonus;        // Additional attack from price surge predictions
    uint256 defenseBonus;       // Additional defense from volatility predictions
    uint256 speedBonus;         // Additional speed from weather/trend predictions
    uint256 criticalChance;     // Critical hit probability: 0-100 (percentage)
    uint256 dodgeChance;        // Dodge probability: 0-100 (percentage)
}
```

### Monster Creation Input/Output
```solidity
/**
 * @dev Input parameters for minting a new Monster NFT
 */
struct MintRequest {
    string name;         // Monster name (validated for length and profanity)
    uint256 mintFee;     // Payment in $MONSTER tokens (base: 100 tokens)
}

/**
 * @dev Return data from successful monster minting
 * Contains all necessary information for frontend display and prediction market setup
 */
struct MintResult {
    uint256 tokenId;                // Newly minted NFT token ID
    Monster monster;                // Complete monster data structure
    uint256[] predictionIssueIds;   // Array of auto-generated prediction issue IDs
    uint256 vrfRequestId;           // Chainlink VRF request ID for stat generation
}
```

## 2. Prediction Issue Data Structures

### PredictionIssue Struct
```solidity
/**
 * @dev Represents a prediction market issue tied to a specific monster
 * Each monster gets 3-5 issues created automatically during minting
 * Issues are resolved by Chainlink Data Feeds at expiration
 */
struct PredictionIssue {
    uint256 issueId;            // Unique identifier for this prediction issue
    uint256 monsterTokenId;     // Associated monster that benefits from this issue
    IssueType issueType;        // Category of prediction (crypto, stocks, weather, etc.)
    string question;            // Human-readable prediction question
    DataSource dataSource;      // Chainlink feed source for resolution
    uint256 targetValue;        // Target value for comparison (scaled by feed decimals)
    ComparisonType comparison;  // How to compare actual vs target value
    uint256 createdAt;          // Block timestamp of issue creation
    uint256 resolveAt;          // Block timestamp when issue should be resolved
    IssueStatus status;         // Current lifecycle status
    bool result;                // Resolution result: true = YES wins, false = NO wins
    uint256 totalYesStaked;     // Total $MONSTER tokens staked on YES
    uint256 totalNoStaked;      // Total $MONSTER tokens staked on NO
    StatType affectedStat;      // Which monster stat gets bonus if resolved favorably
    uint256 bonusAmount;        // Bonus points awarded to stat (5-25 range)
}

/**
 * @dev Categories of prediction issues that can be created
 * Each type uses different Chainlink data sources for resolution
 */
enum IssueType {
    CRYPTO_PRICE,   // Cryptocurrency price predictions (ETH, BTC, etc.)
    STOCK_INDEX,    // Traditional market indices (NASDAQ, S&P500, VIX)
    WEATHER,        // Weather conditions via Chainlink Functions
    MONSTER_BATTLE  // Community-driven monster performance predictions
}

/**
 * @dev Available Chainlink data feed sources for issue resolution
 * Each source provides specific market/environmental data
 */
enum DataSource {
    ETH_USD,        // Ethereum price in USD
    BTC_USD,        // Bitcoin price in USD
    NASDAQ,         // NASDAQ Composite Index
    SP500,          // S&P 500 Index
    VIX,            // CBOE Volatility Index
    WEATHER_NYC,    // New York City weather data
    WEATHER_SEOUL,  // Seoul weather data
    CUSTOM          // Custom data source via Functions
}

/**
 * @dev Comparison operators for evaluating predictions
 * Determines how target value compares to actual data feed value
 */
enum ComparisonType {
    GREATER_THAN,   // Actual > Target
    LESS_THAN,      // Actual < Target
    EQUALS,         // Actual == Target (with small tolerance)
    GREATER_EQUAL,  // Actual >= Target
    LESS_EQUAL      // Actual <= Target
}

/**
 * @dev Lifecycle states of a prediction issue
 * Controls when staking is allowed and when resolution can occur
 */
enum IssueStatus {
    ACTIVE,     // Open for staking
    LOCKED,     // 24h before resolve - no new stakes allowed
    RESOLVED,   // Completed with final result
    CANCELLED   // Cancelled due to data feed issues
}

/**
 * @dev Monster statistics that can receive bonuses from successful predictions
 * Each stat affects different aspects of battle performance
 */
enum StatType {
    HP,         // Hit points - survivability in battles
    ATTACK,     // Attack power - damage dealt per turn
    DEFENSE,    // Defense - damage reduction
    SPEED,      // Speed - turn order and dodge chance
    CRITICAL,   // Critical hit chance - extra damage probability
    DODGE       // Dodge chance - avoid incoming attacks
}
```

### Issue Creation Input/Output
```solidity
/**
 * @dev Template for creating prediction issues during monster minting
 * Used to generate 3-5 diverse issues automatically
 */
struct IssueTemplate {
    IssueType issueType;        // Type of prediction to create
    DataSource dataSource;      // Chainlink data source to use
    uint256 durationDays;       // Issue lifetime: 7, 14, or 30 days
    StatType affectedStat;      // Monster stat that benefits from correct predictions
}

/**
 * @dev Result data from batch issue creation
 * Returns all created issues and their Chainlink integration details
 */
struct CreatedIssues {
    uint256[] issueIds;             // Array of newly created issue IDs
    PredictionIssue[] issues;       // Complete issue data structures
    uint256[] chainlinkRequestIds;  // VRF/Functions request IDs for data validation
}
```

## 3. Staking Pool Data Structures

### StakingPool Struct
```solidity
/**
 * @dev Manages prediction market staking for a specific issue
 * Implements binary betting (YES/NO) with dynamic odds calculation
 */
struct StakingPool {
    uint256 issueId;                        // Associated prediction issue ID
    mapping(address => UserStake) yesStakes; // User stakes on YES outcome
    mapping(address => UserStake) noStakes;  // User stakes on NO outcome
    address[] yesStakers;                   // Array of YES stakers (for iteration)
    address[] noStakers;                    // Array of NO stakers (for iteration)
    uint256 totalYesAmount;                 // Total $MONSTER tokens staked on YES
    uint256 totalNoAmount;                  // Total $MONSTER tokens staked on NO
    uint256 yesOdds;                        // Current odds for YES (calculated dynamically)
    uint256 noOdds;                         // Current odds for NO (calculated dynamically)
    bool isLocked;                          // True when 24h before resolution (no new stakes)
    uint256 insurancePool;                  // 5% of total stakes reserved for edge cases
}

/**
 * @dev Individual user's stake in a prediction issue
 * Tracks betting position and claim status
 */
struct UserStake {
    address user;               // Staker's address
    uint256 amount;             // Amount of $MONSTER tokens staked
    bool choice;                // Prediction choice: true = YES, false = NO
    uint256 stakedAt;           // Block timestamp of stake placement
    bool claimed;               // Whether rewards have been claimed
    uint256 expectedReturn;     // Expected payout based on current odds (for UI)
}
```

### Staking Input/Output
```solidity
/**
 * @dev Parameters for placing a stake on a prediction issue
 */
struct StakeRequest {
    uint256 issueId;    // ID of the prediction issue to stake on
    bool choice;        // Prediction: true = YES, false = NO
    uint256 amount;     // Amount of $MONSTER tokens to stake (min: 10 tokens)
}

/**
 * @dev Return data from successful stake placement
 * Provides updated pool information for frontend display
 */
struct StakeResult {
    uint256 userStakeId;        // Unique identifier for this stake
    uint256 newYesTotal;        // Updated total YES stakes
    uint256 newNoTotal;         // Updated total NO stakes
    uint256 newYesOdds;         // New odds for YES (e.g., 150 = 1.5x)
    uint256 newNoOdds;          // New odds for NO (e.g., 280 = 2.8x)
    uint256 expectedReturn;     // Expected payout if prediction is correct
}

/**
 * @dev Parameters for batch claiming rewards from multiple resolved issues
 */
struct ClaimRequest {
    uint256[] issueIds;     // Array of resolved issue IDs to claim from
}

/**
 * @dev Return data from reward claiming operation
 * Summarizes all rewards claimed across multiple issues
 */
struct ClaimResult {
    uint256 totalReward;            // Total $MONSTER tokens received
    uint256 totalMonsterTokens;     // Bonus tokens for correct predictions
    uint256[] claimedIssues;        // Successfully claimed issue IDs
    uint256[] rewardAmounts;        // Individual reward amounts per issue
}
```

## 4. Battle System Data Structures

### Battle Struct
```solidity
/**
 * @dev Represents a PvP battle between two monsters
 * Environment conditions from Chainlink Data Feeds affect battle outcomes
 */
struct Battle {
    uint256 battleId;               // Unique battle identifier
    uint256 monster1Id;             // First monster's token ID
    uint256 monster2Id;             // Second monster's token ID
    address player1;                // Owner of monster1
    address player2;                // Owner of monster2
    uint256 startedAt;              // Block timestamp when battle initiated
    uint256 completedAt;            // Block timestamp when battle finished
    BattleEnvironment environment;  // Real-world data affecting battle
    BattleResult result;            // Final battle outcome
    uint256[] actionLog;            // Encoded turn-by-turn battle actions
}

/**
 * @dev Real-world environmental factors from Chainlink that influence battle
 * Different monster types get bonuses/penalties based on these conditions
 */
struct BattleEnvironment {
    uint256 ethPrice;           // ETH/USD price at battle start (affects Crypto types)
    uint256 btcPrice;           // BTC/USD price at battle start (affects Crypto types)
    uint256 nasdaqIndex;        // NASDAQ index (affects Air types)
    int256 temperature;         // Temperature in Celsius (affects Fire/Water types)
    string weatherCondition;    // Weather string: "sunny", "rainy", "cloudy", "stormy"
    uint256 vixIndex;           // VIX volatility index (affects all monster dodge rates)
}

/**
 * @dev Final outcome of a completed battle
 * Used for rewards distribution and monster stat updates
 */
struct BattleResult {
    uint256 winnerId;           // Token ID of winning monster
    uint256 loserId;            // Token ID of losing monster
    uint256 winnerHpRemaining;  // Winner's remaining HP (affects reward multiplier)
    uint256 totalTurns;         // Number of turns battle lasted
    uint256 rewardAmount;       // $MONSTER tokens awarded to winner
}
```

### Battle Input/Output
```solidity
/**
 * @dev Parameters for initiating a battle between two monsters
 */
struct BattleRequest {
    uint256 monster1Id;         // First monster (challenger)
    uint256 monster2Id;         // Second monster (defender)
    uint256 wageredAmount;      // Optional: $MONSTER tokens wagered on outcome
}

/**
 * @dev Return data from battle initiation
 * Contains environment snapshot and Chainlink request tracking
 */
struct BattleInitiated {
    uint256 battleId;                   // Newly created battle ID
    BattleEnvironment environment;      // Current environmental conditions
    uint256[] chainlinkRequestIds;      // Array of pending Chainlink requests
    uint256 estimatedDuration;          // Expected battle completion time (blocks)
}

/**
 * @dev Parameters for executing a battle (called by Chainlink Automation)
 * Contains finalized environmental data from all feeds
 */
struct BattleExecution {
    uint256 battleId;                   // Battle to execute
    BattleEnvironment finalEnvironment; // Confirmed environment data from oracles
}

/**
 * @dev Return data from completed battle execution
 * Includes all rewards and bonuses applied
 */
struct BattleCompleted {
    BattleResult result;            // Complete battle outcome
    uint256 winnerTokensEarned;     // $MONSTER tokens awarded to winner
    uint256 winnerExpGained;        // Experience points gained
    StatBonuses environmentBonuses; // Temporary stat bonuses from environment
}

/**
 * @dev Environmental stat bonuses applied during battle
 * Based on monster type and current Chainlink data feed values
 */
struct StatBonuses {
    uint256 attackBonus;        // Temporary attack bonus percentage
    uint256 defenseBonus;       // Temporary defense bonus percentage
    uint256 speedBonus;         // Temporary speed bonus percentage
    uint256 criticalBonus;      // Additional critical hit chance
    uint256 dodgeBonus;         // Additional dodge chance
    string bonusReason;         // Human-readable explanation (e.g., "Sunny weather boosts Fire types")
}
```

## 5. Token Economics Data Structures

### TokenReward Struct
```solidity
/**
 * @dev Record of a token reward distribution event
 * Used for tracking and auditing all reward payments
 */
struct TokenReward {
    address recipient;          // Address receiving the reward
    uint256 amount;             // Amount of $MONSTER tokens awarded
    RewardType rewardType;      // Category of reward earned
    uint256 timestamp;          // Block timestamp of reward distribution
    uint256 relatedId;          // Associated entity ID (issueId for stakes, battleId for battles)
}

/**
 * @dev Types of rewards that can be earned in the game
 * Each type has different calculation methods and frequency
 */
enum RewardType {
    STAKE_WIN,      // Reward for correct prediction market stakes
    BATTLE_WIN,     // Reward for winning monster battles
    DAILY_BONUS,    // Daily participation bonus (lower amount)
    WEEKLY_BONUS,   // Weekly participation bonus (higher amount)
    REFERRAL_BONUS  // Bonus for referring new players
}

/**
 * @dev Comprehensive balance tracking for each user
 * Includes both liquid and staked token amounts
 */
struct UserBalance {
    address user;               // User's wallet address
    uint256 monsterTokens;      // Liquid $MONSTER tokens available for use
    uint256 stakedAmount;       // Total tokens currently staked in prediction markets
    uint256 pendingRewards;     // Earned but unclaimed rewards
    uint256 totalEarned;        // Lifetime total tokens earned (for leaderboards)
    uint256 totalSpent;         // Lifetime total tokens spent (for analytics)
}
```

### Token Operations Input/Output
```solidity
/**
 * @dev Parameters for batch reward distribution after issue resolution
 * Distributes rewards to all correct prediction stakers
 */
struct RewardDistribution {
    uint256 issueId;            // Resolved prediction issue ID
    address[] winners;          // Array of addresses who predicted correctly
    uint256[] amounts;          // Corresponding reward amounts for each winner
    uint256 totalDistributed;   // Sum of all distributed rewards (for validation)
}

/**
 * @dev Return data from reward distribution operation
 * Includes deflationary burn mechanism results
 */
struct DistributionResult {
    uint256 totalDistributed;   // Total tokens distributed to winners
    uint256 remainingPool;      // Tokens remaining in the staking pool
    uint256 burnedAmount;       // Tokens burned for deflationary pressure (2% of total)
}
```

## 6. Chainlink Integration Interfaces

### Data Feed Integration
```solidity
/**
 * @dev Interface for interacting with Chainlink Data Feeds
 * Provides real-time price and index data for prediction market resolution
 */
interface IChainlinkDataFeeds {
    /**
     * @dev Get the most recent price data from a specific feed
     * @param source The data source to query (ETH_USD, BTC_USD, etc.)
     * @return price Latest price value (scaled by feed's decimal precision)
     * @return timestamp Block timestamp of the price update
     */
    function getLatestPrice(DataSource source) external view returns (int256 price, uint256 timestamp);
    
    /**
     * @dev Get historical price data from a specific timestamp
     * @param source The data source to query
     * @param timestamp Historical timestamp to retrieve price for
     * @return price Historical price value at the specified timestamp
     */
    function getPriceAtTimestamp(DataSource source, uint256 timestamp) external view returns (int256 price);
    
    /**
     * @dev Subscribe to automatic price updates for a data source
     * @param source The data source to monitor
     * @param callback Contract address to notify on price updates
     */
    function subscribeToFeed(DataSource source, address callback) external;
}

/**
 * @dev Structured price data returned from Chainlink feeds
 * Includes validation and precision information
 */
struct PriceData {
    DataSource source;      // Which feed this data comes from
    int256 price;           // Price value (can be negative for some indices)
    uint256 timestamp;      // When this price was recorded
    uint8 decimals;         // Decimal precision of the price (usually 8 or 18)
    bool isValid;           // Whether this data passed validation checks
}
```

### VRF Integration
```solidity
/**
 * @dev Interface for Chainlink Verifiable Random Function (VRF)
 * Provides cryptographically secure randomness for game mechanics
 */
interface IChainlinkVRF {
    /**
     * @dev Request multiple random words from Chainlink VRF
     * @param numWords Number of random uint256 values to generate
     * @return requestId Unique identifier for tracking this randomness request
     */
    function requestRandomWords(uint256 numWords) external returns (uint256 requestId);
    
    /**
     * @dev Callback function called by Chainlink VRF with random values
     * @param requestId The request ID that was originally submitted
     * @param randomWords Array of cryptographically secure random numbers
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external;
}

/**
 * @dev Tracks pending VRF requests and their intended use
 * Allows proper routing of randomness to correct game functions
 */
struct VRFRequest {
    uint256 requestId;      // Chainlink VRF request identifier
    address requester;      // Contract or user that requested randomness
    uint256 numWords;       // Number of random words requested
    RequestType requestType; // What this randomness will be used for
    uint256 relatedId;      // Associated game entity (monster tokenId or battle ID)
}

/**
 * @dev Categories of randomness requests in the game
 * Each type uses randomness differently in game logic
 */
enum RequestType {
    MONSTER_STATS,      // Generate base stats for newly minted monsters
    BATTLE_CRITICAL,    // Determine critical hits and special moves in battles
    RANDOM_EVENT        // Trigger special events or environmental effects
}
```

### Functions Integration
```solidity
/**
 * @dev Interface for Chainlink Functions (external API calls)
 * Enables integration with external data sources not available via Data Feeds
 */
interface IChainlinkFunctions {
    /**
     * @dev Send a request to execute custom JavaScript code that can call external APIs
     * @param source JavaScript code to execute (fetches weather data, etc.)
     * @param args Encoded parameters to pass to the JavaScript function
     * @return requestId Unique identifier for tracking this function request
     */
    function sendRequest(string memory source, bytes memory args) external returns (bytes32 requestId);
}

/**
 * @dev Tracks pending Chainlink Functions requests
 * Used for fetching custom data like weather information
 */
struct FunctionsRequest {
    bytes32 requestId;      // Chainlink Functions request identifier
    string apiEndpoint;     // External API being called (e.g., weather service)
    bytes parameters;       // Encoded parameters for the API call
    address callback;       // Contract to receive the response
    uint256 timestamp;      // When this request was made
}

/**
 * @dev Weather data structure returned by external weather APIs
 * Used for environmental effects in battles and prediction markets
 */
struct WeatherData {
    string city;            // City name ("New York", "Seoul", etc.)
    int256 temperature;     // Temperature in Celsius (can be negative)
    uint256 humidity;       // Humidity percentage (0-100)
    string condition;       // Weather condition ("sunny", "rainy", "cloudy", "stormy")
    uint256 timestamp;      // When this weather data was recorded
}
```

## 7. Contract State Management

### Global Game State
```solidity
/**
 * @dev Central state management for the entire game ecosystem
 * Maintains all game entities and their relationships
 */
struct GameState {
    uint256 totalMonsters;              // Total number of monsters ever minted
    uint256 activeIssues;               // Number of prediction issues currently open for staking
    uint256 totalStaked;                // Total $MONSTER tokens currently staked across all issues
    uint256 totalRewardsDistributed;    // Lifetime total rewards distributed (for analytics)
    uint256 activeBattles;              // Number of battles currently in progress
    
    // Core game entity mappings
    mapping(uint256 => Monster) monsters;           // tokenId => Monster data
    mapping(uint256 => PredictionIssue) issues;     // issueId => PredictionIssue data
    mapping(uint256 => StakingPool) pools;          // issueId => StakingPool data
    mapping(uint256 => Battle) battles;             // battleId => Battle data
    mapping(address => UserBalance) balances;       // userAddress => UserBalance data
}
```

### Events for Frontend Integration
```solidity
/**
 * @dev Event emitted when a new monster is minted
 * Includes all associated prediction issues created automatically
 */
event MonsterMinted(uint256 indexed tokenId, address indexed owner, MonsterType monsterType, uint256[] issueIds);

/**
 * @dev Event emitted when a new prediction issue is created
 * Provides all details needed for frontend display
 */
event IssueCreated(uint256 indexed issueId, uint256 indexed monsterId, IssueType issueType, uint256 resolveAt);

/**
 * @dev Event emitted when a user places a stake on a prediction issue
 * Includes updated odds for real-time frontend updates
 */
event StakePlaced(uint256 indexed issueId, address indexed staker, bool choice, uint256 amount, uint256 newOdds);

/**
 * @dev Event emitted when a prediction issue is resolved by Chainlink data
 * Lists all winners for reward distribution
 */
event IssueResolved(uint256 indexed issueId, bool result, uint256 totalRewards, address[] winners);

/**
 * @dev Event emitted when a battle between monsters is initiated
 * Marks the start of battle resolution process
 */
event BattleInitiated(uint256 indexed battleId, uint256 monster1Id, uint256 monster2Id);

/**
 * @dev Event emitted when a battle is completed
 * Includes final winner and reward information
 */
event BattleCompleted(uint256 indexed battleId, uint256 winnerId, uint256 rewardAmount);

/**
 * @dev Event emitted when tokens are distributed as rewards
 * Tracks all reward payments for analytics and user interfaces
 */
event TokensRewarded(address indexed recipient, uint256 amount, RewardType rewardType);
```

이제 모든 컨트랙트 구현에 필요한 데이터 구조가 완성되었습니다!