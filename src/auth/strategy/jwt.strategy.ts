import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { logger } from "handlebars";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  private logger = new Logger(PassportStrategy.name);
  constructor(
    config: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get("JWT_SECRET"),
    });
  }
  async validate(payload: { sub: number; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    // delete user.passwordHash;
    if (!user) throw new UnauthorizedException("Unauthorised");
    this.logger.log("User, ", user);
    return user;
  }
}
