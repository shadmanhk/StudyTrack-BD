import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
 
export enum UserRole {
  STUDENT = 'STUDENT',
  COUNSELOR = 'COUNSELOR',
  ADMIN = 'ADMIN',
}
 
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
 
  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  fullName: string;
 
  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;
 
  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    select: false,
  })
  passwordHash: string;
 
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;
 
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
 
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
 
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}