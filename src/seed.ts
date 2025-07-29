import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);


  const username = process.env.SEED_ADMIN_USERNAME;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const email = process.env.SEED_ADMIN_EMAIL;
  const phone = process.env.SEED_ADMIN_PHONE;

  try {

    if (!username || !password || !email || !phone) {
      throw new Error('Faltan variables de entorno necesarias para crear el admin.');
    }


    await usersService.createAdminIfNotExists({
      username,
      password,
      email,
      phone,
    });

    logger.log('✅ Usuario admin creado o ya existía');
  } catch (error) {
    logger.warn(`⚠️ Seed no pudo crear el admin: ${error.message}`);
  } finally {
    await app.close();
  }
}

bootstrap();
