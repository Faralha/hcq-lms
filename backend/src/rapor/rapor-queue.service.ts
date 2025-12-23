import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { RaporStatus } from '@prisma/client';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

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

      // Generate PDF
      const fileUrl = await this.generateRaporPdf(studentId, semesterId);

      // Validate file actually exists before marking as COMPLETED
      const absoluteFilePath = path.join(process.cwd(), fileUrl);
      if (!fs.existsSync(absoluteFilePath)) {
        throw new Error(
          `PDF file was not created successfully at path: ${absoluteFilePath}`,
        );
      }

      const fileStats = fs.statSync(absoluteFilePath);
      if (fileStats.size === 0) {
        throw new Error(`Generated PDF file is empty (0 bytes)`);
      }

      this.logger.log(
        `PDF file verified: ${absoluteFilePath} (${fileStats.size} bytes)`,
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

    // Create directory structure: rapor/{semester_name}/ (inside backend project)
    // Sanitize semester name: remove/replace invalid characters for filenames
    const sanitizedSemesterName = semester.nama.replace(/[^a-zA-Z0-9-_]/g, '_');
    const raporBaseDir = path.join(process.cwd(), 'rapor');
    const semesterDir = path.join(raporBaseDir, sanitizedSemesterName);

    if (!fs.existsSync(semesterDir)) {
      fs.mkdirSync(semesterDir, { recursive: true });
    }

    // Generate filename
    const filename = `rapor_${studentId}_${Date.now()}.pdf`;
    const filePath = path.join(semesterDir, filename);

    this.logger.log(`Launching Puppeteer to generate PDF`);
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      this.logger.log(`PDF generated successfully: ${filename}`);

      // Return URL with sanitized semester name (consistent with directory creation)
      const sanitizedSemesterName = semester.nama.replace(
        /[^a-zA-Z0-9-_]/g,
        '_',
      );
      return `/rapor/${sanitizedSemesterName}/${filename}`;
    } finally {
      await browser.close();
    }
  }
}
