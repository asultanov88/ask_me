import { IsNotEmpty } from 'class-validator';

export class ProviderDetails {
  @IsNotEmpty()
  companyName: string;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  phoneNumber: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  // Array of LkWeedDayId.
  availableDays: number[];

  @IsNotEmpty()
  workHours: WorkHourSchedule;

  // Array if LkCategoryIds.
  @IsNotEmpty()
  category: number[];
}

export interface ProviderDetailsResult {
  companyName: string;
  address: string;
  phoneNumber: string;
  description: string;
  workHours: string;
}

export interface WorkHourSchedule {
  fromWorkHourId: number;
  toWorkHourId: number;
}

export interface LkWeekDay {
  lkWeekDayId: number;
  weekDay: string;
}

export interface LkWorkHour {
  lkWorkHourId: number;
  workHour: string;
}

export interface LkProviderCategory {
  lkCategoryId: number;
  name: string;
}
