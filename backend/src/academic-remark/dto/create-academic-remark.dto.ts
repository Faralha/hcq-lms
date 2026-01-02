import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateAcademicRemarkDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  kelasId: string;

  @IsUUID()
  @IsNotEmpty()
  semesterId: string;

  @IsString()
  @IsNotEmpty()
  catatan: string;
}
