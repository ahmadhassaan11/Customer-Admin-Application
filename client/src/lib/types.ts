// Frontend specific types

export interface UserProfile {
  id: number;
  username: string;
  isAdmin: boolean;
}

export interface MetricsData {
  activeUsers: number;
  totalReports: number;
  availableCredits: number;
  recentTransactions: Transaction[];
  topAccounts: {
    name: string;
    reports: number;
    creditsUsed: number;
  }[];
  expiringSubscriptions: {
    accountName: string;
    product: string;
    expirationDate: string;
    remainingCredits: number;
  }[];
}

export interface AccountMetrics {
  activeUsers: number;
  reportsPerUser: {
    userId: number;
    firstName: string;
    lastName: string;
    reportCount: number;
  }[];
  totalReports: number;
  remainingCredits: number;
  creditsPerUser: {
    userId: number;
    firstName: string;
    lastName: string;
    creditsUsed: number;
  }[];
  spending: {
    period1: number;
    period2: number;
  };
}

export interface Transaction {
  id: number;
  accountName: string;
  userName: string;
  type: 'Purchase' | 'Report' | 'Expiration';
  credits: number;
  date: string;
}

export interface Account {
  id: number;
  name: string;
  type: string;
  status: string;
  creationTs: string;
  updateTs?: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  contactInfo: string;
  isActive: boolean;
  creationTs: string;
  lastUpdateTs?: string;
  contacts?: Contact[];
}

export interface Contact {
  userId: number;
  contactType: string;
  contactNote?: string;
  contact: string;
}

export interface AccountUser {
  userId: number;
  accountId: number;
  accountRole: string;
  user: User;
}

export interface Product {
  id: number;
  name: string;
  currentVersion?: string;
  creationDate: string;
  updateDate?: string;
}

export interface ProductOffering {
  id: number;
  name: string;
  description?: string;
  ratePerCredit: number;
  productId: number;
}

export interface Subscription {
  id: number;
  accountId: number;
  productId: number;
  productOfferingId: number;
  credits: number;
  startingTs: string;
  expirationTs?: string;
}

export interface UserSubscription {
  subscriptionId: number;
  authorizedUser: number;
}

export interface SubscriptionTransaction {
  id: number;
  subscriptionId: number;
  creditAdd?: number;
  creditSubtract?: number;
  authorizingUserId: number;
  transactionTs: string;
}

export interface Report {
  id: number;
  name: string;
  description?: string;
  creationTs: string;
  knowledgeBaseVersion?: string;
  reportCostInCredits: number;
}

export interface UserReport {
  userId: number;
  reportId: number;
  isOwner: boolean;
  canShare: boolean;
}

export interface ReportTransaction {
  reportId: number;
  transactionId: number;
}

export interface AuthUser {
  id: number;
  username: string;
  userId: number;
  isAdmin: boolean;
}
