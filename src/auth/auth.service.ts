import { Injectable, UnauthorizedException } from '@nestjs/common';
import { BcryptHelper } from 'src/common/helpers/bcrypt.helper';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
    constructor(private readonly userService: UsersService) {}
    async login({ username,password }) {
        const user = await this.userService.findByUsername(username)

        if(!user) throw new UnauthorizedException('Invalid user');

        const isPasswordValid =  await BcryptHelper.comparePassword(password, user.password);
        
        if(!isPasswordValid) throw new UnauthorizedException('Invalid password');

        return {
            username: user.username,
        }
    }
}
