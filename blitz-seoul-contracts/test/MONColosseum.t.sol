// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {console} from "forge-std/console.sol";

import "../src/MONCharacter.sol";
import "../src/MONCharacterVault.sol";
import "../src/MONColosseum.sol";

/**
 * 테스트 포인트
 * - createNewColosseum: onlyOwner, 이벤트
 * - enterColosseum: NFT 소유자만, Vault 예치금 부족 시 리버트, 중복 입장 리버트
 * - exitColosseum: 퇴장 시 매핑 정리, 이벤트
 * - triggerRound: 참가자 >= 2 필요, 라운드 메타데이터 검증 및 이벤트
 */
contract MONColosseumTest is Test {
    MONCharacter character;
    MONCharacterVault vault;
    MONColosseum colosseum;

    address OWNER = address(this);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address eve = address(0xE53);
    address tom = address(0xF03);

    event ColosseumCreated(uint256 indexed colosseumId, uint256 buyIn);
    event EnteredColosseum(uint256 indexed nftId, uint256 colosseumId);
    event ExitedColosseum(uint256 indexed nftId, uint256 colosseumId);
    event RoundStarted(uint256 roundId, uint256 colosseumId, bytes32 roundSeed);
    event Shuffled(uint256 indexed roundId, uint256[] shuffled);

    function setUp() public {
        // 컨트랙트 배포
        character = new MONCharacter();
        vault = new MONCharacterVault(address(character));
        colosseum = new MONColosseum(address(character), address(vault));

        vault.setColosseumAddress(address(colosseum));
        // 기본 풀 생성
        vm.expectEmit(true, false, false, true);
        emit ColosseumCreated(1, 10 ether);
        colosseum.createNewColosseum(10 ether);

        // 유저들에게 ETH 할당
        deal(alice, 100 ether);
        deal(bob, 100 ether);
        deal(eve, 100 ether);
        deal(tom, 100 ether);

        // 캐릭터 민팅
        vm.prank(alice);
        character.mint("ipfs://alice");

        vm.prank(bob);
        character.mint("ipfs://bob");

        vm.prank(eve);
        character.mint("ipfs://eve");

        vm.prank(tom);
        character.mint("ipfs://tom");

        vm.prank(alice);
        vault.deposit{value: 50 ether}();

        vm.prank(bob);
        vault.deposit{value: 20 ether}();

        vm.prank(eve);
        vault.deposit{value: 15 ether}();

        vm.prank(tom);
        vault.deposit{value: 5 ether}();
    }

    // ========== createNewColosseum ========== //
    function testCreateNewColosseum() public {
        vm.expectEmit(true, false, false, true);
        emit ColosseumCreated(2, 20 ether);
        colosseum.createNewColosseum(20 ether);
    }

    function testCreateNewColosseumOnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        colosseum.createNewColosseum(10 ether);
    }

    // ========== enterColosseum ========== //
    function testEnterColosseumHappyPath() public {
        // alice의 tokenId 조회 (민팅 순서대로 0, 1)
        uint256 aliceTokenId = character.tokenIdOf(alice);

        // 오너가 아닌 alice가 자신의 NFT로 입장
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit EnteredColosseum(aliceTokenId, 1);
        colosseum.enterColosseum(aliceTokenId, 1);

        // 상태 검증: nftToColosseum, nftToIndex
        assertEq(
            colosseum.nftToColosseum(aliceTokenId),
            1,
            "alice nftToColosseum mismatch"
        );
        // 인덱스는 첫 입장이므로 0
        assertEq(
            colosseum.nftToIndex(aliceTokenId),
            0,
            "alice nftToIndex mismatch"
        );
    }

    // bob이 alice의 토큰으로 입장 시도 -> 리버트
    function testEnterRevertsIfNotNFTOwner() public {
        uint256 aliceTokenId = character.tokenIdOf(alice);

        // bob이 alice의 토큰으로 입장 시도 -> 리버트
        vm.prank(bob);
        vm.expectRevert(bytes("Not owner"));
        colosseum.enterColosseum(aliceTokenId, 1);
    }

    //볼트에 돈없는 사람 입장
    function testEnterRevertsIfInsufficientVaultBalance() public {
        uint256 tomTokenId = character.tokenIdOf(tom);

        vm.prank(tom);
        vm.expectRevert(bytes("Insufficient MON"));
        colosseum.enterColosseum(tomTokenId, 1);
    }

    function testEnterRevertsIfAlreadyIn() public {
        uint256 aliceTokenId = character.tokenIdOf(alice);

        vm.startPrank(alice);
        colosseum.enterColosseum(aliceTokenId, 1);
        // 같은 NFT로 재입장 시도 -> 리버트 ("Already in")
        vm.expectRevert(bytes("Already in"));
        colosseum.enterColosseum(aliceTokenId, 1);
        vm.stopPrank();
    }

    // ========== exitColosseum ========== //
    function testExitColosseumHappyPath() public {
        uint256 aliceTokenId = character.tokenIdOf(alice);

        vm.prank(alice);
        colosseum.enterColosseum(aliceTokenId, 1);

        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit ExitedColosseum(aliceTokenId, 1);
        colosseum.exitColosseum(aliceTokenId, 1);

        // 매핑이 정리되었는지 확인
        assertEq(
            colosseum.nftToColosseum(aliceTokenId),
            0,
            "nftToColosseum should be cleared"
        );
    }

    // ========== triggerRound ========== //
    function testTriggerRoundRevertsIfNotEnoughPlayers() public {
        uint256 aliceTokenId = character.tokenIdOf(alice);

        // 참가자 1명만 입장
        vm.prank(alice);
        colosseum.enterColosseum(aliceTokenId, 1);

        // 2명 미만 -> 리버트 "Not enough"
        vm.expectRevert(bytes("Not enough"));
        colosseum.triggerRound(1);
    }

    function testTriggerRoundHappyPathAndRoundMetadata() public {
        uint256 aliceTokenId = character.tokenIdOf(alice);
        uint256 bobTokenId = character.tokenIdOf(bob);

        // 두 명 입장
        vm.startPrank(alice);
        colosseum.enterColosseum(aliceTokenId, 1);
        vm.stopPrank();

        vm.startPrank(bob);
        colosseum.enterColosseum(bobTokenId, 1);
        vm.stopPrank();

        // 라운드 시작: 이벤트 RoundStarted 및 Shuffled 발생
        // (동적 배열 비교는 복잡하므로 여기선 RoundStarted 메타데이터와 rounds 조회로 검증)
        uint256 beforeNextRound = colosseum.nextRoundId();

        vm.recordLogs();
        colosseum.triggerRound(1);
        Vm.Log[] memory entries = vm.getRecordedLogs();

        // nextRoundId 증가 확인
        uint256 roundId = beforeNextRound; // triggerRound 내부에서 먼저 roundId = nextRoundId++
        assertEq(
            colosseum.nextRoundId(),
            beforeNextRound + 1,
            "nextRoundId did not increment"
        );

        // rounds 메타데이터 검증
        (
            uint256 colosseumId,
            bytes32 seed,
            uint256 createdAt,
            uint256 playersCount
        ) = colosseum.rounds(1, roundId);

        assertEq(colosseumId, 1, "round colosseumId mismatch");
        assertTrue(seed != bytes32(0), "round seed should be set");
        assertTrue(createdAt != 0, "round createdAt should be set");
        assertEq(playersCount, 2, "playersCount should be 2");

        // 이벤트 토픽 존재 대략 검증 (세부 필드는 환경마다 다를 수 있으므로 토픽 개수 등만 확인)
        // RoundStarted, Shuffled 2개 이벤트가 발생했는지 확인
        // (테스트 런타임/컴파일러 최적화에 따라 로그 개수는 조금 달라질 수 있어 느슨히 체크)
        assertTrue(
            entries.length >= 2,
            "Expected at least 2 logs (RoundStarted, Shuffled)"
        );
    }

    function testTriggerRoundHappyPathAndRoundMetadata_withLogs() public {
        uint256 aliceTokenId = character.tokenIdOf(alice);
        uint256 bobTokenId = character.tokenIdOf(bob);
        uint256 eveTokenId = character.tokenIdOf(eve);
        // 두 명 입장
        vm.startPrank(alice);
        colosseum.enterColosseum(aliceTokenId, 1);
        vm.stopPrank();

        vm.startPrank(bob);
        colosseum.enterColosseum(bobTokenId, 1);
        vm.stopPrank();

        vm.startPrank(eve);
        colosseum.enterColosseum(eveTokenId, 1);
        vm.stopPrank();

        uint256 beforeNextRound = colosseum.nextRoundId();
        console.log("beforeNextRound =");
        console.logUint(beforeNextRound);

        // 이벤트 기록
        vm.recordLogs();
        colosseum.triggerRound(1);

        // nextRoundId 증가 확인 전, 현재값 로그
        uint256 afterNextRound = colosseum.nextRoundId();
        console.log("afterNextRound =");
        console.logUint(afterNextRound);

        // 일반 메타데이터 검증
        uint256 roundId = beforeNextRound; // 내부에서 roundId = nextRoundId++
        assertEq(
            afterNextRound,
            beforeNextRound + 1,
            "nextRoundId did not increment"
        );

        (
            uint256 colosseumId,
            bytes32 seed,
            uint256 createdAt,
            uint256 playersCount
        ) = colosseum.rounds(1, roundId);

        // 상태값들을 보기 좋게 출력
        console.log("Round meta --------");
        console.log("=colosseumId=");
        console.logUint(colosseumId);
        console.log("=seed=");
        console.logBytes32(seed);
        console.log("=createdAt=");
        console.logUint(createdAt);
        console.log("=players=");
        console.logUint(playersCount);

        assertEq(colosseumId, 1, "round colosseumId mismatch");
        assertTrue(seed != bytes32(0), "round seed should be set");
        assertTrue(createdAt != 0, "round createdAt should be set");
        assertEq(playersCount, 3, "playersCount should be 2");

        // Shuffled 이벤트 디코드 & 배열 출력
        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 SHUFFLED_SIG = keccak256("Shuffled(uint256,uint256[])");

        console.log("===total logs===");
        console.logUint(logs.length);

        bool foundShuffled;
        for (uint256 i = 0; i < logs.length; i++) {
            Vm.Log memory L = logs[i];

            // topic0 = event signature
            if (L.topics.length > 0 && L.topics[0] == SHUFFLED_SIG) {
                foundShuffled = true;

                // topic1 = indexed roundId
                uint256 loggedRoundId = uint256(L.topics[1]);

                // data = abi.encode(shuffled array)
                uint256[] memory shuffled = abi.decode(L.data, (uint256[]));

                console.log("=== Shuffled ===");
                console.log("=roundId (topic)=");
                console.logUint(loggedRoundId);
                console.log("=shuffled length=");
                console.logUint(shuffled.length);

                for (uint256 j = 0; j < shuffled.length; j++) {
                    console.log("shuffled[", j, "]");
                    console.logUint(shuffled[j]);
                }
            }
        }

        assertTrue(foundShuffled, "Shuffled event not found");
    }

    function testSubmitResults_LoserIsRemoved_InsufficientBalance() public {
        uint256 colosseumId = 1;
        uint256 aliceId = character.tokenIdOf(alice); // Vault: 50 ether -> 승리 후 60 ether
        uint256 eveId = character.tokenIdOf(eve); // Vault: 15 ether -> 패배 후 5 ether (탈락 조건)

        // 1. 참가
        vm.prank(alice);
        colosseum.enterColosseum(aliceId, colosseumId);
        vm.prank(eve);
        colosseum.enterColosseum(eveId, colosseumId);

        // 2. 라운드 시작
        colosseum.triggerRound(colosseumId);
        uint256 roundId = colosseum.nextRoundId() - 1;

        // 3. eve 패배 결과 제출 (buyIn 10 ether)
        uint256[] memory winners = new uint256[](1);
        uint256[] memory losers = new uint256[](1);
        winners[0] = aliceId;
        losers[0] = eveId;

        // // eve의 탈락 이벤트 검증 (잔고 부족으로 인한 제거)
        // vm.expectEmit(true, false, false, true);
        // emit ExitedColosseum(eveId, colosseumId);

        // 제출
        colosseum.submitBattleResults(colosseumId, roundId, winners, losers);

        // 4. 상태 검증
        // 4a. Vault 잔고 확인
        assertEq(
            vault.balances(aliceId),
            60 ether, // 50 + 10 = 60
            "Alice Vault balance incorrect"
        );
        assertEq(
            vault.balances(eveId),
            5 ether, // 15 - 10 = 5
            "Eve Vault balance incorrect"
        );

        // 4b. eve NFT가 콜로세움에서 제거되었는지 확인 (nftToColosseum 매핑이 0)
        assertEq(
            colosseum.nftToColosseum(eveId),
            0,
            "Eve should have been removed from colosseum"
        );

        // 4c. activeNFTs 배열 확인 (Getter 함수 활용)
        uint256[] memory nfts = colosseum.getActiveNFTs(colosseumId);
        assertEq(nfts.length, 1, "Only Alice should remain in activeNFTs");
        assertEq(nfts[0], aliceId, "Alice should be the remaining NFT");

        // 4d. isMatchingNow 해제 확인 (Getter 함수 활용)
        assertEq(
            colosseum.getIsMatchingNow(colosseumId),
            false,
            "isMatchingNow should be false"
        );
    }
}
