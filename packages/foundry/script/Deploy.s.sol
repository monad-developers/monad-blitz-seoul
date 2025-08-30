//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import "../contracts/MdtToken.sol";
import "../contracts/StakingVault.sol";
import "../contracts/ContentRegistry.sol";
import "../contracts/ModerationGame.sol";
import "../contracts/ReputationSBT.sol";
import "../contracts/StakingRewards.sol";
import "../contracts/Treasury.sol";

/**
 * @notice Main deployment script for Monaddit contracts
 * @dev Deploys all core contracts and sets up roles/connections
 */
contract DeployScript is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {

        // Deploy MDT Token
        MdtToken mdtToken = new MdtToken();
        console.logString(string.concat("MdtToken deployed to: ", vm.toString(address(mdtToken))));

        // Deploy StakingVault
        StakingVault stakingVault = new StakingVault(address(mdtToken));
        console.logString(string.concat("StakingVault deployed to: ", vm.toString(address(stakingVault))));

        // Deploy ContentRegistry
        ContentRegistry contentRegistry = new ContentRegistry(address(stakingVault));
        console.logString(string.concat("ContentRegistry deployed to: ", vm.toString(address(contentRegistry))));

        // Deploy ModerationGame
        ModerationGame moderationGame = new ModerationGame(
            address(contentRegistry),
            address(stakingVault)
        );
        console.logString(string.concat("ModerationGame deployed to: ", vm.toString(address(moderationGame))));

        // Deploy ReputationSBT
        ReputationSBT reputationSBT = new ReputationSBT();
        console.logString(string.concat("ReputationSBT deployed to: ", vm.toString(address(reputationSBT))));

        // Deploy StakingRewards
        StakingRewards stakingRewards = new StakingRewards(
            address(mdtToken),
            address(stakingVault)
        );
        console.logString(string.concat("StakingRewards deployed to: ", vm.toString(address(stakingRewards))));

        // Deploy Treasury
        Treasury treasury = new Treasury(address(mdtToken));
        console.logString(string.concat("Treasury deployed to: ", vm.toString(address(treasury))));

        // Setup roles and connections
        console.logString("Setting up roles and connections...");

        // Grant roles to ContentRegistry
        stakingVault.grantRole(stakingVault.CONTENT_REGISTRY_ROLE(), address(contentRegistry));
        stakingVault.grantRole(stakingVault.SLASHER_ROLE(), address(contentRegistry));

        // Setup ContentRegistry connections
        contentRegistry.setContracts(
            address(moderationGame),
            address(stakingRewards),
            address(treasury)
        );

        // Grant resolver role to ModerationGame
        contentRegistry.grantRole(contentRegistry.RESOLVER_ROLE(), address(moderationGame));

        // Setup ModerationGame connections
        moderationGame.setReputationSBT(address(reputationSBT));

        // Setup StakingRewards connections
        stakingRewards.setReputationSBT(address(reputationSBT));
        stakingRewards.grantRole(stakingRewards.ACCRUER_ROLE(), address(contentRegistry));

        // Grant updater roles to ContentRegistry and ModerationGame for ReputationSBT
        reputationSBT.grantRole(reputationSBT.UPDATER_ROLE(), address(contentRegistry));
        reputationSBT.grantRole(reputationSBT.UPDATER_ROLE(), address(moderationGame));

        // Store deployments for export
        deployments.push(Deployment("MdtToken", address(mdtToken)));
        deployments.push(Deployment("StakingVault", address(stakingVault)));
        deployments.push(Deployment("ContentRegistry", address(contentRegistry)));
        deployments.push(Deployment("ModerationGame", address(moderationGame)));
        deployments.push(Deployment("ReputationSBT", address(reputationSBT)));
        deployments.push(Deployment("StakingRewards", address(stakingRewards)));
        deployments.push(Deployment("Treasury", address(treasury)));

        console.logString("Deployment complete!");
    }
}
