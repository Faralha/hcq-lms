import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendMagicLinkEmail(
    to: string,
    recipientName: string,
    magicLink: string,
  ): Promise<boolean> {
    try {
      const htmlTemplate = this.getMagicLinkTemplate(recipientName, magicLink);

      await this.mailerService.sendMail({
        to,
        subject: 'Undangan Bergabung sebagai Pengajar - HCQ',
        html: htmlTemplate,
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

  async sendWelcomeEmail(to: string, recipientName: string): Promise<boolean> {
    try {
      const htmlTemplate = this.getWelcomeTemplate(recipientName);

      await this.mailerService.sendMail({
        to,
        subject: 'Selamat Datang di HCQ!',
        html: htmlTemplate,
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

  private getMagicLinkTemplate(
    recipientName: string,
    magicLink: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              color: #333;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #4CAF50;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #4CAF50;
              margin: 0;
              font-size: 28px;
            }
            .content {
              margin-bottom: 30px;
            }
            .greeting {
              font-size: 16px;
              margin-bottom: 20px;
            }
            .magic-link-section {
              background-color: #f9f9f9;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
              border-left: 4px solid #4CAF50;
            }
            .cta-button {
              display: inline-block;
              background-color: #4CAF50;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 4px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .cta-button:hover {
              background-color: #45a049;
            }
            .link-text {
              word-break: break-all;
              background-color: #efefef;
              padding: 10px;
              border-radius: 4px;
              font-size: 12px;
              margin: 10px 0;
              color: #666;
            }
            .expiration {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              border-radius: 4px;
              margin: 20px 0;
              color: #856404;
            }
            .footer {
              text-align: center;
              border-top: 1px solid #ddd;
              padding-top: 20px;
              font-size: 12px;
              color: #999;
            }
            .footer p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>HCQ Platform</h1>
            </div>
            
            <div class="content">
              <div class="greeting">
                Halo <strong>${this.escapeHtml(recipientName)}</strong>,
              </div>
              
              <p>
                Anda telah diundang untuk bergabung sebagai pengajar di platform HCQ. 
                Klik tombol di bawah ini untuk membuat akun Anda:
              </p>
              
              <div style="text-align: center;">
                <a href="${this.escapeHtml(magicLink)}" class="cta-button">Buat Akun Pengajar</a>
              </div>
              
              <p>Atau salin dan paste link berikut di browser Anda:</p>
              <div class="link-text">${this.escapeHtml(magicLink)}</div>
              
              <div class="expiration">
                <strong>⏰ Perhatian:</strong> Link undangan ini hanya berlaku selama 7 hari. 
                Setelah itu, Anda perlu meminta undangan baru.
              </div>
              
              <p>
                Jika Anda tidak meminta undangan ini, abaikan email ini dan tidak ada tindakan 
                yang perlu diambil.
              </p>
            </div>
            
            <div class="footer">
              <p>&copy; 2025 HCQ Platform. All rights reserved.</p>
              <p>Jangan balas email ini. Email ini adalah pesan otomatis.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getWelcomeTemplate(recipientName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              color: #333;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #4CAF50;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #4CAF50;
              margin: 0;
              font-size: 28px;
            }
            .content {
              margin-bottom: 30px;
            }
            .greeting {
              font-size: 16px;
              margin-bottom: 20px;
            }
            .feature-list {
              background-color: #f9f9f9;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
              border-left: 4px solid #4CAF50;
            }
            .feature-list ul {
              list-style: none;
              padding: 0;
            }
            .feature-list li {
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .feature-list li:last-child {
              border-bottom: none;
            }
            .feature-list li:before {
              content: "✓ ";
              color: #4CAF50;
              font-weight: bold;
              margin-right: 10px;
            }
            .footer {
              text-align: center;
              border-top: 1px solid #ddd;
              padding-top: 20px;
              font-size: 12px;
              color: #999;
            }
            .footer p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Selamat Datang!</h1>
            </div>
            
            <div class="content">
              <div class="greeting">
                Halo <strong>${this.escapeHtml(recipientName)}</strong>,
              </div>
              
              <p>
                Terima kasih telah mendaftar di HCQ Platform! Akun Anda telah berhasil dibuat 
                dan Anda sekarang dapat login untuk mulai menggunakan platform kami.
              </p>
              
              <div class="feature-list">
                <strong>Fitur yang tersedia untuk Anda:</strong>
                <ul>
                  <li>Mengelola kelas dan siswa</li>
                  <li>Membuat dan mengunggah materi pembelajaran</li>
                  <li>Melacak presensi siswa</li>
                  <li>Mengelola nilai dan rapor</li>
                  <li>Berkomunikasi dengan siswa melalui sistem</li>
                </ul>
              </div>
              
              <p>
                Jika Anda memiliki pertanyaan atau membutuhkan bantuan, jangan ragu untuk 
                menghubungi tim support kami.
              </p>
            </div>
            
            <div class="footer">
              <p>&copy; 2025 HCQ Platform. All rights reserved.</p>
              <p>Jangan balas email ini. Email ini adalah pesan otomatis.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

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
