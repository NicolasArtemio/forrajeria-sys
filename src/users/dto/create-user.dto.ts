import { Transform } from "class-transformer";
import { IsBoolean, IsEmail, IsOptional, IsString, Length, Matches, MinLength } from "class-validator";

export class CreateUserDto {

    @IsString()
    @MinLength(1)
    @Transform(({ value }) => value.trim())
    username: string;

    @IsString()
    @MinLength(8)
    @Transform(({ value }) => value.trim())
    password: string;

    @IsEmail()
    email: string;

    @IsString()
    @Matches(/^[0-9]+$/)
    @Length(10, 15)
    phone: string;

    @IsOptional()
    @IsBoolean()
    isActive: boolean;

}
