import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigService } from './common/config/config.service';
import { ChainlinkService } from './chainlink/chainlink.service';
import { BlockchainService } from './blockchain/blockchain.service';
import { OracleService } from './oracle/oracle.service';
import { GameGateway } from './game/game.gateway';
import { GameController } from './game/game.controller';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [GameController],
  providers: [
    ConfigService,
    ChainlinkService,
    BlockchainService,
    OracleService,
    GameGateway,
  ],
})
export class AppModule {}
