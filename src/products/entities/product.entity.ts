
import { OrderItem } from 'src/order-item/entities/order-item.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';


@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('decimal')
  price: number;

  @Column()
  availableQuantity: number;

  @OneToMany(() => OrderItem, item => item.product)
  items: OrderItem[];
}