import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

declare const module: any;

async function bootstrap() {
  let app = null;
  if (process.env.HTTPS_CERTS === 'localhost') {
    const fs = require('fs');
    const keyFile = fs.readFileSync(process.env.KEY_PATH);
    const certFile = fs.readFileSync(process.env.CERT_PATH);

    app = await NestFactory.create(AppModule, {
      httpsOptions: {
        key: keyFile,
        cert: certFile
      }
    });
  } else {
    app = await NestFactory.create(AppModule);
  }

  app.enableCors();
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  console.log('Listening on port:' + process.env.PORT || 8080);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
