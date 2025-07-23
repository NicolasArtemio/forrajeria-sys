import { Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DeleteResult, Repository } from 'typeorm';
import { UserRole } from 'src/common/enums/user-role.enum';
import { BcryptHelper } from 'src/common/helpers/bcrypt.helper';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepostory: Repository<User>
  ) {}

  async create(registerDto: RegisterDto):Promise<User> {

    const hashedPassword = await BcryptHelper.hashPassword(registerDto.password);

     const newUser = this.userRepostory.create({
    ...registerDto,
    password: hashedPassword,
    role: UserRole.USER, 
  });

    return await this.userRepostory.save(newUser);
  }

 async findAll(): Promise<User[]> {
    return this.userRepostory.find();
  }

 async findOne(id: number):Promise<User | null> {
    return await this.userRepostory.findOneBy({id});
  }

async update(id: number, updateUserDto: UpdateUserDto, role: UserRole) {
  if (role === UserRole.USER) {

    const { email, phone, password } = updateUserDto;
    updateUserDto = {};

    if (email) updateUserDto.email = email;
    if (phone) updateUserDto.phone = phone;
    if (password) {

      const hashedPassword = await BcryptHelper.hashPassword(password)
      updateUserDto.password = hashedPassword;
    }
  }

  return this.userRepostory.update(id, updateUserDto);
}

  async remove(id: number): Promise<DeleteResult> {
    return this.userRepostory.softDelete({id});
  }
  async findByUsername(username: string): Promise<User | null> {
  return await this.userRepostory.findOneBy({ username });
}
}
