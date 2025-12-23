import { IsUUID } from 'class-validator';

export class GenerateRaporDto {
  @IsUUID()
  studentId: string;
}
