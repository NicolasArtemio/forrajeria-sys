import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST, 
            port: parseInt(process.env.SMTP_PORT || '465', 10), 
            secure: process.env.SMTP_SECURE === 'true',
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
            throw error;
        }
    }

    async sendResetPasswordEmail(to: string, link: string): Promise<void> {
    try {
        await this.transporter.sendMail({
            from: `"Tu App" <${process.env.SMTP_USER}>`,
            to,
            subject: 'Restablecimiento de contraseña',
            html: `
                <h3>Restablecer contraseña</h3>
                <p>Haz clic en el siguiente enlace para cambiar tu contraseña:</p>
                <a href="${link}">${link}</a>
            `,
        });
        console.log('Email de restablecimiento enviado correctamente a:', to);
    } catch (error) {
        console.error('Error enviando email de restablecimiento:', error);
        throw error;
    }
}

}
