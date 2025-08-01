import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
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
import { validateOrReject } from 'class-validator';

@Controller('usuarios')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() registerDto: RegisterDto) {
    return await this.usersService.create(registerDto);
  }

  @Post('crear-owner')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createOwner(@Body() dto: RegisterDto, @Req() req: AunthenticatedRequest) {
    return await this.usersService.createOwner(dto, req.user.role);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return await this.usersService.findAll();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Get('activo')
  @HttpCode(HttpStatus.OK)
  findActiveUsers() {
    return this.usersService.findActiveUsers();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('inactivo')
  @HttpCode(HttpStatus.OK)
  findInactive() {
    return this.usersService.findInactive();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: AunthenticatedRequest) {
    const user = req.user;

    if (user.role === UserRole.CUSTOMER && user.id !== +id) {
      throw new ForbiddenException('Access denied');
    }

    return await this.usersService.findOne(+id);
  }

 @UseGuards(AuthGuard)
@Patch(':id')
@HttpCode(HttpStatus.OK)
async update(
  @Param('id') id: string,
  @Body() dto: UpdateUserDto,
  @Req() req: AunthenticatedRequest,
) {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    throw new BadRequestException('Invalid user ID');
  }

  const user = req.user;

  if (user.role === UserRole.CUSTOMER && user.id !== numericId) {
    throw new ForbiddenException('Access denied');
  }

  if (user.role === UserRole.CUSTOMER) {
    // Para clientes, convertir a UpdateCustomerProfileDto
    const transformedDto = plainToClass(UpdateCustomerProfileDto, dto);
    try {
      await validateOrReject(transformedDto);
    } catch (errors) {
      throw new BadRequestException('Validation failed');
    }
    if (Object.keys(transformedDto).length === 0) {
      throw new BadRequestException('No hay datos para actualizar');
    }
    // Aquí llamas al método que actualiza el perfil customer
    return this.usersService.updateCustomerProfile(numericId, transformedDto);
  } else {
    // Para roles ADMIN, OWNER o similares
    try {
      await validateOrReject(dto);
    } catch (errors) {
      throw new BadRequestException('Validation failed');
    }
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No hay datos para actualizar');
    }
    return this.usersService.update(numericId, dto, user.role);
  }
}

  @UseGuards(AuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Req() req: AunthenticatedRequest) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new BadRequestException('ID inválido');
    }

    const requesterRole = req.user.role;
    return await this.usersService.remove(numericId, requesterRole);
  }


}
