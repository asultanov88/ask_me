import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateIf
} from 'class-validator';

export class ProviderSearch {
  @ValidateIf(
    (val) =>
      val.searchKeyword === null ||
      val.searchKeyword === undefined ||
      val.searchKeyword?.trim() === ''
  )
  @IsInt()
  @IsNotEmpty()
  lkCategoryId: number;

  @ValidateIf(
    (val) =>
      val.lkCategoryId === null ||
      val.lkCategoryId === undefined ||
      val.lkCategoryId === 0
  )
  @IsString()
  @IsNotEmpty()
  searchKeyword: string;
}

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
  @IsArray()
  @ArrayNotEmpty()
  // Array of LkWeedDayId.
  availableDays: number[];

  @IsNotEmpty()
  workHours: WorkHourSchedule;

  // Array if LkCategoryIds.
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  category: number[];
}

export class SelectProvider {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  providerId: number;
}

export interface ProviderClient {
  clientId: number;
  clientUserId: number;
  firstName: string;
  lastName: string;
  email: string;
  newMessageCount: number;
}

export interface ClientProvider {
  clientProviderId;
  providerId: number;
  providerUserId: number;
  firstName: string;
  lastName: string;
  email: string;
  companyname: string;
  address: string;
  phoneNumber: string;
  description: string;
  newMessageCount: number;
}

export interface ProviderDetailsResult {
  providerId: number;
  providerUserId: number;
  firstName: string;
  lastName: string;
  email: string;
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
