import { AuthDto, SigninDto } from "../../src/auth/dto";

export const TestSignupDto: AuthDto = {
  email: "alouismariea97@gmail.com",
  password: "password",
  firstName: "Henry",
  lastName: "Newman",
  otherNames: "",
  birthdate: "11-04-1994",
  gender: "MALE",
  country: "Ghana",
  phoneNumber: "233557263957",
  address: "123 Ave, Kanton Street, UB-0034-2648",
  profilePicture:
    "https://a.storyblok.com/f/191576/1200x800/a3640fdc4c/profile_picture_maker_before.webp",
  frontendBaseUrl: "http://localhost:3000/activat-account",
};

export const TestSigninDto: SigninDto = {
  email: "test@email.com",
  password: "password",
};
