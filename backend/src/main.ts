import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './common/config/config.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  // CORS 설정 (POC용)
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.port;

  await app.listen(port);

  logger.log('');
  logger.log('='.repeat(60));
  logger.log('🎮 OXGame Oracle Backend Started');
  logger.log('='.repeat(60));
  logger.log(`🚀 Server running on: http://localhost:${port}`);
  logger.log(`📡 WebSocket running on: ws://localhost:${port}`);
  logger.log(`📊 API: http://localhost:${port}/api/v1/health`);
  logger.log(`⏰ Oracle Scheduler: Every 5 seconds`);
  logger.log('='.repeat(60));
  logger.log('');
}

bootstrap();
