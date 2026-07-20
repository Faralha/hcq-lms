import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import mjml2html from 'mjml';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly templatesDir = path.join(
    process.cwd(),
    'src',
    'email',
    'templates',
  );

  constructor(private readonly mailerService: MailerService) {}

  /**
   * Send magic link invitation email to pengajar
   */
  async sendMagicLinkEmail(
    to: string,
    recipientName: string,
    magicLink: string,
  ): Promise<boolean> {
    try {
      const html = this.compileMagicLinkTemplate(recipientName, magicLink);

      await this.mailerService.sendMail({
        to,
        subject: 'Undangan Bergabung sebagai Pengajar - HCQ',
        html,
      });

      this.logger.log(`Magic link email sent successfully to ${to}`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send magic link email to ${to}: ${errorMessage}`,
      );
      throw new BadRequestException(`Failed to send email: ${errorMessage}`);
    }
  }

  /**
   * Send welcome email to newly registered user
   */
  async sendWelcomeEmail(to: string, recipientName: string): Promise<boolean> {
    try {
      const html = this.compileWelcomeTemplate(recipientName);

      await this.mailerService.sendMail({
        to,
        subject: 'Selamat Datang di HCQ!',
        html,
      });

      this.logger.log(`Welcome email sent successfully to ${to}`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send welcome email to ${to}: ${errorMessage}`,
      );
      throw new BadRequestException(`Failed to send email: ${errorMessage}`);
    }
  }

  /**
   * Send password changed notification email
   */
  async sendPasswordChangedEmail(
    to: string,
    recipientName: string,
  ): Promise<boolean> {
    try {
      const html = this.compilePasswordChangedTemplate(recipientName);

      await this.mailerService.sendMail({
        to,
        subject: 'Password Akun Anda Telah Diubah - HCQ',
        html,
      });

      this.logger.log(
        `Password changed notification email sent successfully to ${to}`,
      );
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send password changed email to ${to}: ${errorMessage}`,
      );
      // Don't throw error for notification emails - password change already succeeded
      return false;
    }
  }

  /**
   * Send reset password email
   */
  async sendResetPasswordEmail(
    to: string,
    recipientName: string,
    resetLink: string,
  ): Promise<boolean> {
    try {
      const html = this.compileResetPasswordTemplate(recipientName, resetLink);

      await this.mailerService.sendMail({
        to,
        subject: 'Reset Password - HCQ',
        html,
      });

      this.logger.log(`Reset password email sent successfully to ${to}`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send reset password email to ${to}: ${errorMessage}`,
      );
      throw new BadRequestException(`Failed to send email: ${errorMessage}`);
    }
  }

  /**
   * Compile magic link MJML template
   */
  private compileMagicLinkTemplate(
    recipientName: string,
    magicLink: string,
  ): string {
    const templatePath = path.join(this.templatesDir, 'magic-link.mjml');
    let mjmlContent = fs.readFileSync(templatePath, 'utf-8');

    // Replace placeholders
    mjmlContent = mjmlContent
      .replace(/\{\{recipientName\}\}/g, this.escapeHtml(recipientName))
      .replace(/\{\{magicLink\}\}/g, this.escapeHtml(magicLink));

    // Compile MJML to HTML
    const { html, errors } = mjml2html(mjmlContent);

    if (errors && errors.length > 0) {
      this.logger.warn('MJML compilation warnings:', errors);
    }

    return html;
  }

  /**
   * Compile welcome MJML template
   */
  private compileWelcomeTemplate(recipientName: string): string {
    const templatePath = path.join(this.templatesDir, 'welcome.mjml');
    let mjmlContent = fs.readFileSync(templatePath, 'utf-8');

    // Replace placeholders
    mjmlContent = mjmlContent.replace(
      /\{\{recipientName\}\}/g,
      this.escapeHtml(recipientName),
    );

    // Compile MJML to HTML
    const { html, errors } = mjml2html(mjmlContent);

    if (errors && errors.length > 0) {
      this.logger.warn('MJML compilation warnings:', errors);
    }

    return html;
  }

  /**
   * Compile password changed MJML template
   */
  private compilePasswordChangedTemplate(recipientName: string): string {
    const templatePath = path.join(this.templatesDir, 'password-changed.mjml');
    let mjmlContent = fs.readFileSync(templatePath, 'utf-8');

    // Get current time in Indonesian format
    const changeTime = new Date().toLocaleString('id-ID', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Jakarta',
    });

    // Replace placeholders
    mjmlContent = mjmlContent
      .replace(/\{\{recipientName\}\}/g, this.escapeHtml(recipientName))
      .replace(/\{\{changeTime\}\}/g, this.escapeHtml(changeTime));

    // Compile MJML to HTML
    const { html, errors } = mjml2html(mjmlContent);

    if (errors && errors.length > 0) {
      this.logger.warn('MJML compilation warnings:', errors);
    }

    return html;
  }

  /**
   * Compile reset password MJML template
   */
  private compileResetPasswordTemplate(
    recipientName: string,
    resetLink: string,
  ): string {
    const templatePath = path.join(this.templatesDir, 'reset-password.mjml');
    let mjmlContent = fs.readFileSync(templatePath, 'utf-8');

    // Replace placeholders
    mjmlContent = mjmlContent
      .replace(/\{\{recipientName\}\}/g, this.escapeHtml(recipientName))
      .replace(/\{\{resetLink\}\}/g, this.escapeHtml(resetLink));

    // Compile MJML to HTML
    const { html, errors } = mjml2html(mjmlContent);

    if (errors && errors.length > 0) {
      this.logger.warn('MJML compilation warnings:', errors);
    }

    return html;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
