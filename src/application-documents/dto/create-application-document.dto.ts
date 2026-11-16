
import {
  IsBoolean,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateApplicationDocumentDto {
  @IsUUID()
  documentTypeId: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}
