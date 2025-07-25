import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegisterDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository, UpdateResult } from 'typeorm';
import { UserRole } from 'src/common/enums/user-role.enum';
import { BcryptHelper } from 'src/common/helpers/bcrypt.helper';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async create(registerDto: RegisterDto): Promise<User> {
    const hashedPassword = await BcryptHelper.hashPassword(registerDto.password);

    const newUser = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
      role: UserRole.CLIENT,
    });

    return await this.userRepository.save(newUser);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ where: { isActive: true } });
  }

  async findOne(id: number): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id, isActive: true } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { username, isActive: true } });
  }

  async findByEmail(email: string): Promise<User | null> {
  return this.userRepository.findOne({ where: { email } });
}
  async update(id: number, updateUserDto: UpdateUserDto, role: UserRole): Promise<UpdateResult> {
    if (role === UserRole.CLIENT) {
      const { email, phone, password } = updateUserDto;
      updateUserDto = {};

      if (email) updateUserDto.email = email;
      if (phone) updateUserDto.phone = phone;
      if (password) {
        const hashedPassword = await BcryptHelper.hashPassword(password);
        updateUserDto.password = hashedPassword;
      }
    }

    return this.userRepository.update(id, updateUserDto);
  }

  async remove(id: number | string, requesterRole: UserRole, requesterId?: number): Promise<UpdateResult> {
    const numericId = typeof id === 'string' ? Number(id) : id;
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userRepository.findOne({ where: { id: numericId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Admin accounts cannot be deactivated');
    }

    if (requesterRole === UserRole.CLIENT) {
      if (numericId !== requesterId) {
        throw new ForbiddenException('You are not allowed to deactivate another user\'s account');
      }
    } else if (requesterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to deactivate this account');
    }

    return this.userRepository.update(numericId, { isActive: false });
  }

  async restoreOwnAccount(userId: number): Promise<UpdateResult> {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isActive) {
      throw new BadRequestException('Account is already active');
    }

    return this.userRepository.update(userId, { isActive: true });
  }
}
