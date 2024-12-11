import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  AuthDto,
  ForgotPasswordDto,
  SigninDto,
  UpdatePasswordDto,
} from "./dto";
import * as argon from "argon2";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Roles } from "../../types";
import { welcomeEmailType } from "./types";
import { EmailService } from "../../src/email/email.service";
import * as crypto from "crypto";
import { User } from "@prisma/client";
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

      const {
        activationToken,
        accountActivationToken,
        accountActivationExpires,
      } = await this.createAccountActivationToken();

      const user = await this.prisma.user.create({
        data: {
          ...userDto,
          passwordHash: hash,
          role,
          accountActivationExpires,
          accountActivationToken,
        },
      });

      // await this.sendWelcomeEmail(
      //   {
      //     firstName: dto.firstName,
      //     activationUrl: `${dto.frontendBaseUrl}/${activationToken}`,
      //   },
      //   dto.email
      // );

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

  async activateAccount(token: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    this.logger.log(`Hashed token: ${hashedToken}\nToken: ${token}`);

    const user = await this.prisma.user.findFirst({
      where: {
        accountActivationToken: hashedToken,
        accountActivationExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) throw new BadRequestException("Token is invalid or has expired");

    if (!user.accountIsActivated) {
      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          accountIsActivated: true,
          accountActivationToken: undefined,
          accountActivationExpires: undefined,
          accountActivatedAt: new Date(Date.now()),
        },
      });
    }

    this.logger.log("Account activated.");
    return { message: "Account activated." };
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

  async forgotPassword(dto: ForgotPasswordDto) {
    this.logger.log("Forgot password called...");

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const resetToken = await this.createPasswordResetToken(user.id);

    const resetURL = `${dto.resetUrl}/${resetToken}`;

    this.logger.log("Sending password reset email...");
    // await this.sendPasswordResetEmail(user, resetURL);

    return {
      status: "success",
      message: "Token sent to email!",
    };
  }

  async updatePassword(
    dto: UpdatePasswordDto,
    user: User
  ): Promise<{ access_token: string }> {
    if (!(await argon.verify(user.passwordHash, dto.currentPassword))) {
      throw new UnauthorizedException("Invalid Credentials");
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException("Passwords do not match");
    }

    const hash = await argon.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash },
    });

    return this.signToken(user.id, user.email);
  }

  private async signToken(
    userId: number,
    role: string
  ): Promise<{ access_token: string }> {
    this.logger.log("generating jwt...");
    const duration = 60 * 60 * this.config.get<number>("JWT_DURATION");

    const payload = {
      sub: userId,
      iss: "https://sellz-backend.com",
      aud: "https://sellz.com",
      exp: Math.floor(Date.now() / 1000) + duration,
      iat: Math.floor(Date.now() / 1000),
      role: role,
    };

    const token = await this.jwt.signAsync(payload, {
      secret: this.config.get("JWT_SECRET"),
    });

    this.logger.log("Done generating jwt.");

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
    accountActivationToken: string;
    accountActivationExpires: Date;
  }> {
    this.logger.log("Creating account activation token...");
    const activationToken = crypto.randomBytes(32).toString("hex");

    const accountActivationToken = crypto
      .createHash("sha256")
      .update(activationToken)
      .digest("hex");

    this.logger.log({
      activationToken,
      "this.account activation": accountActivationToken,
    });

    const accountActivationExpires = new Date(Date.now() + 60 * 60 * 1000); // days * mins * hrs * miliseconds

    this.logger.log("Done!");
    return {
      activationToken,
      accountActivationToken,
      accountActivationExpires,
    };
  }

  private async createPasswordResetToken(id: number): Promise<string> {
    this.logger.log("Creating password reset token...");
    const resetToken = crypto.randomBytes(32).toString("hex");

    const passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { id },
      data: {
        passwordResetToken,
        passwordResetExpires,
      },
    });

    this.logger.log(
      `{\n  resetToken: ${resetToken}\n passwordResetToken: ${passwordResetToken}\n}`
    );

    this.logger.log("Done!");
    return resetToken;
  }

  private async sendPasswordResetEmail(user: User, resetUrl: string) {
    this.logger.log("Sending password reset email...");
    try {
      await this.emailService.sendMail({
        subject: "Reset your password",
        to: user.email,
        template: "./reset-password.hbs",
        context: {
          firstName: user.firstName,
          resetUrl,
          year: "2024",
        },
      });
    } catch (error) {
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: undefined,
          passwordResetExpires: undefined,
        },
      });

      this.logger.error("Error sending password reset email!", error);
      throw new ForbiddenException(error);
    }
  }
}
