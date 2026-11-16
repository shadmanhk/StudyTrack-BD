
import {
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateApplicationDocumentDto {
  @IsOptional()
  @IsString()
  remarks?: string;
}
