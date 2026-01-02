import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateAcademicRemarkDto, UpdateAcademicRemarkDto } from './dto';

@Injectable()
export class AcademicRemarkService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAcademicRemarkDto, creatorId: string) {
    // Validate kelas exists
    const kelas = await this.prisma.kelas.findUnique({
      where: { id: dto.kelasId },
      include: {
        enrollments: {
          where: { userId: creatorId },
          include: { user: true },
        },
      },
    });

    if (!kelas) {
      throw new NotFoundException(`Kelas with ID ${dto.kelasId} not found`);
    }

    // Validate creator is PENGAJAR assigned to this kelas
    const enrollment = kelas.enrollments.find(
      (e) => e.userId === creatorId && e.user.role === Role.PENGAJAR,
    );

    if (!enrollment) {
      throw new ForbiddenException(
        'You are not assigned as pengajar for this kelas',
      );
    }

    // Validate semester exists
    const semester = await this.prisma.semester.findUnique({
      where: { id: dto.semesterId },
    });

    if (!semester) {
      throw new NotFoundException(
        `Semester with ID ${dto.semesterId} not found`,
      );
    }

    // Validate user (pelajar) exists and is enrolled in kelas
    const pelajar = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!pelajar) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    const pelajarEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_kelasId: {
          userId: dto.userId,
          kelasId: dto.kelasId,
        },
      },
    });

    if (!pelajarEnrollment) {
      throw new ForbiddenException('User is not enrolled in this kelas');
    }

    // Check if remark already exists (upsert behavior)
    const existing = await this.prisma.academicRemark.findUnique({
      where: {
        userId_kelasId_semesterId: {
          userId: dto.userId,
          kelasId: dto.kelasId,
          semesterId: dto.semesterId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Academic remark already exists for this user/kelas/semester. Use PATCH to update.',
      );
    }

    return this.prisma.academicRemark.create({
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
          },
        },
        kelas: {
          select: {
            id: true,
            namaKelas: true,
          },
        },
        semester: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    });
  }

  async findByKelas(kelasId: string, userId: string) {
    // Validate kelas exists
    const kelas = await this.prisma.kelas.findUnique({
      where: { id: kelasId },
      include: {
        enrollments: {
          where: { userId },
        },
      },
    });

    if (!kelas) {
      throw new NotFoundException(`Kelas with ID ${kelasId} not found`);
    }

    // Validate user is enrolled in kelas
    if (kelas.enrollments.length === 0) {
      throw new ForbiddenException('You are not enrolled in this kelas');
    }

    return this.prisma.academicRemark.findMany({
      where: { kelasId },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
          },
        },
        semester: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyRemarks(userId: string) {
    return this.prisma.academicRemark.findMany({
      where: { userId },
      include: {
        kelas: {
          select: {
            id: true,
            namaKelas: true,
            mataPelajaran: {
              select: {
                id: true,
                nama: true,
              },
            },
          },
        },
        semester: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const remark = await this.prisma.academicRemark.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
          },
        },
        kelas: {
          select: {
            id: true,
            namaKelas: true,
          },
        },
        semester: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    });

    if (!remark) {
      throw new NotFoundException(`Academic Remark with ID ${id} not found`);
    }

    return remark;
  }

  async update(id: string, dto: UpdateAcademicRemarkDto, pengajarId: string) {
    const remark = await this.prisma.academicRemark.findUnique({
      where: { id },
      include: {
        kelas: {
          include: {
            enrollments: {
              where: { userId: pengajarId },
              include: { user: true },
            },
          },
        },
      },
    });

    if (!remark) {
      throw new NotFoundException(`Academic Remark with ID ${id} not found`);
    }

    // Validate pengajar is assigned to this kelas
    const enrollment = remark.kelas.enrollments.find(
      (e) => e.userId === pengajarId && e.user.role === Role.PENGAJAR,
    );

    if (!enrollment) {
      throw new ForbiddenException(
        'You are not assigned as pengajar for this kelas',
      );
    }

    // Only allow updating catatan
    return this.prisma.academicRemark.update({
      where: { id },
      data: { catatan: dto.catatan },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
          },
        },
        kelas: {
          select: {
            id: true,
            namaKelas: true,
          },
        },
        semester: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    });
  }

  async remove(id: string, pengajarId: string) {
    const remark = await this.prisma.academicRemark.findUnique({
      where: { id },
      include: {
        kelas: {
          include: {
            enrollments: {
              where: { userId: pengajarId },
              include: { user: true },
            },
          },
        },
      },
    });

    if (!remark) {
      throw new NotFoundException(`Academic Remark with ID ${id} not found`);
    }

    // Validate pengajar is assigned to this kelas
    const enrollment = remark.kelas.enrollments.find(
      (e) => e.userId === pengajarId && e.user.role === Role.PENGAJAR,
    );

    if (!enrollment) {
      throw new ForbiddenException(
        'You are not assigned as pengajar for this kelas',
      );
    }

    return this.prisma.academicRemark.delete({
      where: { id },
    });
  }
}
