
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { generateToken } from '../src/helpers/generate-token';
import { UserRole } from '../src/common/enums/user-role.enum';


describe('UsersController (e2e)', () => {
  let app: INestApplication;
  const PREFIX = '/forrajeria/sys/v1/usuarios';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('forrajeria/sys/v1');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Tokens generados con helper (simula usuarios con id y role)
  async function obtenerTokenAdmin() {
    return generateToken({ sub: 1, username: 'admin', role: UserRole.ADMIN });
  }

  async function obtenerTokenOwner() {
    return generateToken({ sub: 3, username: 'forrajeria', role: UserRole.OWNER });
  }

  async function obtenerTokenCustomer() {
    return generateToken({ sub: 2, username: 'nicolas', role: UserRole.CUSTOMER });
  }

  it('POST /usuarios - debe crear un usuario', () => {
    const dto = {
      username: 'nsd3s4',
      password: 'pas24422',
      email: 'nuev334e@usuario.com',
      phone: '1234567890',
      isActive: true,
      address: 'Calle Falsa 123',
      city: 'Springfield',
      location: 'Centro',
    };

    return request(app.getHttpServer())
      .post(PREFIX)
      .send(dto)
      .expect(HttpStatus.CREATED)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.username).toBe(dto.username);
      });
  });

  it('POST /usuarios/crear-owner - solo admin puede crear owner', async () => {
    const tokenAdmin = await obtenerTokenAdmin();
    const dto = {
      username: 'ownrr33',
      password: 'owner1234',
      email: 'ow2rsse@empresa.com',
      phone: '12345678901',
      isActive: true,
      address: 'Avenida Siempre Viva 742',
      city: 'Capital',
      location: 'Zona Centro',
    };

    // Correcto con admin
    await request(app.getHttpServer())
      .post(`${PREFIX}/crear-owner`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(dto)
      .expect(HttpStatus.CREATED);

    // Fallo sin token
    await request(app.getHttpServer())
      .post(`${PREFIX}/crear-owner`)
      .send(dto)
      .expect(HttpStatus.UNAUTHORIZED);

    // Fallo con token de otro rol
    const tokenCustomer = await obtenerTokenCustomer();
    await request(app.getHttpServer())
      .post(`${PREFIX}/crear-owner`)
      .set('Authorization', `Bearer ${tokenCustomer}`)
      .send(dto)
      .expect(HttpStatus.FORBIDDEN);
  });

  it('GET /usuarios - lista usuarios, solo owner/admin', async () => {
    const tokenOwner = await obtenerTokenOwner();

    await request(app.getHttpServer())
      .get(PREFIX)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });

    const tokenCustomer = await obtenerTokenCustomer();
    await request(app.getHttpServer())
      .get(PREFIX)
      .set('Authorization', `Bearer ${tokenCustomer}`)
      .expect(HttpStatus.FORBIDDEN);
  });

  it('GET /usuarios/:id - cliente puede acceder solo a su propio usuario', async () => {
    const tokenCustomer = await obtenerTokenCustomer();

    // cliente accede a sí mismo (id 3)
    await request(app.getHttpServer())
      .get(`${PREFIX}/2`)
      .set('Authorization', `Bearer ${tokenCustomer}`)
      .expect(HttpStatus.OK);

    // cliente intenta acceder a otro usuario (id 2)
    await request(app.getHttpServer())
      .get(`${PREFIX}/1`)
      .set('Authorization', `Bearer ${tokenCustomer}`)
      .expect(HttpStatus.FORBIDDEN);
  });

  it('PATCH /usuarios/:id - actualizar usuario con validación y roles', async () => {
    const tokenAdmin = await obtenerTokenAdmin();
    const tokenCustomer = await obtenerTokenCustomer();

    // Admin actualiza usuario id 2
    await request(app.getHttpServer())
      .patch(`${PREFIX}/2`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ username: 'pochito' })
      .expect(HttpStatus.OK);

    // Customer actualiza su perfil (id 2)
    await request(app.getHttpServer())
      .patch(`${PREFIX}/2`)
      .set('Authorization', `Bearer ${tokenCustomer}`)
      .send({ username: 'custome2' })
      .expect(HttpStatus.OK);

    // Customer intenta actualizar otro usuario (id 2)
    await request(app.getHttpServer())
      .patch(`${PREFIX}/1`)
      .set('Authorization', `Bearer ${tokenCustomer}`)
      .send({ username: 'failUpdate' })
      .expect(HttpStatus.FORBIDDEN);

    // Invalid ID
    await request(app.getHttpServer())
      .patch(`${PREFIX}/notanumber`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ username: 'failUpdate' })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('DELETE /usuarios/me - eliminar propia cuenta', async () => {
    const tokenCustomer = await obtenerTokenCustomer();

    await request(app.getHttpServer())
      .delete(`${PREFIX}/me`)
      .set('Authorization', `Bearer ${tokenCustomer}`)
      .expect(HttpStatus.OK);
  });

  it('DELETE /usuarios/:id - solo admin/owner pueden eliminar usuarios', async () => {
    const tokenAdmin = await obtenerTokenAdmin();
    const tokenOwner = await obtenerTokenOwner();
    const tokenCustomer = await obtenerTokenCustomer();

    // Admin elimina usuario 10
    await request(app.getHttpServer())
      .delete(`${PREFIX}/4`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(HttpStatus.OK);

    // Owner elimina usuario 3
    await request(app.getHttpServer())
      .delete(`${PREFIX}/5`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .expect(HttpStatus.OK);

    // Customer intenta eliminar usuario 9
    await request(app.getHttpServer())
      .delete(`${PREFIX}/1`)
      .set('Authorization', `Bearer ${tokenCustomer}`)
      .expect(HttpStatus.FORBIDDEN);

    // ID inválido
    await request(app.getHttpServer())
      .delete(`${PREFIX}/abc`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(HttpStatus.BAD_REQUEST);
  });
});

