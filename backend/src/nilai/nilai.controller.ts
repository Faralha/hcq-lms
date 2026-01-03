import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NilaiService } from './nilai.service';
import {
  CreateKomponenNilaiDto,
  UpdateKomponenNilaiDto,
  EntryNilaiDto,
  UpdateNilaiDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { Request } from 'express';

@Controller('nilai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NilaiController {
  constructor(private readonly nilaiService: NilaiService) {}

  private getAuthUser(req: Request): { userId: string; role: Role } {
    const user = req.user as { sub: string; role: Role } | undefined;
    return { userId: user!.sub, role: user!.role };
  }

  // ==================== KOMPONEN NILAI ====================

  @Post('komponen')
  @Roles(Role.PENGAJAR, Role.ADMIN)
  createKomponen(
    @Body() createKomponenDto: CreateKomponenNilaiDto,
    @Req() req: Request,
  ) {
    const { userId } = this.getAuthUser(req);
    return this.nilaiService.createKomponen(createKomponenDto, userId);
  }

  @Get('komponen/kelas/:kelasId')
  getKomponenByKelas(@Param('kelasId') kelasId: string) {
    return this.nilaiService.getKomponenByKelas(kelasId);
  }

  @Get('komponen/:id')
  getKomponenById(@Param('id') id: string) {
    return this.nilaiService.getKomponenById(id);
  }

  @Patch('komponen/:id')
  @Roles(Role.PENGAJAR, Role.ADMIN)
  updateKomponen(
    @Param('id') id: string,
    @Body() updateKomponenDto: UpdateKomponenNilaiDto,
    @Req() req: Request,
  ) {
    const { userId } = this.getAuthUser(req);
    return this.nilaiService.updateKomponen(id, updateKomponenDto, userId);
  }

  @Delete('komponen/:id')
  @Roles(Role.PENGAJAR, Role.ADMIN)
  deleteKomponen(@Param('id') id: string, @Req() req: Request) {
    const { userId } = this.getAuthUser(req);
    return this.nilaiService.deleteKomponen(id, userId);
  }

  // ==================== NILAI ====================

  @Post('entry')
  @Roles(Role.PENGAJAR, Role.ADMIN)
  entryNilai(@Body() entryNilaiDto: EntryNilaiDto, @Req() req: Request) {
    const { userId, role } = this.getAuthUser(req);
    return this.nilaiService.entryNilai(entryNilaiDto, userId, role);
  }

  @Patch(':id')
  @Roles(Role.PENGAJAR, Role.ADMIN)
  updateNilai(
    @Param('id') id: string,
    @Body() updateNilaiDto: UpdateNilaiDto,
    @Req() req: Request,
  ) {
    const { userId, role } = this.getAuthUser(req);
    return this.nilaiService.updateNilai(id, updateNilaiDto, userId, role);
  }

  @Get('kelas/:kelasId')
  @Roles(Role.PENGAJAR, Role.ADMIN)
  getNilaiByKelas(@Param('kelasId') kelasId: string, @Req() req: Request) {
    const { userId, role } = this.getAuthUser(req);
    return this.nilaiService.getNilaiByKelas(kelasId, userId, role);
  }

  @Get('saya')
  @Roles(Role.PELAJAR)
  getMyNilai(@Req() req: Request) {
    const { userId } = this.getAuthUser(req);
    return this.nilaiService.getMyNilai(userId);
  }

  @Delete(':id')
  @Roles(Role.PENGAJAR, Role.ADMIN)
  deleteNilai(@Param('id') id: string, @Req() req: Request) {
    const { userId, role } = this.getAuthUser(req);
    return this.nilaiService.deleteNilai(id, userId, role);
  }
}
