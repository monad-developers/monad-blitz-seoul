import { Module } from '@nestjs/common';
import { MonadModule } from './monad/module/monad.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MonadModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
