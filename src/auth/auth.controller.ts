import { AuthService } from './auth.service';
import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';


@Controller('autenticacion')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService
    ) { }

    @HttpCode(HttpStatus.OK)
    @Post('iniciar-sesion')
    login(@Body() loginDto: LoginDto) {
        return this.authService.signIn(loginDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('solicitar-restauracion')
    async requestRestore(@Body('email') email: string) {
        console.log('🟡 Email recibido:', email);

        const user = await this.userService.findByEmail(email);
        console.log('🟢 Usuario encontrado:', user);

        if (!user || user.isActive) {
            console.log('🔴 Usuario no existe o está activo');
            throw new UnauthorizedException('No hay cuenta desactivada con ese email');
        }

        const token = await this.authService.generateRestoreToken(user.id);
        console.log('🟣 Token generado:', token);

        const restoreLink = `http://localhost:3000/restaurar?token=${token}`;
        console.log('🔵 Enviando mail con link:', restoreLink);

        await this.emailService.sendRestoreEmail(user.email, restoreLink);

        console.log('✅ Correo enviado');
        return { message: 'Correo de restauración enviado' };
    }

    @HttpCode(HttpStatus.OK)
    @Post('restaurar-cuenta')
    async restoreAccount(@Body('token') token: string) {
        try {
            const payload = await this.jwtService.verifyAsync(token);
            if (payload.type !== 'restore') {
                throw new UnauthorizedException('Token inválido');
            }
            return await this.userService.restoreOwnAccount(payload.sub);
        } catch (error) {
            console.error('Error verificando token:', error);
            throw new UnauthorizedException('Token expirado o inválido');
        }
    }

    @HttpCode(HttpStatus.OK)
    @Post('solicitar-restablecer-password')
    async requestPasswordReset(@Body('email') email: string): Promise<{ message: string }> {
        if (!email) {
            throw new BadRequestException('El campo email es obligatorio');
        }

        const token = await this.authService.requestPasswordReset(email);

        const restoreLink = `http://localhost:3000/restablecer-password?token=${token}`;

        // Llamás al servicio de email para enviar el link
        await this.emailService.sendRestoreEmail(email, restoreLink);

        return { message: 'Correo de restauración enviado correctamente' };
    }

    // // //test
    // async requestPasswordReset(@Body('email') email: string): Promise<{ message: string; token?: string }> {
    //     if (!email) {
    //         throw new BadRequestException('El campo email es obligatorio');
    //     }

    //     const token = await this.authService.requestPasswordReset(email);
    //     const restoreLink = `http://localhost:3000/restablecer-password?token=${token}`;

    //     await this.emailService.sendRestoreEmail(email, restoreLink);

    //     //solo devolver token en modo test
    //     const response: { message: string; token?: string } = {
    //         message: 'Correo de restauración enviado correctamente',
    //     };

    //     if (process.env.NODE_ENV === 'test') {
    //         response.token = token;
    //     }

    //     return response;
    // }



    @HttpCode(HttpStatus.OK)
    @Post('restablecer-password')
    async resetPassword(
        @Body('token') token: string,
        @Body('newPassword') newPassword: string,
    ): Promise<{ message: string }> {
        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }
        if (!newPassword || newPassword.length < 8) {
            throw new BadRequestException('La nueva contraseña es inválida o demasiado corta');
        }
        await this.authService.resetPassword(token, newPassword);
        return { message: 'Password successfully reset' };
    }
}
