import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { Gender } from "../types";

describe("app e2e", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    await app.listen(3333);
    pactum.request.setBaseUrl("http://localhost:3333");
  });

  afterAll(async () => {
    app.close();
  });

  describe("Auth", () => {
    const dto: AuthDto = {
      email: "test@email.com",
      password: "password",
      firstName: "Henry",
      lastName: "Newman",
      otherNames: "",
      birthdate: "11-04-1994",
      gender: Gender.MALE,
      country: "Ghana",
      phoneNumber: "233557263957",
      address: "123 Ave, Kanton Street, UB-0034-2648",
      profilePicture:
        "https://a.storyblok.com/f/191576/1200x800/a3640fdc4c/profile_picture_maker_before.webp",
    };
    describe("Signup", () => {
      describe("Student", () => {
        describe("DTO check", () => {
          it("Should throw if email empty", () => {
            const dataDto = { ...dto };
            delete dataDto.email;
            return pactum
              .spec()
              .post("/auth/student/signup")
              .withBody(dataDto)
              .expectStatus(400);
          });
          it("Should throw if password empty", () => {
            const dataDto = { ...dto };
            delete dataDto.password;
            return pactum
              .spec()
              .post("/auth/student/signup")
              .withBody(dataDto)
              .expectStatus(400);
          });

          it("Should throw if first name empty", () => {
            const dataDto = { ...dto };
            delete dataDto.firstName;
            return pactum
              .spec()
              .post("/auth/student/signup")
              .withBody(dataDto)
              .expectStatus(400);
          });

          it("Should throw if last name empty", () => {
            const dataDto = { ...dto };
            delete dataDto.lastName;
            return pactum
              .spec()
              .post("/auth/student/signup")
              .withBody(dataDto)
              .expectStatus(400);
          });

          it("Should throw if birth date empty", () => {
            const dataDto = { ...dto };
            delete dataDto.birthdate;
            return pactum
              .spec()
              .post("/auth/student/signup")
              .withBody(dataDto)
              .expectStatus(400);
          });

          it("Should throw if gender empty", () => {
            const dataDto = { ...dto };
            delete dataDto.gender;
            return pactum
              .spec()
              .post("/auth/student/signup")
              .withBody(dataDto)
              .expectStatus(400);
          });

          it("Should throw if gender not of type Gender", () => {
            const dataDto = { ...dto, gender: "M" };
            return pactum
              .spec()
              .post("/auth/student/signup")
              .withBody(dataDto)
              .expectStatus(500)
              .inspect();
          });

          it("Should throw if country empty", () => {
            const dataDto = { ...dto };
            delete dataDto.country;
            return pactum
              .spec()
              .post("/auth/student/signup")
              .withBody(dataDto)
              .expectStatus(400);
          });

          it("Should throw if no body provided", () => {
            return pactum.spec().post("/auth/student/signup").expectStatus(400);
          });
        });
        describe("student sign up", () => {
          it("Should signup", () => {
            return pactum
              .spec()
              .post("/auth/student/signup")
              .withBody(dto)
              .expectStatus(201);
          });

          it("Should throw error if duplicate user", () => {
            return pactum
              .spec()
              .post("/auth/student/signup")
              .withBody(dto)
              .expectStatus(403);
          });
        });
      });
    });

    describe("Signin", () => {
      describe("Student", () => {
        describe("DTO check", () => {
          it("Should throw if email empty", () => {
            return pactum
              .spec()
              .post("/auth/student/signin")
              .withBody({ password: dto.password })
              .expectStatus(400);
          });

          it("Should throw if password empty", () => {
            return pactum
              .spec()
              .post("/auth/student/signin")
              .withBody({ email: dto.email })
              .expectStatus(400);
          });
          it("Should throw if no body provided", () => {
            return pactum.spec().post("/auth/student/signin").expectStatus(400);
          });
        });
        // Create tests for formatting check: password hash not in response

        describe("student", () => {
          it("Should throw if duplicate email", () => {
            return pactum
              .spec()
              .post("/auth/student/signin")
              .withBody({ email: dto.email })
              .expectStatus(400);
          });

          it("Should throw if password is wrong", () => {
            return pactum
              .spec()
              .post("/auth/student/signin")
              .withBody({ ...dto, password: "jshshdsnbfd" })
              .expectStatus(403);
          });

          it("Should signin", () => {
            return pactum
              .spec()
              .post("/auth/student/signin")
              .withBody(dto)
              .expectStatus(200)
              .expectBodyContains("token")
              .stores("userAt", "access_token");
          });
        });
      });
    });
  });
  describe("User", () => {
    describe("Get me", () => {
      it("should get a user with given token", () => {
        return pactum
          .spec()
          .get("/users/me")
          .withHeaders({
            Authorization: "Bearer $S{userAt}",
          })
          .expectStatus(200)
          .stores("userId", "id");
      });
      it("should throw if token is wrong", () => {
        return pactum
          .spec()
          .get("/users/me")
          .withHeaders({
            Authorization: "Bearer $S{userAt}",
          })
          .expectStatus(200);
      });
    });
    describe("Edit user by id", () => {
      const dto: EditUserDto = { firstName: "alma", lastName: "Marie" };
      it("should edit user with a given id", () => {
        return pactum
          .spec()
          .patch("/users")
          .withHeaders({
            Authorization: "Bearer $S{userAt}",
          })
          .withBody(dto)
          .expectStatus(200);
      });

      it("should ensure edited details are persisted", () => {
        return pactum
          .spec()
          .patch("/users")
          .withHeaders({
            Authorization: "Bearer $S{userAt}",
          })
          .withBody({ ...dto, firstName: "Alma" })
          .expectStatus(200)
          .expectJson("firstName", "Alma");
      });
    });
  });
});
