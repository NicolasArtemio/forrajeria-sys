import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../guards/auth/auth.guard';
import { RolesGuard } from '../guards/roles/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { AunthenticatedRequest } from '../common/interfaces/authenticatedrequest.interface';
import { plainToClass } from 'class-transformer';
import { UpdateCustomerProfileDto } from './dto/update-user-self.dto';


@Controller('usuarios')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
 async create(@Body() registerDto: RegisterDto) {
    return await this.usersService.create(registerDto);
  }

  @Post('crear-owner')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createOwner(@Body() dto: RegisterDto, @Req() req) {
    return await this.usersService.createOwner(dto, req.user.role);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async findAll() {
    return await this.usersService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AunthenticatedRequest) {

    const user = req.user;

    if (user.role === UserRole.CUSTOMER && user.id !== +id) {
      throw new ForbiddenException('Acces denied');
    }
    return await this.usersService.findOne(+id);
  }


  @UseGuards(AuthGuard)
  @Patch(':id')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: AunthenticatedRequest
  ) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = req.user;

    if (user.role === UserRole.CUSTOMER && user.id !== numericId) {
      throw new ForbiddenException('Access denied');
    }

    const transformedDto = user.role === UserRole.CUSTOMER
      ? plainToClass(UpdateCustomerProfileDto, dto)
      : dto;

    return await this.usersService.update(numericId, transformedDto, user.role);
  }

  @UseGuards(AuthGuard)
  @Delete('me')
  async deleteOwnAccount(@Req() req: AunthenticatedRequest) {
    const userId = Number(req.user?.id);
    if (isNaN(userId)) {
      throw new BadRequestException('ID inválido en token');
    }
    return await this.usersService.remove(userId, req.user.role, userId);
  }
  @UseGuards(AuthGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete(':id')
 async remove(@Param('id') id: string, @Req() req: AunthenticatedRequest) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new BadRequestException('ID inválido');
    }
    const requesterRole = req.user.role;
    return await this.usersService.remove(numericId, requesterRole);
  }

 

}
