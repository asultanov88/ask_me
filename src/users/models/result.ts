export interface UserResult {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  isClient: boolean;
  isProvider: boolean;
  provider: Provider;
}

export interface Provider {
  companyName: string;
  address: string;
  phoneNumber: string;
  availableDays: string[];
  workHours: string;
  description: string;
  category: ProviderCategory[];
}

export interface ProviderCategory {
  categoryId: number;
  categoryName: string;
}
