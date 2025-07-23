import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

export class UpdateUserSelfDto {

    @IsOptional()
    @IsString()
    @Length(8, 12)
    @Transform(({ value }) => value.trim())
    password: string;

    @IsOptional()
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    @Matches(/^[0-9]+$/)
    @Length(10, 15)
    phone: string;
}