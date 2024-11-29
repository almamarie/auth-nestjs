import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, SigninDto } from "./dto";
import { Roles } from "../../types";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("signup/student")
  studentSignup(@Body() dto: AuthDto) {
    return this.authService.signup(dto, Roles.STUDENT);
  }

  @Post("signup/course-creator")
  courseCreatorSignup(@Body() dto: AuthDto) {
    return this.authService.signup(dto, Roles.COURSE_CREATOR);
  }

  @HttpCode(HttpStatus.OK)
  @Post("signin")
  signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto);
  }
}
