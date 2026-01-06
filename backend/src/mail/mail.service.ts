import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendOtp(to: string, code: string) {
        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM || '"Iuppy" <no-reply@iuppy.com.br>',
                to,
                subject: 'Seu código de acesso Iuppy',
                html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Seu código de acesso</h2>
            <p>Use o código abaixo para entrar no app:</p>
            <h1 style="color: #22B4FF; letter-spacing: 5px;">${code}</h1>
            <p>Este código expira em 10 minutos.</p>
          </div>
        `,
            });
            this.logger.log(`OTP sent to ${to}`);
        } catch (e) {
            this.logger.error(`Failed to send OTP to ${to}`, e);
            throw e;
        }
    }
}
