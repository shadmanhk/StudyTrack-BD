
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DocumentCategory {
  IDENTITY = 'IDENTITY',
  ACADEMIC = 'ACADEMIC',
  LANGUAGE = 'LANGUAGE',
  FINANCIAL = 'FINANCIAL',
  APPLICATION = 'APPLICATION',
  OTHER = 'OTHER',
}

@Entity('document_types')
export class DocumentType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  name: string;

  @Column({
    type: 'enum',
    enum: DocumentCategory,
  })
  category: DocumentCategory;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
