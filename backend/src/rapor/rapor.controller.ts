import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
  Query,
  Res,
  NotFoundException,
  ForbiddenException,
  StreamableFile,
  Logger,
} from '@nestjs/common';
import { RaporService } from './rapor.service';
import { S3Service } from '../s3/s3.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import type { Response } from 'express';

@Controller('rapor')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RaporController {
  private readonly logger = new Logger(RaporController.name);

  constructor(
    private readonly raporService: RaporService,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Request PDF generation for a student (Admin only)
   * POST /rapor/generate/:studentId?semesterId=xxx
   */
  @Post('generate/:studentId')
  @Roles('ADMIN')
  async generatePdf(
    @Param('studentId') studentId: string,
    @Query('semesterId') semesterId: string,
  ) {
    if (!semesterId) {
      throw new NotFoundException('Semester ID is required');
    }
    return await this.raporService.requestPdfGeneration(studentId, semesterId);
  }

  /**
   * Get rapor file status
   * GET /rapor/status/:raporFileId
   */
  @Get('status/:raporFileId')
  async getStatus(@Param('raporFileId') raporFileId: string) {
    return await this.raporService.getRaporFileStatus(raporFileId);
  }

  /**
   * Download rapor PDF file
   * GET /rapor/download/:raporFileId
   * Students can only download their own rapor, Admin can download any
   */
  @Get('download/:raporFileId')
  async downloadPdf(
    @Param('raporFileId') raporFileId: string,
    @Request() req: { user: { userId: string; role: string } },
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // Get rapor file info
    const raporFile = await this.raporService.getRaporFileStatus(raporFileId);

    this.logger.log(
      `Download attempt - User ID: ${req.user.userId}, Role: ${req.user.role}, Rapor Student ID: ${raporFile.studentId}`,
    );

    // Check authorization: student can only download their own rapor
    if (
      req.user.role === 'PELAJAR' &&
      raporFile.studentId !== req.user.userId
    ) {
      this.logger.warn(
        `Forbidden: User ${req.user.userId} tried to download rapor for student ${raporFile.studentId}`,
      );
      throw new ForbiddenException(
        'You can only download your own rapor files',
      );
    }

    // Check if file exists and is completed
    if (raporFile.status !== 'COMPLETED' || !raporFile.fileUrl) {
      throw new NotFoundException('Rapor file not ready or does not exist');
    }

    // Check if file exists in S3
    const fileExists = await this.s3Service.fileExistsInBucket(
      raporFile.fileUrl,
      'rapor',
    );
    if (!fileExists) {
      throw new NotFoundException('Rapor file not found in S3');
    }

    // Get file stats from S3
    const fileStats = await this.s3Service.getFileStatFromBucket(
      raporFile.fileUrl,
      'rapor',
    );

    // Get file stream from S3
    const fileStream = await this.s3Service.getFileFromBucket(
      raporFile.fileUrl,
      'rapor',
    );

    // Set response headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="rapor_${raporFile.id}.pdf"`,
      'Content-Length': fileStats.size,
    });

    // Return StreamableFile
    return new StreamableFile(fileStream);
  }

  /**
   * Get all rapor files for current user (if student)
   * GET /rapor/my-files
   */
  @Get('my-files')
  async getMyFiles(@Request() req: { user: { userId: string } }) {
    const userId = req.user.userId;
    return await this.raporService.getStudentRaporFiles(userId);
  }

  /**
   * Get rapor files for a specific student
   * GET /rapor/student/:studentId
   */
  @Get('student/:studentId')
  async getStudentFiles(@Param('studentId') studentId: string) {
    return await this.raporService.getStudentRaporFiles(studentId);
  }

  /**
   * Get all rapor files (admin only)
   * GET /rapor/all
   */
  @Get('all')
  @Roles('ADMIN')
  async getAllFiles() {
    return await this.raporService.getAllRaporFiles();
  }

  /**
   * Delete rapor file (admin only)
   * DELETE /rapor/:raporFileId
   */
  @Delete(':raporFileId')
  @Roles('ADMIN')
  async deleteRapor(@Param('raporFileId') raporFileId: string) {
    return await this.raporService.deleteRaporFile(raporFileId);
  }

  /**
   * Retry/Regenerate rapor (admin only)
   * POST /rapor/retry/:raporFileId
   */
  @Post('retry/:raporFileId')
  @Roles('ADMIN')
  async retryRapor(@Param('raporFileId') raporFileId: string) {
    return await this.raporService.retryRaporGeneration(raporFileId);
  }
}
