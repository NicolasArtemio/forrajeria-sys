import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BcryptHelper } from '../common/helpers/bcrypt.helper';
import { UsersService } from '../users/users.service';
import { AuthResponse } from '../common/interfaces/authresponse.interface';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly jwtService: JwtService
    ) { }


async signIn({ username, password }): Promise<AuthResponse> {
    const user = await this.userService.findByUsername(username);

    if (!user) throw new UnauthorizedException('Invalid user');


    const isPasswordValid = await BcryptHelper.comparePassword(password, user.password);


    if (!isPasswordValid) throw new UnauthorizedException('Invalid password');

    const payload = { sub: user.id, username: user.username, role: user.role };

    return {
        access_token: await this.jwtService.signAsync(payload),
        user: {
            username: user.username,
            role: user.role,
        },
    };
}

    async generateRestoreToken(userId: number): Promise<string> {
        const payload = { sub: userId, type: 'restore' };
        return await this.jwtService.signAsync(payload, { expiresIn: '15m' });
    }
    async requestPasswordReset(email: string): Promise<string> {
        const user = await this.userService.findByEmail(email);

        if (!user || !user.isActive) {
            throw new NotFoundException('User not found or inactive');
        }

        const token = await this.generateRestoreToken(user.id);
        return token;
    }


    async resetPassword(token: string, newPassword: string): Promise<void> {
        try {
            const payload = await this.jwtService.verifyAsync(token);

            // Verificamos que el token sea del tipo restore
            if (payload.type !== 'restore') {
                throw new UnauthorizedException('Invalid token type');
            }

            const userId = payload.sub;

            const user = await this.userService.findOne(userId);
            if (!user || !user.isActive) {
                throw new NotFoundException('User not found or inactive');
            }

            const hashedPassword = await BcryptHelper.hashPassword(newPassword);

            // Actualizamos la contraseña
            await this.userService.update(userId, { password: hashedPassword }, user.role);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedException('Token expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new UnauthorizedException('Invalid token');
            }
            throw error;
        }
    }
}
