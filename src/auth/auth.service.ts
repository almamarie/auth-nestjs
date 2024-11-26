import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Gender, Roles } from "../../types";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService
  ) {}
  async signup(dto: AuthDto, role = Roles.STUDENT) {
    try {
      if (!Gender[dto.gender]) {
        throw new ForbiddenException({
          message: "Invalid gender field",
          status: 400,
        });
      }
      const hash = await argon.hash(dto.password);

      const userDto = dto;
      delete userDto.password;
      const user = await this.prisma.user.create({
        data: { ...userDto, passwordHash: hash, role },
      });

      return this.signToken(user.id, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ForbiddenException("Credentials taken");
        }
      }
      throw new Error(error);
    }
  }

  async signin(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (!user) {
      throw new ForbiddenException("Credentials incorrect");
    }

    if (!(await argon.verify(user.passwordHash, dto.password))) {
      throw new ForbiddenException("Credentials incorrect");
    }

    return this.signToken(user.id, user.email);
  }

  async signToken(
    userId: number,
    email: string
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };
    const token = await this.jwt.signAsync(payload, {
      expiresIn: "1h",
      secret: this.config.get("JWT_SECRET"),
    });
    return { access_token: token };
  }
}
