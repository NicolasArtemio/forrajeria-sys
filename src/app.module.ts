import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
     TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'admin',
      database: 'forrajeria_sys',
      autoLoadEntities:true,
      synchronize: true,
    }),
     UsersModule,
     AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
