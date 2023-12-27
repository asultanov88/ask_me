export class ProviderDetailsDto {
  providerDetailsId: number = null;
  providerId: number = null;
  companyName: string = null;
  address: string = null;
  phoneNumber: string = null;
  description: string = null;
}

export class LkWeekDayDto {
  lkWeekDayId: number = null;
  weekDay: string = null;
}

export class LkWorkHourDto {
  lkWeekDayId: number = null;
  weekDay: string = null;
}

export class LkProviderCategoryDto {
  lkCategoryId: number = null;
  name: string = null;
}

export class ProviderWorkHourDto {
  providerWorkHourId: number = null;
  providerId: number = null;
  fromLkWorkHourId: number = null;
  toLkWorkHourId: number = null;
}
