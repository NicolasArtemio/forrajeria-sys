import { Transform } from "class-transformer";
import { IsString, MinLength, } from "class-validator";

export class LoginDto {

    @IsString()
    @MinLength(1)
    username: string;

    @IsString()
    @MinLength(8)
    @Transform(({ value }) => value.trim())
    password: string;
}