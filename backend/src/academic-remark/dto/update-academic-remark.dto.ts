import { PartialType } from '@nestjs/mapped-types';
import { CreateAcademicRemarkDto } from './create-academic-remark.dto';

export class UpdateAcademicRemarkDto extends PartialType(
  CreateAcademicRemarkDto,
) {}
