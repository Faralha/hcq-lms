import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Token harus diisi' })
  token: string;

  @IsString()
  @IsNotEmpty({ message: 'Password harus diisi' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Konfirmasi password harus diisi' })
  confirmPassword: string;
}
