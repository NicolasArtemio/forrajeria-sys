import { UserRole } from 'src/common/enums/user-role.enum';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BcryptHelper } from 'src/common/helpers/bcrypt.helper';
import { UsersService } from 'src/users/users.service';
import { AuthResponse } from 'src/common/interfaces/authresponse.interface';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly jwtService: JwtService
    ) {}


    async signIn({ username,password }):Promise<AuthResponse> {
        const user = await this.userService.findByUsername(username)

        if(!user) throw new UnauthorizedException('Invalid user');

        const isPasswordValid =  await BcryptHelper.comparePassword(password, user.password);
        
        if(!isPasswordValid) throw new UnauthorizedException('Invalid password');

        const payload = {sub: user.id, username: user.username, role: user.role}

        return {
            access_token: await this.jwtService.signAsync(payload),
            user: {
                username: user.username,
                role: user.role
            }
        }
    }   
}
