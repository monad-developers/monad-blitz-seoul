import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MonadController } from '../interface/controller/monad.controller';
import { MonadService } from '../application/service/monad.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [MonadController],
  providers: [MonadService],
})
export class MonadModule {}
