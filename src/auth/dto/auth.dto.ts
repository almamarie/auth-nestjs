import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Gender } from "types/types";

export class AuthDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  otherNames: string;

  @IsString()
  @IsNotEmpty()
  birthdate: string;

  @IsIn(["MALE", "FEMALE"])
  @IsNotEmpty()
  gender: Gender;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  address: string;

  @IsString()
  @IsOptional()
  profilePicture: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  frontendBaseUrl: string;
}

export class SigninDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
