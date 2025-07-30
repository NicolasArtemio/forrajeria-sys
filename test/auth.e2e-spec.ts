// test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { BcryptHelper } from '../src/common/helpers/bcrypt.helper';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Si usas pipes globales o middleware, agregar acá
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix('forrajeria/sys/v1');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/autenticacion/iniciar-sesion (POST) debe devolver un token si login es correcto', () => {
    const loginDto = { username: 'admin', password: 'admin12345' };

    return request(app.getHttpServer())
      .post('/autenticacion/iniciar-sesion')
      .send(loginDto)
      .expect(200) // tu endpoint responde 200
      .expect(res => {
        expect(res.body).toHaveProperty('access_token');
      });
  });

  it('/autenticacion/iniciar-sesion (POST) debe fallar si la contraseña es incorrecta', () => {
    return request(app.getHttpServer())
      .post('/autenticacion/iniciar-sesion')
      .send({ username: 'usuario_valido', password: 'contrasena_incorrecta' })
      .expect(401)
      .expect(res => {
        expect(res.body.message).toBeDefined();
      });
  });
});

describe('AuthService - signIn', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;

  beforeEach(() => {
    usersService = {
      findByUsername: jest.fn()
    };
    jwtService = {
      signAsync: jest.fn()
    };
    authService = new AuthService(usersService as any, jwtService as any);
  });

  it('debe devolver token y usuario si login es correcto', async () => {
    const mockUser = { id: 1, username: 'admin', role: 'admin', password: 'hashedPassword' };
    (usersService.findByUsername as jest.Mock).mockResolvedValue(mockUser);
    (BcryptHelper.comparePassword as jest.Mock) = jest.fn().mockResolvedValue(true);
    (jwtService.signAsync as jest.Mock).mockResolvedValue('token123');

    const result = await authService.signIn({ username: 'admin', password: 'admin12345' });

    expect(result).toEqual({
      access_token: 'token123',
      user: { username: 'admin', role: 'admin' }
    });
  });

  it('debe lanzar UnauthorizedException si usuario no existe', async () => {
    (usersService.findByUsername as jest.Mock).mockResolvedValue(null);

    await expect(authService.signIn({ username: 'noUser', password: '1234' })).rejects.toThrow(UnauthorizedException);
  });

  it('debe lanzar UnauthorizedException si contraseña es incorrecta', async () => {
    const mockUser = { id: 1, username: 'admin', role: 'admin', password: 'hashedPassword' };
    (usersService.findByUsername as jest.Mock).mockResolvedValue(mockUser);
    (BcryptHelper.comparePassword as jest.Mock) = jest.fn().mockResolvedValue(false);

    await expect(authService.signIn({ username: 'admin', password: 'wrongPass' })).rejects.toThrow(UnauthorizedException);
  });
});

describe('AuthController - password reset (e2e)', () => {
  let app: INestApplication;

  const validEmail = 'dumenicolas45@gmail.com';
  const invalidEmail = 'noexiste@dominio.com';
  let resetToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('forrajeria/sys/v1');

    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/autenticacion/solicitar-restablecer-password (POST) - debe enviar token si email es válido', async () => {
    const res = await request(app.getHttpServer())
      .post('/forrajeria/sys/v1/autenticacion/solicitar-restablecer-password')
      .send({ email: validEmail })
      .expect(200);

    console.log('Token recibido en test:', res.body.token);

    expect(res.body.message).toBeDefined();
    expect(typeof res.body.message).toBe('string');

    resetToken = res.body.token;
    expect(resetToken).toBeDefined();
  }, 15000);
  it('/autenticacion/solicitar-restablecer-password (POST) - debe fallar si email no existe', async () => {
    await request(app.getHttpServer())
      .post('/forrajeria/sys/v1/autenticacion/solicitar-restablecer-password')
      .send({ email: invalidEmail })
      .expect(404);
  });

  it('/autenticacion/restablecer-password (POST) - debe resetear password si token válido', async () => {
    const newPassword = 'NuevaPass123!';

    await request(app.getHttpServer())
      .post('/forrajeria/sys/v1/autenticacion/restablecer-password')
      .send({ token: resetToken, newPassword })
      .expect(200);
  });

  it('/autenticacion/restablecer-password (POST) - debe fallar si token inválido', async () => {
    await request(app.getHttpServer())
      .post('/forrajeria/sys/v1/autenticacion/restablecer-password')
      .send({ token: 'token_invalido', newPassword: 'pass' })
      .expect(401);
  });


});