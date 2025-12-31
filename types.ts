
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum SubscriptionFrequency {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

export enum Category {
  FOOD = 'Yemek',
  TRANSPORT = 'Ulaşım',
  SHOPPING = 'Alışveriş',
  ENTERTAINMENT = 'Eğlence',
  HEALTH = 'Sağlık',
  BILL = 'Fatura',
  OTHER = 'Diğer',
  INCOME_SALARY = 'Maaş',
  INCOME_FREELANCE = 'Freelance',
  INCOME_GIFT = 'Hediye/Diğer'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  category: Category;
  description: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: SubscriptionFrequency;
  lastPaymentDate: string;
  isActive: boolean;
}

export interface Budget {
  category: Category;
  limit: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
}

export interface UserProfile {
  currency: string;
  startingBalance: number;
}
