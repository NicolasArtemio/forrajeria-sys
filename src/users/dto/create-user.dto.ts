import { Transform } from "class-transformer";
import { IsBoolean, IsEmail, IsOptional, IsString, Length, Matches, MaxLength, MinLength } from "class-validator";

export class RegisterDto {

    @IsString()
    @MaxLength(10)
    @MinLength(4)
    @Transform(({ value }) => value.trim())
    username: string;

    @IsString()
    @MaxLength(12)
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
