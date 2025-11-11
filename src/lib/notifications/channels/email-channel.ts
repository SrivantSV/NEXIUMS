import { ProcessedNotification, ChannelResult } from '@/types/collaboration';
import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export class EmailNotificationChannel {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;

  constructor(config?: EmailConfig) {
    this.config = config || this.getDefaultConfig();
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
    });
  }

  private getDefaultConfig(): EmailConfig {
    return {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      from: process.env.EMAIL_FROM || 'noreply@nexusai.com',
    };
  }

  async send(notification: ProcessedNotification): Promise<ChannelResult> {
    try {
      const emailContent = this.buildEmailContent(notification);

      await this.transporter.sendMail({
        from: this.config.from,
        to: notification.userEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      return { success: true };
    } catch (error) {
      console.error('Email notification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private buildEmailContent(notification: ProcessedNotification): {
    subject: string;
    html: string;
    text: string;
  } {
    const template = notification.template;

    return {
      subject: template.subject || template.title,
      html: this.buildHtmlEmail(template),
      text: template.text || template.message,
    };
  }

  private buildHtmlEmail(template: any): string {
    if (template.html) {
      return this.wrapInEmailTemplate(template.html);
    }

    return this.wrapInEmailTemplate(`
      <h2>${template.title}</h2>
      <p>${template.message}</p>
    `);
  }

  private wrapInEmailTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nexus AI Notification</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border: 1px solid #e2e8f0;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #718096;
              font-size: 14px;
            }
            a {
              color: #667eea;
              text-decoration: none;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #667eea;
              color: white !important;
              border-radius: 6px;
              text-decoration: none;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Nexus AI</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>You're receiving this email because you're part of a Nexus AI workspace.</p>
            <p><a href="#">Manage notification preferences</a></p>
          </div>
        </body>
      </html>
    `;
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email configuration verification failed:', error);
      return false;
    }
  }
}
