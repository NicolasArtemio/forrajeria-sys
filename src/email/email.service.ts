import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST, // c2631564.ferozo.com
            port: parseInt(process.env.SMTP_PORT || '465', 10), // 465 para SSL
            secure: process.env.SMTP_SECURE === 'true', // true porque usamos SSL
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendRestoreEmail(to: string, link: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: `"Tu App" <${process.env.SMTP_USER}>`,
                to,
                subject: 'Restauración de cuenta',
                html: `
                        <h3>Recuperación de cuenta</h3>
                        <p>Haz clic en el siguiente enlace para restaurar tu cuenta:</p>
                        <a href="${link}">${link}</a>
                    `,
            });
            console.log('Email enviado correctamente a:', to);
        } catch (error) {
            console.error('Error enviando email:', error);
            throw error; // O manejar el error como prefieras
        }
    }

}
