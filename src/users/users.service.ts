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
import { UserRole } from '../common/enums/user-role.enum';
import { BcryptHelper } from '../common/helpers/bcrypt.helper';
import { Customer } from '../customer/entities/customer.entity';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,

  ) { }

  async createAdminIfNotExists(dto: RegisterDto): Promise<User> {
    const exists = await this.userRepository.findOne({
      where: { username: dto.username },
    });

    if (exists) {
      throw new BadRequestException('Admin already exists');
    }

    const hashedPassword = await BcryptHelper.hashPassword(dto.password);

    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    });

    return await this.userRepository.save(user);
  }


  async createOwner(dto: RegisterDto, requesterRole: UserRole): Promise<User> {
    if (requesterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create an owner');
    }

    const exists = await this.userRepository.findOne({ where: { username: dto.username } });
    if (exists) {
      throw new BadRequestException('Username already exists');
    }

    const hashedPassword = await BcryptHelper.hashPassword(dto.password);

    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
      role: UserRole.OWNER,
      isActive: true,
    });

    return await this.userRepository.save(user);
  }
  async create(registerDto: RegisterDto): Promise<User> {
    const hashedPassword = await BcryptHelper.hashPassword(registerDto.password);

    const newUser = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
      role: UserRole.CUSTOMER,
    });

    const savedUser = await this.userRepository.save(newUser);

    // Crear CustomerProfile sólo si el usuario es CUSTOMER
    if (savedUser.role === UserRole.CUSTOMER) {
      const profile = this.customerRepository.create({
        user: savedUser,
        address: registerDto.address,
        city: registerDto.city,
        location: registerDto.location,
      });

      await this.customerRepository.save(profile);
    }

    return savedUser;
  }
  async findAll(): Promise<User[]> {
    return this.userRepository.find({ where: { isActive: true } });
  }

  async findOne(id: number): Promise<User | null> {
    if (typeof id !== 'number' || isNaN(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    return await this.userRepository.findOne({ where: { id, isActive: true } });
  }
  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { username, isActive: true } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }
  async update(id: number, updateUserDto: UpdateUserDto, role: UserRole): Promise<UpdateResult> {
    if (role === UserRole.CUSTOMER) {
      const { email, phone, password } = updateUserDto;
      updateUserDto = {};

      if (email) updateUserDto.email = email;
      if (phone) updateUserDto.phone = phone;
      if (password) {
        // Asumí que ya viene hasheada
        updateUserDto.password = password;
      }
    }

    return this.userRepository.update(id, updateUserDto);
  }

  async remove(
    id: number | string,
    requesterRole: UserRole,
    requesterId?: number
  ): Promise<UpdateResult> {
    const numericId = typeof id === 'string' ? Number(id) : id;
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userRepository.findOne({ where: { id: numericId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Nunca permitir desactivar a un ADMIN
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Admin accounts cannot be deactivated');
    }

    // CUSTOMER solo puede desactivarse a sí mismo
    if (requesterRole === UserRole.CUSTOMER) {
      if (numericId !== requesterId) {
        throw new ForbiddenException('You are not allowed to deactivate another user\'s account');
      }
    }

    // OWNER solo puede desactivar a CUSTOMERS
    if (requesterRole === UserRole.OWNER) {
      if (user.role !== UserRole.CUSTOMER) {
        throw new ForbiddenException('Owners can only deactivate customer accounts');
      }
    }

    // ADMIN puede desactivar a cualquier rol excepto a otro ADMIN (ya validado arriba)
    if (requesterRole !== UserRole.ADMIN && requesterRole !== UserRole.OWNER && requesterRole !== UserRole.CUSTOMER) {
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

  async findActiveUsers(): Promise<User[]> {

    return this.userRepository.find({ where: { isActive: true } });
  }


  async findInactive(): Promise<User[]> {
    return this.userRepository.find({ where: { isActive: false } });
  }



}
