import * as pactum from "pactum";
import { INestApplication } from "@nestjs/common";
import { PrismaService } from "../src/prisma/prisma.service";
import { AuthDto } from "../src/auth/dto";
import { createTestApp } from "./test-utils";
import { TestSignupDto } from "./utils/test.dtos";

describe("app e2e", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const port: number = 3335;

  beforeAll(async () => {
    const testApp = await createTestApp(port);
    app = testApp.app;
    prisma = testApp.prisma;

    pactum.request.setBaseUrl(`http://localhost:${port}`);
  });

  afterAll(async () => {
    app.close();
  });

  describe("Student", () => {
    const dto: AuthDto = TestSignupDto;

    describe("DTO check", () => {
      it("Should throw if email empty", () => {
        const dataDto = { ...dto };
        delete dataDto.email;
        return pactum
          .spec()
          .post("/auth/signup/student")
          .withBody(dataDto)
          .expectStatus(400);
      });
      it("Should throw if password empty", () => {
        const dataDto = { ...dto };
        delete dataDto.password;
        return pactum
          .spec()
          .post("/auth/signup/student")
          .withBody(dataDto)
          .expectStatus(400);
      });

      it("Should throw if first name empty", () => {
        const dataDto = { ...dto };
        delete dataDto.firstName;
        return pactum
          .spec()
          .post("/auth/signup/student")
          .withBody(dataDto)
          .expectStatus(400);
      });

      it("Should throw if last name empty", () => {
        const dataDto = { ...dto };
        delete dataDto.lastName;
        return pactum
          .spec()
          .post("/auth/signup/student")
          .withBody(dataDto)
          .expectStatus(400);
      });

      it("Should throw if birth date empty", () => {
        const dataDto = { ...dto };
        delete dataDto.birthdate;
        return pactum
          .spec()
          .post("/auth/signup/student")
          .withBody(dataDto)
          .expectStatus(400);
      });

      it("Should throw if gender empty", () => {
        const dataDto = { ...dto };
        delete dataDto.gender;
        return pactum
          .spec()
          .post("/auth/signup/student")
          .withBody(dataDto)
          .expectStatus(400);
      });

      it("Should throw if gender not of type Gender", () => {
        const dataDto = { ...dto, gender: "M" };
        return pactum
          .spec()
          .post("/auth/signup/student")
          .withBody(dataDto)
          .expectStatus(400);
      });

      it("Should throw if country empty", () => {
        const dataDto = { ...dto };
        delete dataDto.country;
        return pactum
          .spec()
          .post("/auth/signup/student")
          .withBody(dataDto)
          .expectStatus(400);
      });

      it("Should throw if no body provided", () => {
        return pactum.spec().post("/auth/signup/student").expectStatus(400);
      });
    });
    describe("Sign up", () => {
      it("Should signup", () => {
        return pactum
          .spec()
          .post("/auth/signup/student")
          .withBody(dto)
          .expectStatus(201);
      });

      it("Should throw error if duplicate user", () => {
        return pactum
          .spec()
          .post("/auth/signup/student")
          .withBody(dto)
          .expectStatus(403);
      });
    });
  });
});
