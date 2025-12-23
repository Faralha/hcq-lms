import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RaporController } from './rapor.controller';
import { RaporService } from './rapor.service';
import { RaporQueueService } from './rapor-queue.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'rapor-pdf',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),
  ],
  controllers: [RaporController],
  providers: [RaporService, RaporQueueService],
  exports: [RaporService],
})
export class RaporModule {}
