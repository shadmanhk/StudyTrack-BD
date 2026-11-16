
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { DocumentCategory } from '../entities/document-type.entity.js';

export class CreateDocumentTypeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsEnum(DocumentCategory)
  category: DocumentCategory;

  @IsOptional()
  @IsString()
  description?: string;
}
