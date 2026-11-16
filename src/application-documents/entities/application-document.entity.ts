
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

import { Application } from '../../applications/entities/application.entity.js';
import { DocumentType } from '../../document-types/entities/document-type.entity.js';

export enum ApplicationDocumentStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

@Entity('application_documents')
@Unique(['application', 'documentType'])
export class ApplicationDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Application, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @ManyToOne(() => DocumentType, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'document_type_id' })
  documentType: DocumentType;

  @Column({ name: 'is_required', type: 'boolean', default: true })
  isRequired: boolean;

  @Column({
    type: 'enum',
    enum: ApplicationDocumentStatus,
    default: ApplicationDocumentStatus.PENDING,
  })
  status: ApplicationDocumentStatus;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
