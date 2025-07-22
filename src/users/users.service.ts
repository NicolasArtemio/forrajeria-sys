import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
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

  async create(createUserDto: CreateUserDto):Promise<User> {

    const hashedPassword = await BcryptHelper.hashPassword(createUserDto.password);

     const newUser = this.userRepostory.create({
    ...createUserDto,
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

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async remove(id: number): Promise<DeleteResult> {
    return this.userRepostory.softDelete({id});
  }
  async findByUsername(username: string): Promise<User | null> {
  return await this.userRepostory.findOneBy({ username });
}
}
