
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Application } from '../../applications/entities/application.entity.js';
import { ApplicationStatus } from '../../applications/entities/application.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('status_history')
export class StatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Application, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({
    name: 'previous_status',
    type: 'enum',
    enum: ApplicationStatus,
    enumName: 'application_status_enum',
    nullable: true,
  })
  previousStatus: ApplicationStatus | null;

  @Column({
    name: 'new_status',
    type: 'enum',
    enum: ApplicationStatus,
    enumName: 'application_status_enum',
  })
  newStatus: ApplicationStatus;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'changed_by_user_id' })
  changedBy: User;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamp' })
  changedAt: Date;
}
