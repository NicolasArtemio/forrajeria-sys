import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { RolesGuard } from 'src/guards/roles/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { AunthenticatedRequest } from 'src/common/interfaces/authenticatedrequest.interface';
import { plainToClass } from 'class-transformer';
import { UpdateUserSelfDto } from './dto/update-user-self.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  create(@Body() registerDto: RegisterDto) {
    return this.usersService.create(registerDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AunthenticatedRequest) {

    const user = req.user;

    if (user.role === UserRole.CLIENT && user.id !== +id) {
      throw new ForbiddenException('Acces denied');
    }
    return this.usersService.findOne(+id);
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

    if (user.role === UserRole.CLIENT && user.id !== numericId) {
      throw new ForbiddenException('Access denied');
    }

    const transformedDto = user.role === UserRole.CLIENT
      ? plainToClass(UpdateUserSelfDto, dto)
      : dto;

    return this.usersService.update(numericId, transformedDto, user.role);
  }

  @UseGuards(AuthGuard)
  @Delete('me')
  async deleteOwnAccount(@Req() req: AunthenticatedRequest) {
    const userId = Number(req.user?.id);
    if (isNaN(userId)) {
      throw new BadRequestException('ID inválido en token');
    }
    return this.usersService.remove(userId, req.user.role, userId);
  }
  @UseGuards(AuthGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AunthenticatedRequest) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new BadRequestException('ID inválido');
    }
    const requesterRole = req.user.role;
    return this.usersService.remove(numericId, requesterRole);
  }



}
