import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, user => user.customerProfile)
  user: User;

  @Column({ length: 100 })
  address: string;

  @Column({ length: 50 })
  city: string;

  @Column({ length: 50, nullable: true })
  location?: string;

  @CreateDateColumn()
  createdAt: Date;
}
