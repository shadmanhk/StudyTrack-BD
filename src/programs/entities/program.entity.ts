
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

import { University } from '../../universities/entities/university.entity.js';

export enum DegreeLevel {
  BACHELORS = 'BACHELORS',
  MASTERS = 'MASTERS',
  PHD = 'PHD',
  OTHER = 'OTHER',
}

@Entity('programs')
@Unique(['university', 'name', 'degreeLevel'])
export class Program {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => University, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'university_id' })
  university: University;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({
    name: 'degree_level',
    type: 'enum',
    enum: DegreeLevel,
  })
  degreeLevel: DegreeLevel;

  @Column({
    name: 'field_of_study',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  fieldOfStudy: string | null;

  @Column({
    name: 'language_of_instruction',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  languageOfInstruction: string | null;

  @Column({ name: 'duration_months', type: 'integer', nullable: true })
  durationMonths: number | null;

  @Column({ name: 'official_url', type: 'varchar', length: 255, nullable: true })
  officialUrl: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
