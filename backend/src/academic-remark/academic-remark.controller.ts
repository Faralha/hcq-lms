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
import { AcademicRemarkService } from './academic-remark.service';
import { CreateAcademicRemarkDto, UpdateAcademicRemarkDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { Request } from 'express';

@Controller('academic-remark')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicRemarkController {
  constructor(private readonly academicRemarkService: AcademicRemarkService) {}

  @Post()
  @Roles(Role.PENGAJAR)
  create(@Body() createDto: CreateAcademicRemarkDto, @Req() req: Request) {
    return this.academicRemarkService.create(createDto, req.user!.sub);
  }

  @Get('kelas/:kelasId')
  @Roles(Role.PENGAJAR, Role.ADMIN)
  findByKelas(@Param('kelasId') kelasId: string, @Req() req: Request) {
    return this.academicRemarkService.findByKelas(kelasId, req.user!.sub);
  }

  @Get('saya')
  @Roles(Role.PELAJAR)
  findMyRemarks(@Req() req: Request) {
    return this.academicRemarkService.findMyRemarks(req.user!.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.academicRemarkService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.PENGAJAR)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAcademicRemarkDto,
    @Req() req: Request,
  ) {
    return this.academicRemarkService.update(id, updateDto, req.user!.sub);
  }

  @Delete(':id')
  @Roles(Role.PENGAJAR)
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.academicRemarkService.remove(id, req.user!.sub);
  }
}
