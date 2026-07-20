import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SemesterModule } from './semester/semester.module';
import { MataPelajaranModule } from './mata-pelajaran/mata-pelajaran.module';
import { KelasModule } from './kelas/kelas.module';
import { PresensiModule } from './presensi/presensi.module';
import { NilaiModule } from './nilai/nilai.module';
import { AnnouncementModule } from './announcement/announcement.module';
import { SppModule } from './spp/spp.module';
import { GajiModule } from './gaji/gaji.module';
import { MateriModule } from './materi/materi.module';
import { RaporModule } from './rapor/rapor.module';
import { S3Module } from './s3/s3.module';
import { AcademicRemarkModule } from './academic-remark/academic-remark.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    SemesterModule,
    MataPelajaranModule,
    KelasModule,
    PresensiModule,
    NilaiModule,
    AnnouncementModule,
    SppModule,
    GajiModule,
    MateriModule,
    RaporModule,
    S3Module,
    AcademicRemarkModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
