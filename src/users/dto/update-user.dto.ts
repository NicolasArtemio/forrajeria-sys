import { PartialType } from '@nestjs/mapped-types';
import { RegisterDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(RegisterDto) {}
