
import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

import {
  ApplicationDocumentStatus,
} from '../entities/application-document.entity.js';

export class ChangeDocumentStatusDto {
  @IsEnum(ApplicationDocumentStatus)
  status: ApplicationDocumentStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}
