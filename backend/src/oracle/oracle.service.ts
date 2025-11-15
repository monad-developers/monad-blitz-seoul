import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ChainlinkService } from '../chainlink/chainlink.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { GameGateway } from '../game/game.gateway';
import { ChainType, ChainTypeNames } from '../common/constants/chain-types';

interface PriceRecord {
  price: number;
  timestamp: number;
}

@Injectable()
export class OracleService {
  private readonly logger = new Logger(OracleService.name);

  // 이전 라운드 가격 저장 (5초 전 가격)
  private lastPrices: Map<ChainType, PriceRecord> = new Map();

  // 라운드 카운터
  private roundCounters: Map<ChainType, number> = new Map([
    [ChainType.ETH, 0],
    // [ChainType.LINK, 0],
    // [ChainType.BTC, 0],
  ]);

  constructor(
    private chainlinkService: ChainlinkService,
    private blockchainService: BlockchainService,
    private gameGateway: GameGateway,
  ) {
    this.logger.log('🤖 Oracle Service initialized');
  }

  /**
   * 5초마다 실행되는 메인 스케줄러
   */
  @Cron('*/5 * * * * *')
  async executeRounds() {
    this.logger.log('⏰ Executing 5-second round cycle...');

    // ETH만 처리
    const chainTypes = [ChainType.ETH];

    for (const chainType of chainTypes) {
      try {
        await this.processRound(chainType);
      } catch (error) {
        this.logger.error(
          `Failed to process round for ${ChainType[chainType]}:`,
          error.message,
        );
      }
    }
  }

  /**
   * 단일 체인의 라운드 처리
   */
  private async processRound(chainType: ChainType) {
    const chainName = ChainTypeNames[chainType];

    // 1. 현재 가격 조회
    const currentPriceData = await this.chainlinkService.getLatestPrice(
      chainType,
    );
    const currentPrice = currentPriceData.price;

    this.logger.log(
      `📊 ${chainName} Current Price: $${currentPrice.toFixed(2)}`,
    );

    // 2. 이전 가격과 비교하여 정답 계산
    const lastPriceRecord = this.lastPrices.get(chainType);
    let answer: boolean | null = null;

    if (lastPriceRecord) {
      const previousPrice = lastPriceRecord.price;
      answer = currentPrice > previousPrice;

      const change = currentPrice - previousPrice;
      const changePercent = (change / previousPrice) * 100;

      this.logger.log(
        `💹 ${chainName} Price Change: ${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${changePercent.toFixed(2)}%)`,
      );
      this.logger.log(
        `✅ ${chainName} Correct Answer: ${answer ? 'O (UP)' : 'X (DOWN)'}`,
      );

      // 3. 스마트 컨트랙트에 processRound 호출
      try {
        await this.blockchainService.processRound(chainType, answer);
      } catch (error) {
        this.logger.error(
          `❌ Failed to call processRound for ${chainName}:`,
          error.message,
        );
      }

      // 4. 컨트랙트에서 실제 라운드 번호 조회 (processRound 성공/실패 무관)
      const poolInfo = await this.blockchainService.getPoolInfo(chainType);
      const currentRound = poolInfo?.currentRound || 0;

      // 로컬 카운터 업데이트 (동기화)
      this.roundCounters.set(chainType, currentRound);

      // 5. WebSocket으로 결과 브로드캐스트 (완료된 라운드 번호)
      this.gameGateway.broadcastRoundEnd({
        chainType: chainName,
        roundNumber: currentRound,
        previousPrice,
        currentPrice,
        correctAnswer: answer,
        change,
        changePercent,
      });
    } else {
      this.logger.log(`ℹ️  ${chainName} First round - no previous price`);
    }

    // 6. 다음 라운드를 위해 현재 가격 저장
    this.lastPrices.set(chainType, {
      price: currentPrice,
      timestamp: Date.now(),
    });

    // 7. 새 라운드 시작 알림 (컨트랙트에서 실제 라운드 번호 조회)
    const poolInfo = await this.blockchainService.getPoolInfo(chainType);
    const nextRoundNumber = poolInfo?.currentRound || 1;

    this.gameGateway.broadcastRoundStart({
      chainType: chainName,
      roundNumber: nextRoundNumber,
      basePrice: currentPrice,
      question: `5초 후 ${chainName} 가격이 올라갈까요?`,
      startTime: Date.now(),
      deadline: Date.now() + 5000,
    });

    // 8. 실시간 가격 브로드캐스트
    this.gameGateway.broadcastPriceUpdate({
      chainType: chainName,
      price: currentPrice,
      timestamp: Date.now(),
    });
  }

  /**
   * 풀 상태 조회 (수동 트리거용)
   */
  async getPoolStatus(chainType: ChainType) {
    const poolInfo = await this.blockchainService.getPoolInfo(chainType);
    const lastPrice = this.lastPrices.get(chainType);

    return {
      ...poolInfo,
      lastPrice: lastPrice?.price || 0,
      roundNumber: this.roundCounters.get(chainType) || 0,
    };
  }
}
