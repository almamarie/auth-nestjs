import { ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto, SigninDto } from "./dto";
import * as argon from "argon2";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Roles } from "../../types";
import { welcomeEmailType } from "./types";
import { EmailService } from "../../src/email/email.service";
import * as crypto from "crypto";
@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private emailService: EmailService
  ) {}
  async signup(dto: AuthDto, role: Roles) {
    try {
      this.logger.log("Creating new user...");
      const hash = await argon.hash(dto.password);

      const userDto = dto;
      delete userDto.frontendBaseUrl;
      delete userDto.password;

      const { activationToken, accountActivationExpires } =
        await this.createAccountActivationToken();

      const user = await this.prisma.user.create({
        data: {
          ...userDto,
          passwordHash: hash,
          role,
          accountActivationExpires,
          accountActivationToken: activationToken,
        },
      });

      await this.sendWelcomeEmail(
        {
          firstName: dto.firstName,
          activationUrl: `${dto.frontendBaseUrl}/${activationToken}`,
        },
        dto.email
      );

      this.logger.log("Done creating new user.");

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

  async signin(dto: SigninDto) {
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

  private async sendWelcomeEmail(
    emailData: welcomeEmailType,
    userEmail: string
  ): Promise<void> {
    this.logger.log(`Sending new user email to ${userEmail}...`);
    try {
      await this.emailService.sendMail({
        // from: "noreply@techopp.com",
        to: userEmail,
        template: "./new-user",
        subject: `Welcome ${emailData.firstName} to Tech Opp`,
        context: emailData,
      });
      this.logger.log(`Email successfully sent to ${userEmail}.`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${userEmail}: ${error}`);
      throw new ForbiddenException("Failed to send new user email.", error);
    }
  }

  private async createAccountActivationToken(): Promise<{
    activationToken: string;
    accountActivationExpires: Date;
  }> {
    this.logger.log("Creating account activation token...");
    const activationToken = crypto.randomBytes(32).toString("hex");

    const accountActivationToken = crypto
      .createHash("sha256")
      .update(activationToken)
      .digest("hex");

    this.logger.log(
      {
        activationToken,
        "this.account activation": accountActivationToken,
      }
      // this.passwordResetToken
    );

    const accountActivationExpires = new Date(Date.now() + 60 * 60 * 1000); // days * mins * hrs * miliseconds

    this.logger.log("Done!");
    return {
      activationToken,
      accountActivationExpires,
    };
  }
}
