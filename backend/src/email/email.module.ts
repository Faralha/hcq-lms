import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { EmailService } from './email.service';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('EMAIL_HOST', 'localhost');
        const port = configService.get<number>('EMAIL_PORT', 1025);
        const secure = configService.get<boolean>('EMAIL_SECURE', false);
        const user = configService.get<string>('EMAIL_USER');
        const pass = configService.get<string>('EMAIL_PASSWORD');

        // Build transport URL
        let transportUrl = `smtp://${host}:${port}`;
        if (user && pass) {
          transportUrl = `smtp://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}`;
        }
        if (secure) {
          transportUrl = transportUrl.replace('smtp://', 'smtps://');
        }

        return {
          transport: transportUrl,
          defaults: {
            from: configService.get<string>(
              'EMAIL_FROM',
              '"No Reply" <noreply@example.com>',
            ),
          },
          template: {
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
