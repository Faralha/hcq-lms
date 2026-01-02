import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { RaporStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { HtmlConverter } from 'chromiumly';

interface RaporJobData {
  raporFileId: string;
  studentId: string;
  semesterId: string;
}

interface GradeData {
  komponen: string;
  nilai: number;
  bobot: number;
}

interface AttendanceData {
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  total: number;
}

interface KelasGradeData {
  kelasId: string;
  kelasName: string;
  mataPelajaran: string;
  grades: GradeData[];
  totalScore: number;
  attendance: AttendanceData;
  academicRemark?: string | null;
}

interface StudentRaporData {
  student: {
    id: string;
    email: string;
    nama: string;
    [key: string]: any;
  };
  gradesPerClass: KelasGradeData[];
}

@Injectable()
@Processor('rapor-pdf')
export class RaporQueueService implements OnModuleInit {
  private readonly logger = new Logger(RaporQueueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    @InjectQueue('rapor-pdf') private readonly raporQueue: Queue<RaporJobData>,
  ) {}

  onModuleInit() {
    this.logger.log('Rapor Queue Service initialized');
  }

  /**
   * Queue a PDF generation job
   */
  async queuePdfGeneration(
    raporFileId: string,
    studentId: string,
    semesterId: string,
  ): Promise<void> {
    this.logger.log(`Queueing PDF generation for rapor file: ${raporFileId}`);

    await this.raporQueue.add(
      {
        raporFileId,
        studentId,
        semesterId,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // 60 seconds
        },
        timeout: 3600000, // 1 hour
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    this.logger.log(`Job queued successfully for rapor file: ${raporFileId}`);
  }

  /**
   * Process PDF generation jobs
   */
  @Process()
  async processPdfGeneration(job: Job<RaporJobData>) {
    const { raporFileId, studentId, semesterId } = job.data;

    this.logger.log(`Processing job ${job.id} for rapor file: ${raporFileId}`);

    try {
      // Update status to PROCESSING
      await this.prisma.raporFile.update({
        where: { id: raporFileId },
        data: { status: RaporStatus.PROCESSING },
      });

      // Generate PDF and upload to S3
      const fileUrl = await this.generateRaporPdf(studentId, semesterId);

      // Validate file actually exists in S3 before marking as COMPLETED
      const fileExists = await this.s3Service.fileExistsInBucket(
        fileUrl,
        'rapor',
      );
      if (!fileExists) {
        throw new Error(
          `PDF file was not uploaded successfully to S3: ${fileUrl}`,
        );
      }

      const fileStats = await this.s3Service.getFileStatFromBucket(
        fileUrl,
        'rapor',
      );
      if (fileStats.size === 0) {
        throw new Error(`Generated PDF file is empty (0 bytes)`);
      }

      this.logger.log(
        `PDF file verified in S3: ${fileUrl} (${fileStats.size} bytes)`,
      );

      // Update status to COMPLETED with file URL (only after validation)
      await this.prisma.raporFile.update({
        where: { id: raporFileId },
        data: {
          status: RaporStatus.COMPLETED,
          fileUrl,
        },
      });

      this.logger.log(`Successfully generated PDF for student ${studentId}`);

      return { success: true, fileUrl };
    } catch (error) {
      this.logger.error(
        `Failed to generate PDF for rapor file ${raporFileId}:`,
        error,
      );

      // Update status to FAILED
      await this.prisma.raporFile.update({
        where: { id: raporFileId },
        data: { status: RaporStatus.FAILED },
      });

      throw error;
    }
  }

  /**
   * Fetch student data for rapor
   */
  private async fetchStudentData(studentId: string): Promise<StudentRaporData> {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          include: {
            kelas: {
              include: {
                mataPelajaran: true,
                semester: true,
              },
            },
          },
        },
        nilai: {
          include: {
            komponen: {
              include: {
                kelas: {
                  include: {
                    mataPelajaran: true,
                  },
                },
              },
            },
          },
        },
        presensiRecords: {
          include: {
            presensiSession: {
              include: {
                kelas: {
                  include: {
                    mataPelajaran: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    // Calculate grades per class
    const gradesPerClass = new Map<
      string,
      {
        kelasName: string;
        mataPelajaran: string;
        grades: { komponen: string; nilai: number; bobot: number }[];
        totalScore: number;
      }
    >();

    for (const nilai of student.nilai) {
      const kelasId = nilai.komponen.kelas.id;
      if (!gradesPerClass.has(kelasId)) {
        gradesPerClass.set(kelasId, {
          kelasName: nilai.komponen.kelas.namaKelas,
          mataPelajaran: nilai.komponen.kelas.mataPelajaran.nama,
          grades: [],
          totalScore: 0,
        });
      }
      const kelasData = gradesPerClass.get(kelasId)!;
      kelasData.grades.push({
        komponen: nilai.komponen.nama,
        nilai: nilai.nilai,
        bobot: nilai.komponen.bobot || 0,
      });
    }

    // Calculate total scores (weighted average)
    for (const [, kelasData] of gradesPerClass) {
      const totalBobot = kelasData.grades.reduce((sum, g) => sum + g.bobot, 0);
      if (totalBobot > 0) {
        kelasData.totalScore =
          kelasData.grades.reduce((sum, g) => sum + g.nilai * g.bobot, 0) /
          totalBobot;
      } else {
        kelasData.totalScore =
          kelasData.grades.reduce((sum, g) => sum + g.nilai, 0) /
          kelasData.grades.length;
      }
    }

    // Calculate attendance per class
    const attendancePerClass = new Map<string, AttendanceData>();

    for (const record of student.presensiRecords) {
      const kelasId = record.presensiSession.kelasId;
      if (!attendancePerClass.has(kelasId)) {
        attendancePerClass.set(kelasId, {
          hadir: 0,
          izin: 0,
          sakit: 0,
          alpha: 0,
          total: 0,
        });
      }
      const attendance = attendancePerClass.get(kelasId)!;
      attendance.total++;
      switch (record.status) {
        case 'HADIR':
          attendance.hadir++;
          break;
        case 'IZIN':
          attendance.izin++;
          break;
        case 'SAKIT':
          attendance.sakit++;
          break;
        case 'ALFA':
          attendance.alpha++;
          break;
      }
    }

    // Fetch academic remarks for this student
    const academicRemarks = await this.prisma.academicRemark.findMany({
      where: { userId: studentId },
    });

    // Map academic remarks by kelasId for easy lookup
    const remarksByKelasId = academicRemarks.reduce(
      (acc, remark) => {
        acc[remark.kelasId] = remark.catatan;
        return acc;
      },
      {} as Record<string, string>,
    );

    return {
      student,
      gradesPerClass: Array.from(gradesPerClass.entries()).map(
        ([kelasId, data]) => ({
          kelasId,
          ...data,
          attendance: attendancePerClass.get(kelasId) || {
            hadir: 0,
            izin: 0,
            sakit: 0,
            alpha: 0,
            total: 0,
          },
          academicRemark: remarksByKelasId[kelasId] || null,
        }),
      ),
    };
  }

  /**
   * Prepare data for Handlebars template
   */
  private prepareTemplateData(data: StudentRaporData) {
    const { student, gradesPerClass } = data;
    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Process grades with calculated fields
    const processedGrades = gradesPerClass.map((kelas) => {
      const score = kelas.totalScore.toFixed(2);
      let grade = 'E';
      let gradeClass = 'grade-low';

      if (kelas.totalScore >= 85) {
        grade = 'A';
        gradeClass = 'grade-good';
      } else if (kelas.totalScore >= 70) {
        grade = 'B';
        gradeClass = 'grade-medium';
      } else if (kelas.totalScore >= 60) {
        grade = 'C';
        gradeClass = 'grade-medium';
      } else if (kelas.totalScore >= 50) {
        grade = 'D';
        gradeClass = 'grade-low';
      }

      return {
        ...kelas,
        score,
        grade,
        gradeClass,
        grades: kelas.grades.map((g) => ({
          ...g,
          bobotPercent: g.bobot.toFixed(0),
          nilaiFormatted: g.nilai.toFixed(2),
        })),
        academicRemark: kelas.academicRemark,
        hasRemark: !!kelas.academicRemark,
      };
    });

    return {
      student,
      today,
      gradesPerClass: processedGrades,
    };
  }

  /**
   * Generate HTML using Handlebars template
   */
  private generateHtmlTemplate(data: StudentRaporData): string {
    // Load template file from source directory (not dist)
    const templatePath = path.join(
      process.cwd(),
      'src',
      'rapor',
      'templates',
      'rapor.hbs',
    );
    const templateSource = fs.readFileSync(templatePath, 'utf-8');

    // Compile template
    const template = Handlebars.compile(templateSource);

    // Prepare data
    const templateData = this.prepareTemplateData(data);

    // Generate HTML
    return template(templateData);
  }

  /**
   * Generate PDF using Puppeteer
   */
  private async generateRaporPdf(
    studentId: string,
    semesterId: string,
  ): Promise<string> {
    this.logger.log(`Fetching student data for ${studentId}`);
    const data = await this.fetchStudentData(studentId);

    // Get semester info for folder name
    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
    });

    if (!semester) {
      throw new Error(`Semester with ID ${semesterId} not found`);
    }

    this.logger.log(`Generating HTML template`);
    const html = this.generateHtmlTemplate(data);

    // Sanitize semester name for S3 folder structure
    const sanitizedSemesterName = semester.nama.replace(/[^a-zA-Z0-9-_]/g, '_');

    // Generate S3 object key (path in bucket)
    const filename = `rapor_${studentId}_${Date.now()}.pdf`;
    const s3ObjectKey = `${sanitizedSemesterName}/${filename}`;

    // Generate PDF using Chromiumly (Gotenberg client)
    this.logger.log(`Generating PDF with Chromiumly`);

    // Create temporary directory for HTML file (Chromiumly requires index.html file)
    const tempDir = path.join(process.cwd(), 'temp', `rapor_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const tempHtmlPath = path.join(tempDir, 'index.html');

    try {
      // Write HTML to temporary file
      fs.writeFileSync(tempHtmlPath, html, 'utf-8');

      // Convert HTML to PDF using Chromiumly
      const htmlConverter = new HtmlConverter();
      const pdfBuffer = await htmlConverter.convert({
        html: tempHtmlPath,
        properties: {
          size: {
            width: 8.27, // A4 width in inches (210mm)
            height: 11.69, // A4 height in inches (297mm)
          },
          margins: {
            top: 0.79, // 20mm in inches
            bottom: 0.79, // 20mm in inches
            left: 0.59, // 15mm in inches
            right: 0.59, // 15mm in inches
          },
          printBackground: true,
          preferCssPageSize: false,
          landscape: false,
          scale: 1.0,
        },
        emulatedMediaType: 'print',
        waitDelay: '2s', // Wait for content to load
        skipNetworkIdleEvent: false,
      });

      // Upload PDF buffer to S3
      await this.s3Service.uploadPdfBuffer(pdfBuffer, s3ObjectKey, 'rapor');

      this.logger.log(`PDF uploaded to S3: ${s3ObjectKey}`);

      // Return S3 object key
      return s3ObjectKey;
    } finally {
      // Clean up temporary files
      try {
        if (fs.existsSync(tempHtmlPath)) {
          fs.unlinkSync(tempHtmlPath);
        }
        if (fs.existsSync(tempDir)) {
          fs.rmdirSync(tempDir);
        }
      } catch (cleanupError) {
        this.logger.warn(`Failed to clean up temporary files: ${cleanupError}`);
      }
    }
  }
}
