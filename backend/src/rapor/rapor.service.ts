import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RaporQueueService } from './rapor-queue.service';
import { RaporStatus } from '@prisma/client';

@Injectable()
export class RaporService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: RaporQueueService,
  ) {}

  /**
   * Request PDF generation for a student
   */
  async requestPdfGeneration(studentId: string, semesterId: string) {
    // Verify student exists
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Verify semester exists
    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
    });

    if (!semester) {
      throw new NotFoundException('Semester not found');
    }

    // Check if rapor already exists for this student and semester
    const existingRapor = await this.prisma.raporFile.findFirst({
      where: {
        AND: [{ studentId }, { semesterId }],
      },
    });

    if (existingRapor) {
      // If already completed, return existing
      if (existingRapor.status === RaporStatus.COMPLETED) {
        return {
          raporFileId: existingRapor.id,
          status: existingRapor.status,
          fileUrl: existingRapor.fileUrl,
          message: 'Rapor already exists',
        };
      }
      // If pending or processing, return status
      if (
        existingRapor.status === RaporStatus.PENDING ||
        existingRapor.status === RaporStatus.PROCESSING
      ) {
        return {
          raporFileId: existingRapor.id,
          status: existingRapor.status,
          message: 'Rapor generation in progress',
        };
      }

      // If failed, recreate
      await this.prisma.raporFile.delete({ where: { id: existingRapor.id } });
    }

    // Create rapor file record
    const raporFile = await this.prisma.raporFile.create({
      data: {
        studentId,
        semesterId,
        status: RaporStatus.PENDING,
      },
    });

    // Queue the PDF generation job
    const jobId = await this.queueService.queuePdfGeneration(
      raporFile.id,
      studentId,
      semesterId,
    );

    return {
      raporFileId: raporFile.id,
      jobId,
      status: raporFile.status,
      message: 'PDF generation queued successfully',
    };
  }

  /**
   * Get rapor file status
   */
  async getRaporFileStatus(raporFileId: string) {
    const raporFile = await this.prisma.raporFile.findUnique({
      where: { id: raporFileId },
    });

    if (!raporFile) {
      throw new NotFoundException('Rapor file not found');
    }

    return raporFile;
  }

  /**
   * Get all rapor files for a student
   */
  async getStudentRaporFiles(studentId: string) {
    return await this.prisma.raporFile.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all rapor files (admin only)
   */
  async getAllRaporFiles() {
    return await this.prisma.raporFile.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
