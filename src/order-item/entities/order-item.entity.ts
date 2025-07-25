// src/order/entities/order-item.entity.ts

import { Order } from 'src/order/entities/order.entity';
import { Product } from 'src/products/entities/product.entity';
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';


@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, order => order.items)
  pedido: Order;

  @ManyToOne(() => Product, product => product.items)
  product: Product;

  @Column()
  cantidad: number;

  @Column('decimal')
  precioUnitario: number;
}
