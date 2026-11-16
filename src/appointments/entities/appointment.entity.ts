
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Application } from '../../applications/entities/application.entity.js';

export enum AppointmentType {
  EMBASSY_VISA = 'EMBASSY_VISA',
  BIOMETRICS = 'BIOMETRICS',
  INTERVIEW = 'INTERVIEW',
  OTHER = 'OTHER',
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
  MISSED = 'MISSED',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Application, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({
    name: 'appointment_type',
    type: 'enum',
    enum: AppointmentType,
  })
  appointmentType: AppointmentType;

  @Column({
    name: 'embassy_name',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  embassyName: string | null;

  @Column({ type: 'varchar', length: 100 })
  country: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ name: 'appointment_at', type: 'timestamptz' })
  appointmentAt: Date;

  @Column({
    name: 'time_zone',
    type: 'varchar',
    length: 60,
    nullable: true,
  })
  timeZone: string | null;

  @Column({
    name: 'reference_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  referenceNumber: string | null;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
