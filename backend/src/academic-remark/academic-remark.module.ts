import { Module } from '@nestjs/common';
import { AcademicRemarkService } from './academic-remark.service';
import { AcademicRemarkController } from './academic-remark.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AcademicRemarkController],
  providers: [AcademicRemarkService, PrismaService],
  exports: [AcademicRemarkService],
})
export class AcademicRemarkModule {}
