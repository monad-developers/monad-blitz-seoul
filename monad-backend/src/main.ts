import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  // ⚠️ CORS 설정은 listen()보다 반드시 먼저 호출되어야 함
  app.enableCors({
    origin: ['http://localhost:3000'], // 개발 환경에서만 허용
    credentials: true, // 필요 시 (쿠키 인증 등을 사용하는 경우)
  });

  await app.listen(3005);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
