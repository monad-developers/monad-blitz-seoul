// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TokenSender} from "../src/TokenSender.sol";

/// @dev ERC20 interface
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

/// @title TestTokenSender
/// @notice TokenSender를 테스트하는 스크립트
contract TestTokenSender is Script {
    function run() public {
        // PRIVATE_KEY를 문자열로 읽고 uint256으로 변환
        string memory privateKeyStr = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(privateKeyStr);
        address deployer = vm.addr(deployerPrivateKey);

        // 주소 설정
        address payable tokenSenderAddress = payable(0x14dD52a43dc3f6F9004d73602FeF6B23D401323C);
        // USDC 주소 (새로운 주소)
        address tokenAddress = 0x4e7C363fb15768129b2B0C824E8a6597C6B90fC1;
        address receiverAddress = 0xE5BFB7751472CF54f50ceB1D2AD4a4Ab5C95Da8c;
        
        // 테스트: 토큰 수량 0으로 설정 (메시지만 전송, burn 에러 방지)
        uint256 amount = 112;
        uint256 nativeFeeBuffer = 1000000000000000;
        uint256 chunkSize = vm.envOr("TRANSFER_CHUNK", amount);
        if (amount == 0) {
            chunkSize = 0;
        } else if (chunkSize == 0 || chunkSize > amount) {
            chunkSize = amount;
        }

        console.log("=== Testing TokenSender ===");
        console.log("TokenSender address:", tokenSenderAddress);
        console.log("Token address (USDC):", tokenAddress);
        console.log("Receiver address:", receiverAddress);
        console.log("Amount: 10 USDC (", amount, ")");
        if (amount > 0) {
            console.log("Chunk size:", chunkSize, "(env TRANSFER_CHUNK)");
        } else {
            console.log("Message-only mode (amount = 0)");
        }
        console.log("Deployer address:", deployer);

        TokenSender sender = TokenSender(tokenSenderAddress);
        IERC20 token = IERC20(tokenAddress);

        vm.startBroadcast(deployerPrivateKey);

        // 1. 잔액 확인
        console.log("\n--- Step 1: Check Balances ---");
        uint256 deployerBalance = token.balanceOf(deployer);
        console.log("Deployer USDC balance:", deployerBalance);
        
        uint256 senderBalance = sender.getTokenBalance(tokenAddress);
        console.log("TokenSender USDC balance:", senderBalance);

        // 2. 토큰 입금 (amount > 0인 경우만)
        if (amount > 0) {
            if (senderBalance < amount) {
                console.log("\n--- Step 2: Deposit USDC to TokenSender ---");
                if (deployerBalance < amount) {
                    console.log("[ERROR] Not enough USDC balance!");
                    console.log("Required:", amount);
                    console.log("Available:", deployerBalance);
                    vm.stopBroadcast();
                    return;
                }

                // Approve
                token.approve(tokenSenderAddress, amount);
                console.log("Approved", amount, "USDC");

                // Deposit
                // sender.depositToken(tokenAddress, amount);
                console.log("Deposited", amount, "USDC to TokenSender");
                console.log("New TokenSender balance:", sender.getTokenBalance(tokenAddress));
            } else {
                console.log("\n--- Step 2: TokenSender has enough USDC ---");
                console.log("Skipping deposit");
            }
        } else {
            console.log("\n--- Step 2: Skipping deposit (amount = 0, message only) ---");
        }

        // 3. WMON 입금 (feeToken이 WMON인 경우)
        console.log("\n--- Step 3: Deposit WMON (for fees) ---");
        address wmon = 0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701;
        IERC20 wmonToken = IERC20(wmon);
        
        if (sender.feeToken() != address(0)) {
            uint256 wmonAmount = 1000000000000000000; // 1 WMON
            uint256 deployerWmonBalance = wmonToken.balanceOf(deployer);
            uint256 senderWmonBalance = sender.getFeeTokenBalance();
            
            console.log("Deployer WMON balance:", deployerWmonBalance);
            console.log("TokenSender WMON balance:", senderWmonBalance);
            
            if (senderWmonBalance < wmonAmount && deployerWmonBalance >= wmonAmount) {
                wmonToken.transfer(tokenSenderAddress, wmonAmount);
                console.log("Transferred 1 WMON to TokenSender");
            } else {
                console.log("TokenSender has enough WMON or deployer doesn't have enough");
            }
        } else {
            console.log("FeeToken is native, skipping WMON deposit");
        }

        // 4. 수수료 확인
        console.log("\n--- Step 4: Check CCIP Fee ---");
        uint256 previewAmount = amount == 0 ? 0 : chunkSize;
        try sender.getTransferFee(tokenAddress, receiverAddress, previewAmount) returns (uint256 estimatedFee) {
            console.log("Estimated CCIP fee per chunk(", previewAmount, "):", estimatedFee);
            if (sender.feeToken() == address(0)) {
                console.log("Fee in native token (MONAD)");
            } else {
                console.log("Fee in feeToken (WMON)");
            }
        } catch {
            console.log("Could not estimate fee");
        }

        // 5. 토큰 전송
        console.log("\n--- Step 5: Send Tokens via CCIP ---");
        uint256 totalChunks = amount == 0 ? 1 : (amount + chunkSize - 1) / chunkSize;
        uint256 remaining = amount;
        for (uint256 chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            uint256 sendAmount = amount == 0
                ? 0
                : remaining > chunkSize
                    ? chunkSize
                    : remaining;
            // console.log("Sending chunk", chunkIndex + 1, "/", totalChunks, "amount:", sendAmount);

            uint256 chunkFee = 0;
            try sender.getTransferFee(tokenAddress, receiverAddress, sendAmount) returns (uint256 estimatedChunkFee) {
                chunkFee = estimatedChunkFee;
                console.log("Estimated fee for chunk:", estimatedChunkFee);
            } catch {
                console.log("Could not estimate fee for chunk, sending without preview");
            }

            uint256 valueToSend = 0;
            if (sender.feeToken() == address(0)) {
                valueToSend = chunkFee > 0 ? chunkFee + nativeFeeBuffer : nativeFeeBuffer;
            }

            if (sendAmount == 0) {
                try sender.transferMessage{value: valueToSend}(receiverAddress) returns (bytes32 messageId) {
                    console.log("\n[SUCCESS] Message chunk sent!");
                    console.log("Message ID:", vm.toString(messageId));
                } catch Error(string memory reason) {
                    console.log("\n[ERROR] Message chunk failed:", reason);
                } catch (bytes memory) {
                    console.log("\n[ERROR] Low-level error occurred while sending message chunk");
                }
            } else {
                try sender.transferTokens1(
                    tokenAddress,
                    receiverAddress,
                    sendAmount
                )  {
                    console.log("\n[SUCCESS] Chunk sent!");
                    console.log("Message ID:");
                } catch Error(string memory reason) {
                    console.log("\n[ERROR] Chunk failed:", reason);
                } catch (bytes memory) {
                    console.log("\n[ERROR] Low-level error occurred while sending chunk");
                }
                sender.transferTokens2{value: valueToSend}(
                    tokenAddress,
                    receiverAddress,
                    sendAmount
                );
            }

            if (amount > 0 && remaining >= sendAmount) {
                remaining -= sendAmount;
            }
        }

        vm.stopBroadcast();

        console.log("\n=== Test Complete ===");
    }
}
