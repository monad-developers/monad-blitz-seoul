import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '../common/config/config.service';
import { ChainType } from '../common/constants/chain-types';

// Import ABI
import * as OXGameV2ABI from '../../../contract/artifacts/contracts/OXGameV2.sol/OXGameV2.json';

@Injectable()
export class BlockchainService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private lastPolledBlock: number = 0;
  private pollingInterval: NodeJS.Timeout;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      // Provider 설정
      this.provider = new ethers.JsonRpcProvider(
        this.configService.monadRpcUrl,
      );

      // Oracle Wallet 설정
      const privateKey = this.configService.oraclePrivateKey;
      this.wallet = new ethers.Wallet(privateKey, this.provider);

      // Contract 연결
      const contractAddress = this.configService.oxGameAddress;
      this.contract = new ethers.Contract(
        contractAddress,
        OXGameV2ABI.abi,
        this.wallet,
      );

      this.logger.log(`✅ Blockchain connected`);
      this.logger.log(`📝 Contract: ${contractAddress}`);
      this.logger.log(`🔑 Oracle: ${this.wallet.address}`);

      // Get current block for polling baseline
      this.lastPolledBlock = await this.provider.getBlockNumber();
      this.logger.log(`📊 Starting event polling from block: ${this.lastPolledBlock}`);

      // Event listeners 시작 (polling-based)
      this.startEventListeners();
    } catch (error) {
      this.logger.error('❌ Blockchain connection failed:', error);
    }
  }

  /**
   * processRound 호출 (5초마다)
   */
  async processRound(chainType: ChainType, previousAnswer: boolean) {
    try {
      this.logger.log(
        `📤 Processing round for ${ChainType[chainType]} - Answer: ${previousAnswer ? 'O (UP)' : 'X (DOWN)'}`,
      );

      const tx = await this.contract.processRound(chainType, previousAnswer);
      const receipt = await tx.wait();

      this.logger.log(
        `✅ Round processed - TX: ${receipt.hash.substring(0, 10)}...`,
      );

      return receipt;
    } catch (error) {
      this.logger.error(`❌ processRound failed:`, error.message);
      throw error;
    }
  }

  /**
   * 풀 정보 조회
   */
  async getPoolInfo(chainType: ChainType) {
    try {
      const poolInfo = await this.contract.getPoolInfo(chainType);
      return {
        totalDeposit: ethers.formatEther(poolInfo[0]),
        currentRound: Number(poolInfo[1]),
        lastRoundTime: Number(poolInfo[2]),
        isActive: poolInfo[3],
        activePlayerCount: Number(poolInfo[4]),
        totalPlayerCount: Number(poolInfo[5]),
      };
    } catch (error) {
      this.logger.error(`getPoolInfo failed:`, error.message);
      return null;
    }
  }

  /**
   * Event Listeners - Using Polling instead of filters
   * This is required because Monad testnet doesn't support eth_newFilter
   */
  private startEventListeners() {
    // Poll for events every 3 seconds
    this.pollingInterval = setInterval(async () => {
      try {
        const currentBlock = await this.provider.getBlockNumber();

        if (currentBlock > this.lastPolledBlock) {
          // Query events from last polled block to current
          await this.pollEvents(this.lastPolledBlock + 1, currentBlock);
          this.lastPolledBlock = currentBlock;
        }
      } catch (error) {
        this.logger.error('Event polling error:', error.message);
      }
    }, 3000);

    this.logger.log('👂 Event polling started (every 3 seconds)');
  }

  /**
   * Poll for events using queryFilter
   */
  private async pollEvents(fromBlock: number, toBlock: number) {
    try {
      // PlayerJoined events
      const playerJoinedEvents = await this.contract.queryFilter(
        this.contract.filters.PlayerJoined(),
        fromBlock,
        toBlock,
      );
      for (const event of playerJoinedEvents) {
        const args = event.args;
        this.logger.log(
          `👤 Player joined ${ChainType[Number(args.chainType)]}: ${args.player} (Total: ${args.playerCount})`,
        );
      }

      // RoundStarted events
      const roundStartedEvents = await this.contract.queryFilter(
        this.contract.filters.RoundStarted(),
        fromBlock,
        toBlock,
      );
      for (const event of roundStartedEvents) {
        const args = event.args;
        this.logger.log(
          `🎮 Round started ${ChainType[Number(args.chainType)]} #${args.round}`,
        );
      }

      // RoundEnded events
      const roundEndedEvents = await this.contract.queryFilter(
        this.contract.filters.RoundEnded(),
        fromBlock,
        toBlock,
      );
      for (const event of roundEndedEvents) {
        const args = event.args;
        this.logger.log(
          `🏁 Round ended ${ChainType[Number(args.chainType)]} #${args.round} - Answer: ${args.correctAnswer ? 'O' : 'X'} - Survivors: ${args.survivorCount}`,
        );
      }

      // PlayerEliminated events
      const playerEliminatedEvents = await this.contract.queryFilter(
        this.contract.filters.PlayerEliminated(),
        fromBlock,
        toBlock,
      );
      for (const event of playerEliminatedEvents) {
        const args = event.args;
        this.logger.log(
          `❌ Player eliminated ${ChainType[Number(args.chainType)]}: ${args.player} - Reason: ${args.reason}`,
        );
      }

      // GameEnded events
      const gameEndedEvents = await this.contract.queryFilter(
        this.contract.filters.GameEnded(),
        fromBlock,
        toBlock,
      );
      for (const event of gameEndedEvents) {
        const args = event.args;
        this.logger.log(
          `🎉 Game ended ${ChainType[Number(args.chainType)]} - Winners: ${args.winners.length} - Prize: ${ethers.formatEther(args.prizePerWinner)} MON`,
        );
      }
    } catch (error) {
      this.logger.error('Error querying events:', error.message);
    }
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.logger.log('Event polling stopped');
    }
  }
}
