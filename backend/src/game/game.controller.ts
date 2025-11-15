import { Controller, Get, Param } from '@nestjs/common';
import { OracleService } from '../oracle/oracle.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ChainType } from '../common/constants/chain-types';

@Controller('api/v1')
export class GameController {
  constructor(
    private oracleService: OracleService,
    private blockchainService: BlockchainService,
  ) {}

  /**
   * 활성 풀 목록 조회
   */
  @Get('pools')
  async getPools() {
    const pools = [];

    for (const chainType of [ChainType.ETH, ChainType.LINK, ChainType.BTC]) {
      const status = await this.oracleService.getPoolStatus(chainType);
      pools.push({
        chainType: ChainType[chainType],
        ...status,
      });
    }

    return { pools };
  }

  /**
   * 특정 풀 상세 조회
   */
  @Get('pools/:chainType')
  async getPool(@Param('chainType') chainTypeStr: string) {
    const chainType = ChainType[chainTypeStr.toUpperCase()];
    if (chainType === undefined) {
      return { error: 'Invalid chain type' };
    }

    const status = await this.oracleService.getPoolStatus(chainType);
    return {
      chainType: chainTypeStr.toUpperCase(),
      ...status,
    };
  }

  /**
   * 헬스 체크
   */
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'OXGame Oracle Backend',
    };
  }
}
