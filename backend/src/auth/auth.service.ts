import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import {
  LoginDto,
  RegisterPelajarDto,
  ChangePasswordDto,
  RefreshTokenDto,
} from './dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async registerPelajar(registerDto: RegisterPelajarDto) {
    const { email, password, nama, fullName, cities, address, phoneNumber } =
      registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password with Argon2
    const hashedPassword = await argon2.hash(password);

    // Create user with PELAJAR role
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nama,
        fullName,
        cities,
        address,
        phoneNumber,
        role: Role.PELAJAR, // Always PELAJAR for this endpoint
      },
      select: {
        id: true,
        email: true,
        nama: true,
        fullName: true,
        cities: true,
        address: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      message: 'Student registered successfully',
      user,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password with Argon2
    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nama: user.nama,
        role: user.role,
      },
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    // Find refresh token in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      // Delete expired token
      await this.prisma.refreshToken.deleteMany({
        where: { id: storedToken.id },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
    );

    // Delete old refresh token (use deleteMany to avoid error if already deleted)
    await this.prisma.refreshToken.deleteMany({
      where: { id: storedToken.id },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        nama: storedToken.user.nama,
        role: storedToken.user.role,
      },
    };
  }

  async logout(refreshToken: string) {
    // Delete refresh token from database
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    return {
      message: 'Logged out successfully',
    };
  }

  private async generateTokens(userId: string, email: string, role: Role) {
    const payload = {
      sub: userId,
      email,
      role,
    };

    // Generate access token (short-lived: 15 minutes)
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    // Generate refresh token (long-lived: 7 days)
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nama: true,
        fullName: true,
        cities: true,
        address: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { oldPassword, newPassword } = changePasswordDto;

    // Find user with password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await argon2.verify(user.password, oldPassword);

    if (!isOldPasswordValid) {
      throw new BadRequestException('Password lama tidak sesuai');
    }

    // Check if new password is same as old password
    if (oldPassword === newPassword) {
      throw new BadRequestException(
        'Password baru tidak boleh sama dengan password lama',
      );
    }

    // Hash new password
    const hashedNewPassword = await argon2.hash(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
      },
    });

    return {
      message: 'Password berhasil diubah',
    };
  }

  async createPengajarInvitation(email: string) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Check if invitation already exists and not used
    const existingInvitation = await this.prisma.pengajarInvitation.findUnique({
      where: { email },
    });

    if (existingInvitation && !existingInvitation.used) {
      throw new ConflictException('Invitation already sent to this email');
    }

    // Generate random token
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create or update invitation
    const invitation = await this.prisma.pengajarInvitation.upsert({
      where: { email },
      update: {
        token,
        expiresAt,
        used: false,
      },
      create: {
        email,
        token,
        expiresAt,
      },
    });

    // Generate magic link
    const magicLink = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/auth/validate-pengajar?token=${token}`;

    // Send email with magic link
    await this.emailService.sendMagicLinkEmail(
      email,
      email.split('@')[0], // Use email prefix as name if not available
      magicLink,
    );

    return {
      message: 'Invitation created and sent successfully',
      email: invitation.email,
      expiresAt: invitation.expiresAt,
    };
  }

  async validatePengajarInvitationToken(token: string) {
    // Find and validate invitation
    const invitation = await this.prisma.pengajarInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new BadRequestException('Invalid invitation token');
    }

    if (invitation.used) {
      throw new BadRequestException('Invitation token already used');
    }

    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('Invitation token expired');
    }

    return {
      valid: true,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
    };
  }

  async registerPengajarWithToken(
    registerDto: RegisterPelajarDto,
    token: string,
  ) {
    // Find and validate invitation
    const invitation = await this.prisma.pengajarInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new BadRequestException('Invalid invitation token');
    }

    if (invitation.used) {
      throw new BadRequestException('Invitation token already used');
    }

    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('Invitation token expired');
    }

    // Check if email matches
    if (invitation.email !== registerDto.email) {
      throw new BadRequestException('Email does not match invitation');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const { email, password, nama, fullName, cities, address, phoneNumber } =
      registerDto;

    // Hash password with Argon2
    const hashedPassword = await argon2.hash(password);

    // Create user with PENGAJAR role
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nama,
        fullName,
        cities,
        address,
        phoneNumber,
        role: Role.PENGAJAR, // Always PENGAJAR when using token
      },
      select: {
        id: true,
        email: true,
        nama: true,
        fullName: true,
        cities: true,
        address: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
      },
    });

    // Mark invitation as used
    await this.prisma.pengajarInvitation.update({
      where: { token },
      data: { used: true },
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail(
      user.email,
      user.fullName || user.nama || user.email.split('@')[0],
    );

    return {
      message: 'Teacher registered successfully',
      user,
    };
  }

  // ==================== Invitation CRUD Methods ====================

  async getInvitations() {
    const invitations = await this.prisma.pengajarInvitation.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Add computed status field
    return invitations.map((invitation) => {
      let status: 'PENDING' | 'USED' | 'EXPIRED';
      if (invitation.used) {
        status = 'USED';
      } else if (new Date() > invitation.expiresAt) {
        status = 'EXPIRED';
      } else {
        status = 'PENDING';
      }

      return {
        ...invitation,
        status,
      };
    });
  }

  async getInvitationById(id: string) {
    const invitation = await this.prisma.pengajarInvitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Add computed status field
    let status: 'PENDING' | 'USED' | 'EXPIRED';
    if (invitation.used) {
      status = 'USED';
    } else if (new Date() > invitation.expiresAt) {
      status = 'EXPIRED';
    } else {
      status = 'PENDING';
    }

    return {
      ...invitation,
      status,
    };
  }

  async deleteInvitation(id: string) {
    const invitation = await this.prisma.pengajarInvitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.prisma.pengajarInvitation.delete({
      where: { id },
    });

    return {
      message: 'Invitation deleted successfully',
    };
  }

  async resendInvitation(id: string) {
    const invitation = await this.prisma.pengajarInvitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.used) {
      throw new BadRequestException('Cannot resend: invitation already used');
    }

    // Generate new token and extend expiration
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Update invitation with new token
    const updatedInvitation = await this.prisma.pengajarInvitation.update({
      where: { id },
      data: {
        token,
        expiresAt,
      },
    });

    // Generate magic link
    const magicLink = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/auth/validate-pengajar?token=${token}`;

    // Send email with magic link
    await this.emailService.sendMagicLinkEmail(
      updatedInvitation.email,
      updatedInvitation.email.split('@')[0],
      magicLink,
    );

    return {
      message: 'Invitation resent successfully',
      email: updatedInvitation.email,
      expiresAt: updatedInvitation.expiresAt,
    };
  }
}
