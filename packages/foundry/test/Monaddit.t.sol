// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/MdtToken.sol";
import "../contracts/StakingVault.sol";
import "../contracts/ContentRegistry.sol";
import "../contracts/ModerationGame.sol";
import "../contracts/ReputationSBT.sol";
import "../contracts/StakingRewards.sol";
import "../contracts/Treasury.sol";

contract MonadditTest is Test {
    MdtToken mdtToken;
    StakingVault stakingVault;
    ContentRegistry contentRegistry;
    ModerationGame moderationGame;
    ReputationSBT reputationSBT;
    StakingRewards stakingRewards;
    Treasury treasury;

    address owner = address(1);
    address alice = address(2);
    address bob = address(3);
    address charlie = address(4);

    uint256 constant INITIAL_BALANCE = 1000 * 10 ** 18;
    uint256 constant STAKE_AMOUNT = 10 * 10 ** 18;
    uint256 constant CONTENT_BOND = 0.1 * 10 ** 18;

    function setUp() public {
        vm.startPrank(owner);

        // Deploy contracts
        mdtToken = new MdtToken();
        stakingVault = new StakingVault(address(mdtToken));
        contentRegistry = new ContentRegistry(address(stakingVault));
        moderationGame = new ModerationGame(address(contentRegistry), address(stakingVault));
        reputationSBT = new ReputationSBT();
        stakingRewards = new StakingRewards(address(mdtToken), address(stakingVault));
        treasury = new Treasury(address(mdtToken));

        // Setup roles
        stakingVault.grantRole(stakingVault.CONTENT_REGISTRY_ROLE(), address(contentRegistry));
        stakingVault.grantRole(stakingVault.SLASHER_ROLE(), address(contentRegistry));
        
        contentRegistry.setContracts(
            address(moderationGame),
            address(stakingRewards),
            address(treasury)
        );
        contentRegistry.grantRole(contentRegistry.RESOLVER_ROLE(), address(moderationGame));

        moderationGame.setReputationSBT(address(reputationSBT));
        stakingRewards.setReputationSBT(address(reputationSBT));
        stakingRewards.grantRole(stakingRewards.ACCRUER_ROLE(), address(contentRegistry));

        reputationSBT.grantRole(reputationSBT.UPDATER_ROLE(), address(contentRegistry));
        reputationSBT.grantRole(reputationSBT.UPDATER_ROLE(), address(moderationGame));
        reputationSBT.grantRole(reputationSBT.MINTER_ROLE(), owner);

        // Mint tokens to test users
        mdtToken.mint(alice, INITIAL_BALANCE);
        mdtToken.mint(bob, INITIAL_BALANCE);
        mdtToken.mint(charlie, INITIAL_BALANCE);

        vm.stopPrank();
    }

    function testTokenDeployment() public {
        assertEq(mdtToken.name(), "Monaddit Token");
        assertEq(mdtToken.symbol(), "MDT");
        assertEq(mdtToken.balanceOf(alice), INITIAL_BALANCE);
    }

    function testStaking() public {
        vm.startPrank(alice);
        
        // Approve and stake
        mdtToken.approve(address(stakingVault), STAKE_AMOUNT);
        stakingVault.deposit(STAKE_AMOUNT);

        // Check stake info
        (uint256 totalAmount, uint256 available, , , ) = stakingVault.getStakeInfo(alice);
        assertEq(totalAmount, STAKE_AMOUNT);
        assertEq(available, STAKE_AMOUNT);

        vm.stopPrank();
    }

    function testContentPublishing() public {
        // Setup: Alice stakes and gets SBT
        vm.startPrank(alice);
        mdtToken.approve(address(stakingVault), STAKE_AMOUNT);
        stakingVault.deposit(STAKE_AMOUNT);
        vm.stopPrank();

        vm.prank(owner);
        reputationSBT.mint(alice);

        // Alice publishes content
        vm.startPrank(alice);
        bytes32 contentHash = keccak256("Hello Monaddit!");
        string memory uri = "ipfs://QmTest";
        
        uint256 contentId = contentRegistry.publish(contentHash, uri);
        assertEq(contentId, 0);

        // Check content details
        (
            address author,
            bytes32 hash,
            string memory contentUri,
            uint256 bond,
            ,
            ,
            ContentRegistry.ContentStatus status
        ) = contentRegistry.getContent(contentId);

        assertEq(author, alice);
        assertEq(hash, contentHash);
        assertEq(contentUri, uri);
        assertEq(bond, CONTENT_BOND);
        assertEq(uint(status), uint(ContentRegistry.ContentStatus.Published));

        vm.stopPrank();
    }

    function testChallenge() public {
        // Setup: Alice and Bob stake
        vm.startPrank(alice);
        mdtToken.approve(address(stakingVault), STAKE_AMOUNT);
        stakingVault.deposit(STAKE_AMOUNT);
        vm.stopPrank();

        vm.startPrank(bob);
        mdtToken.approve(address(stakingVault), STAKE_AMOUNT);
        stakingVault.deposit(STAKE_AMOUNT);
        vm.stopPrank();

        // Alice publishes content
        vm.startPrank(alice);
        bytes32 contentHash = keccak256("Malicious content");
        uint256 contentId = contentRegistry.publish(contentHash, "");
        vm.stopPrank();

        // Bob challenges the content
        vm.startPrank(bob);
        contentRegistry.challenge(
            contentId,
            ContentRegistry.ChallengeReason.Harassment,
            "This is harassment"
        );

        // Check content status
        (,,,,,,ContentRegistry.ContentStatus status) = contentRegistry.getContent(contentId);
        assertEq(uint(status), uint(ContentRegistry.ContentStatus.Challenged));

        vm.stopPrank();
    }

    function testBondWithdrawal() public {
        // Setup: Alice stakes
        vm.startPrank(alice);
        mdtToken.approve(address(stakingVault), STAKE_AMOUNT);
        stakingVault.deposit(STAKE_AMOUNT);

        // Publish content
        bytes32 contentHash = keccak256("Good content");
        uint256 contentId = contentRegistry.publish(contentHash, "");
        vm.stopPrank();

        // Fast forward past challenge window
        vm.warp(block.timestamp + 8 days);

        // Alice withdraws bond
        vm.prank(alice);
        contentRegistry.withdrawBond(contentId);

        // Check stake is restored
        (uint256 totalAmount, uint256 available, , , ) = stakingVault.getStakeInfo(alice);
        assertEq(available, STAKE_AMOUNT); // Full stake available again
    }

    function testReputationSystem() public {
        vm.startPrank(owner);
        
        // Mint SBT for Alice
        uint256 tokenId = reputationSBT.mint(alice);
        assertEq(tokenId, 1);

        // Check initial reputation
        (uint256 karma, uint256 disputeRate) = reputationSBT.getReputation(alice);
        assertEq(karma, 100); // Starting karma
        assertEq(disputeRate, 0);

        // Update karma
        reputationSBT.grantRole(reputationSBT.UPDATER_ROLE(), owner);
        reputationSBT.updateKarma(alice, 50, "Good contribution");

        (karma, ) = reputationSBT.getReputation(alice);
        assertEq(karma, 150);

        vm.stopPrank();
    }

    function testStakingRewards() public {
        // Setup: Owner adds rewards to pool
        vm.startPrank(owner);
        mdtToken.mint(owner, 100 * 10 ** 18);
        mdtToken.approve(address(stakingRewards), 100 * 10 ** 18);
        
        stakingRewards.grantRole(stakingRewards.ACCRUER_ROLE(), owner);
        stakingRewards.accrue(100 * 10 ** 18);

        // Fast forward to next epoch
        vm.warp(block.timestamp + 8 days);
        stakingRewards.checkpoint();

        vm.stopPrank();

        // Check epoch info
        (,,uint256 totalRewards,,bool finalized) = stakingRewards.getEpochInfo(0);
        assertEq(totalRewards, 100 * 10 ** 18);
        assertTrue(finalized);
    }

    function testTreasury() public {
        vm.startPrank(owner);
        
        // Fund treasury
        mdtToken.mint(owner, 100 * 10 ** 18);
        mdtToken.approve(address(treasury), 100 * 10 ** 18);
        treasury.receiveFunds(100 * 10 ** 18, "Initial funding");

        // Check balance
        assertEq(treasury.getTreasuryBalance(), 100 * 10 ** 18);

        // Create bounty
        treasury.grantRole(treasury.TREASURER_ROLE(), owner);
        uint256 bountyId = treasury.createBounty("Bug bounty", 10 * 10 ** 18);
        assertEq(bountyId, 0);

        // Claim bounty
        treasury.claimBounty(bountyId, alice);
        assertEq(mdtToken.balanceOf(alice), INITIAL_BALANCE + 10 * 10 ** 18);

        vm.stopPrank();
    }
}