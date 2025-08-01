import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BcryptHelper } from '../common/helpers/bcrypt.helper';
import { UsersService } from '../users/users.service';
import { AuthResponse } from '../common/interfaces/authresponse.interface';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly jwtService: JwtService
    ) { }


    async signIn({ username, password }: LoginDto): Promise<AuthResponse> {
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
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(token);
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        if (payload.type !== 'restore') {
            throw new UnauthorizedException('Invalid token type');
        }

        const userId = payload.sub;

        const user = await this.userService.findOne(userId);
        if (!user || !user.isActive) {
            throw new NotFoundException('User not found or inactive');
        }

        const hashedPassword = await BcryptHelper.hashPassword(newPassword);
        await this.userService.update(userId, { password: hashedPassword }, user.role);
    }

}

