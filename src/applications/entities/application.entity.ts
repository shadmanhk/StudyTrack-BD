
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity.js';
import { Program } from '../../programs/entities/program.entity.js';

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  PLANNING = 'PLANNING',
  DOCUMENTS_PENDING = 'DOCUMENTS_PENDING',
  READY_TO_SUBMIT = 'READY_TO_SUBMIT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  APPOINTMENT_SCHEDULED = 'APPOINTMENT_SCHEDULED',
}

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @ManyToOne(() => Program, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assigned_counselor_id' })
  assignedCounselor: User | null;

  @Column({ name: 'intake_term', type: 'varchar', length: 50, nullable: true })
  intakeTerm: string | null;

  @Column({ name: 'intake_year', type: 'integer', nullable: true })
  intakeYear: number | null;

@Column({
  type: 'enum',
  enum: ApplicationStatus,
  enumName: 'application_status_enum',
  default: ApplicationStatus.DRAFT,
})
  status: ApplicationStatus;

  @Column({
    name: 'application_reference',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  applicationReference: string | null;

  @Column({ name: 'applied_at', type: 'timestamp', nullable: true })
  appliedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
