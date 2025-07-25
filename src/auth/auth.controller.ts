import { AuthService } from './auth.service';
import { Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/email/email.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService
    ) { }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    login(@Body() loginDto: LoginDto) {
        return this.authService.signIn(loginDto);
    }


    @Post('request-restore')
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

        await this.emailService.sendRestoreEmail(user.email, restoreLink); // ⚠️ Probable punto de fallo

        console.log('✅ Correo enviado');
        return { message: 'Correo de restauración enviado' };
    }

    @Post('restore-account')
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

}
