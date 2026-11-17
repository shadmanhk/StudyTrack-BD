import { IsUUID } from 'class-validator';

export class AssignCounselorDto {
  @IsUUID()
  counselorId: string;
}