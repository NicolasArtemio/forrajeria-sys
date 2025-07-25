import { UserRole } from "src/common/enums/user-role.enum";
import { Order } from "src/order/entities/order.entity";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    username: string;

    @Column()
    password: string;

    @Column({ unique: true })
    email: string;

    @Column()
    phone: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ type: "enum", enum: UserRole, default: UserRole.CLIENT })
    role: UserRole;

    
  @OneToMany(() => Order, order => order.client)
  pedidos: Order[];
}
