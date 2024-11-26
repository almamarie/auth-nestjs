import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { CatchEverythingFilter } from "./filters/global-error.filters";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  const httpAdapterHost = app.get(HttpAdapterHost);
  const configService = app.get(ConfigService);
  // app.enableCors({
  //   origin: configService.get("FRONTEND_URL"),
  //   credentials: true,
  // });
  if (!httpAdapterHost || !httpAdapterHost.httpAdapter) {
    throw new Error("HttpAdapter not found!");
  }
  app.useGlobalFilters(
    new CatchEverythingFilter(httpAdapterHost, configService)
  );
  await app.listen(3333);
}
bootstrap();
