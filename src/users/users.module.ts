import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customer/entities/customer.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[TypeOrmModule.forFeature([User,Customer]), 
 forwardRef(() => AuthModule),],
  controllers: [UsersController],
  providers: [UsersService],
  exports:  [UsersService]
})
export class UsersModule {}
