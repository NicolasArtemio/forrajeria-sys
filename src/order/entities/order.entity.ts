import { OrderItem } from 'src/order-item/entities/order-item.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';


@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  fecha: Date;

  @Column({ default: 'pendiente' }) // pendiente, en camino, entregado
  estado: string;

  @Column('decimal', { default: 0 })
  total: number;

  @ManyToOne(() => User, user => user.pedidos)
  client: User;

  @OneToMany(() => OrderItem, item => item.pedido, { cascade: true })
  items: OrderItem[];
}