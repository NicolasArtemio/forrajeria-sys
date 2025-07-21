import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";

export class CreateUserDto {

    @IsString()
    username:string;

    @IsString()
    password:string;

    @IsEmail()
    email: string;

    @IsString()
    phone:string;

    @IsOptional()
    @IsBoolean()
    isActive: boolean;

}
