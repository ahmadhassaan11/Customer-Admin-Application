import { db } from "./db";
import { eq, and, gte, lte, sql, desc, count, sum, isNull, or, inArray } from "drizzle-orm";
import * as schema from "@shared/schema";
import bcrypt from "bcrypt";

export interface IStorage {
  // Authentication
  registerUser(username: string, password: string, userId: number): Promise<schema.AuthUser>;
  authenticateUser(username: string, password: string): Promise<schema.AuthUser | null>;
  
  // Account operations
  getAccounts(): Promise<schema.Account[]>;
  getAccount(id: number): Promise<schema.Account | undefined>;
  createAccount(account: schema.InsertAccount): Promise<schema.Account>;
  updateAccount(id: number, account: Partial<schema.InsertAccount>): Promise<schema.Account | undefined>;
  
  // User operations
  getUsers(): Promise<schema.User[]>;
  getUser(id: number): Promise<schema.User | undefined>;
  createUser(user: schema.InsertUser): Promise<schema.User>;
  updateUser(id: number, user: Partial<schema.InsertUser>): Promise<schema.User | undefined>;
  
  // Account User operations
  getAccountUsers(accountId: number): Promise<(schema.AccountUser & { user: schema.User })[]>;
  addUserToAccount(accountUser: schema.InsertAccountUser): Promise<schema.AccountUser>;
  removeUserFromAccount(userId: number, accountId: number, role: string): Promise<void>;
  updateUserRole(userId: number, accountId: number, oldRole: string, newRole: string): Promise<schema.AccountUser | undefined>;
  
  // Product operations
  getProducts(): Promise<schema.Product[]>;
  getProduct(id: number): Promise<schema.Product | undefined>;
  createProduct(product: schema.InsertProduct): Promise<schema.Product>;
  updateProduct(id: number, product: Partial<schema.InsertProduct>): Promise<schema.Product | undefined>;
  
  // Product Offering operations
  getProductOfferings(productId?: number): Promise<schema.ProductOffering[]>;
  getProductOffering(id: number): Promise<schema.ProductOffering | undefined>;
  createProductOffering(offering: schema.InsertProductOffering): Promise<schema.ProductOffering>;
  updateProductOffering(id: number, offering: Partial<schema.InsertProductOffering>): Promise<schema.ProductOffering | undefined>;
  
  // Subscription operations
  getSubscriptions(accountId?: number): Promise<schema.Subscription[]>;
  getSubscription(id: number): Promise<schema.Subscription | undefined>;
  createSubscription(subscription: schema.InsertSubscription): Promise<schema.Subscription>;
  updateSubscription(id: number, subscription: Partial<schema.InsertSubscription>): Promise<schema.Subscription | undefined>;
  
  // User Subscription operations
  getUserSubscriptions(userId?: number): Promise<schema.UserSubscription[]>;
  authorizeUserForSubscription(userSubscription: schema.InsertUserSubscription): Promise<schema.UserSubscription>;
  removeUserFromSubscription(userId: number, subscriptionId: number): Promise<void>;
  
  // Subscription Transaction operations
  getSubscriptionTransactions(subscriptionId?: number): Promise<schema.SubscriptionTransaction[]>;
  createSubscriptionTransaction(transaction: schema.InsertSubscriptionTransaction): Promise<schema.SubscriptionTransaction>;
  
  // Report operations
  getReports(): Promise<schema.Report[]>;
  getReport(id: number): Promise<schema.Report | undefined>;
  createReport(report: schema.InsertReport): Promise<schema.Report>;
  
  // User Report operations
  getUserReports(userId?: number): Promise<schema.UserReport[]>;
  assignReportToUser(userReport: schema.InsertUserReport): Promise<schema.UserReport>;
  
  // Report Transaction operations
  getReportTransactions(): Promise<schema.ReportTransaction[]>;
  createReportTransaction(reportTransaction: schema.InsertReportTransaction): Promise<schema.ReportTransaction>;
  
  // User Contact operations
  getUserContacts(userId: number): Promise<schema.UserContact[]>;
  createUserContact(userContact: Omit<schema.UserContact, 'id'>): Promise<schema.UserContact>;
  
  // Metrics
  getActiveUserCount(accountId?: number, startDate?: Date, endDate?: Date): Promise<number>;
  getReportsPerUser(accountId?: number, startDate?: Date, endDate?: Date): Promise<{ userId: number, firstName: string, lastName: string, reportCount: number }[]>;
  getTotalReports(accountId?: number, startDate?: Date, endDate?: Date): Promise<number>;
  getRemainingCredits(accountId?: number): Promise<number>;
  getCreditsUsedPerUser(accountId?: number, startDate?: Date, endDate?: Date): Promise<{ userId: number, firstName: string, lastName: string, creditsUsed: number }[]>;
  getSpendingComparison(accountId: number, period1Start: Date, period1End: Date, period2Start: Date, period2End: Date): Promise<{ period1: number, period2: number }>;
  getExpiringSubscriptions(daysFromNow: number): Promise<(schema.Subscription & { account: schema.Account, product: schema.Product, offering: schema.ProductOffering })[]>;
}

export class DatabaseStorage implements IStorage {
  // Authentication
  async registerUser(username: string, password: string, userId: number): Promise<schema.AuthUser> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [authUser] = await db.insert(schema.authUsers)
      .values({ username, password: hashedPassword, userId })
      .returning();
    return authUser;
  }
  
  async authenticateUser(username: string, password: string): Promise<schema.AuthUser | null> {
    const [authUser] = await db.select().from(schema.authUsers).where(eq(schema.authUsers.username, username));
    if (!authUser) return null;
    
    const passwordMatch = await bcrypt.compare(password, authUser.password);
    if (!passwordMatch) return null;
    
    return authUser;
  }
  
  // Account operations
  async getAccounts(): Promise<schema.Account[]> {
    return db.select().from(schema.accounts);
  }
  
  async getAccount(id: number): Promise<schema.Account | undefined> {
    const [account] = await db.select().from(schema.accounts).where(eq(schema.accounts.id, id));
    return account;
  }
  
  async createAccount(account: schema.InsertAccount): Promise<schema.Account> {
    const [newAccount] = await db.insert(schema.accounts).values(account).returning();
    return newAccount;
  }
  
  async updateAccount(id: number, account: Partial<schema.InsertAccount>): Promise<schema.Account | undefined> {
    const [updatedAccount] = await db.update(schema.accounts)
      .set({ ...account, updateTs: new Date() })
      .where(eq(schema.accounts.id, id))
      .returning();
    return updatedAccount;
  }
  
  // User operations
  async getUsers(): Promise<schema.User[]> {
    return db.select().from(schema.users);
  }
  
  async getUser(id: number): Promise<schema.User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }
  
  async createUser(user: schema.InsertUser): Promise<schema.User> {
    const [newUser] = await db.insert(schema.users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: number, user: Partial<schema.InsertUser>): Promise<schema.User | undefined> {
    const [updatedUser] = await db.update(schema.users)
      .set({ ...user, lastUpdateTs: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Account User operations
  async getAccountUsers(accountId: number): Promise<(schema.AccountUser & { user: schema.User })[]> {
    return db.select({
      userId: schema.accountUsers.userId,
      accountId: schema.accountUsers.accountId,
      accountRole: schema.accountUsers.accountRole,
      user: schema.users
    })
    .from(schema.accountUsers)
    .where(eq(schema.accountUsers.accountId, accountId))
    .innerJoin(schema.users, eq(schema.accountUsers.userId, schema.users.id));
  }
  
  async addUserToAccount(accountUser: schema.InsertAccountUser): Promise<schema.AccountUser> {
    const [newAccountUser] = await db.insert(schema.accountUsers).values(accountUser).returning();
    return newAccountUser;
  }
  
  async removeUserFromAccount(userId: number, accountId: number, role: string): Promise<void> {
    await db.delete(schema.accountUsers)
      .where(
        and(
          eq(schema.accountUsers.userId, userId),
          eq(schema.accountUsers.accountId, accountId),
          eq(schema.accountUsers.accountRole, role)
        )
      );
  }
  
  async updateUserRole(userId: number, accountId: number, oldRole: string, newRole: string): Promise<schema.AccountUser | undefined> {
    // Delete the old role
    await this.removeUserFromAccount(userId, accountId, oldRole);
    
    // Add the new role
    return this.addUserToAccount({
      userId,
      accountId,
      accountRole: newRole
    });
  }
  
  // Product operations
  async getProducts(): Promise<schema.Product[]> {
    return db.select().from(schema.products);
  }
  
  async getProduct(id: number): Promise<schema.Product | undefined> {
    const [product] = await db.select().from(schema.products).where(eq(schema.products.id, id));
    return product;
  }
  
  async createProduct(product: schema.InsertProduct): Promise<schema.Product> {
    const [newProduct] = await db.insert(schema.products).values(product).returning();
    return newProduct;
  }
  
  async updateProduct(id: number, product: Partial<schema.InsertProduct>): Promise<schema.Product | undefined> {
    const [updatedProduct] = await db.update(schema.products)
      .set({ ...product, updateDate: new Date() })
      .where(eq(schema.products.id, id))
      .returning();
    return updatedProduct;
  }
  
  // Product Offering operations
  async getProductOfferings(productId?: number): Promise<schema.ProductOffering[]> {
    if (productId) {
      return db.select().from(schema.productOfferings).where(eq(schema.productOfferings.productId, productId));
    }
    return db.select().from(schema.productOfferings);
  }
  
  async getProductOffering(id: number): Promise<schema.ProductOffering | undefined> {
    const [offering] = await db.select().from(schema.productOfferings).where(eq(schema.productOfferings.id, id));
    return offering;
  }
  
  async createProductOffering(offering: schema.InsertProductOffering): Promise<schema.ProductOffering> {
    const [newOffering] = await db.insert(schema.productOfferings).values(offering).returning();
    return newOffering;
  }
  
  async updateProductOffering(id: number, offering: Partial<schema.InsertProductOffering>): Promise<schema.ProductOffering | undefined> {
    const [updatedOffering] = await db.update(schema.productOfferings)
      .set(offering)
      .where(eq(schema.productOfferings.id, id))
      .returning();
    return updatedOffering;
  }
  
  // Subscription operations
  async getSubscriptions(accountId?: number): Promise<schema.Subscription[]> {
    if (accountId) {
      return db.select().from(schema.subscriptions).where(eq(schema.subscriptions.accountId, accountId));
    }
    return db.select().from(schema.subscriptions);
  }
  
  async getSubscription(id: number): Promise<schema.Subscription | undefined> {
    const [subscription] = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.id, id));
    return subscription;
  }
  
  async createSubscription(subscription: schema.InsertSubscription): Promise<schema.Subscription> {
    const [newSubscription] = await db.insert(schema.subscriptions).values(subscription).returning();
    return newSubscription;
  }
  
  async updateSubscription(id: number, subscription: Partial<schema.InsertSubscription>): Promise<schema.Subscription | undefined> {
    const [updatedSubscription] = await db.update(schema.subscriptions)
      .set(subscription)
      .where(eq(schema.subscriptions.id, id))
      .returning();
    return updatedSubscription;
  }
  
  // User Subscription operations
  async getUserSubscriptions(userId?: number): Promise<schema.UserSubscription[]> {
    if (userId) {
      return db.select().from(schema.userSubscriptions).where(eq(schema.userSubscriptions.authorizedUser, userId));
    }
    return db.select().from(schema.userSubscriptions);
  }
  
  async authorizeUserForSubscription(userSubscription: schema.InsertUserSubscription): Promise<schema.UserSubscription> {
    const [newUserSubscription] = await db.insert(schema.userSubscriptions).values(userSubscription).returning();
    return newUserSubscription;
  }
  
  async removeUserFromSubscription(userId: number, subscriptionId: number): Promise<void> {
    await db.delete(schema.userSubscriptions)
      .where(
        and(
          eq(schema.userSubscriptions.authorizedUser, userId),
          eq(schema.userSubscriptions.subscriptionId, subscriptionId)
        )
      );
  }
  
  // Subscription Transaction operations
  async getSubscriptionTransactions(subscriptionId?: number): Promise<schema.SubscriptionTransaction[]> {
    if (subscriptionId) {
      return db.select()
        .from(schema.subscriptionTransactions)
        .where(eq(schema.subscriptionTransactions.subscriptionId, subscriptionId))
        .orderBy(desc(schema.subscriptionTransactions.transactionTs));
    }
    return db.select()
      .from(schema.subscriptionTransactions)
      .orderBy(desc(schema.subscriptionTransactions.transactionTs));
  }
  
  async createSubscriptionTransaction(transaction: schema.InsertSubscriptionTransaction): Promise<schema.SubscriptionTransaction> {
    const [newTransaction] = await db.insert(schema.subscriptionTransactions).values(transaction).returning();
    
    // Update subscription credits
    if (transaction.creditAdd || transaction.creditSubtract) {
      const [subscription] = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.id, transaction.subscriptionId));
      
      let newCredits = subscription.credits;
      if (transaction.creditAdd) {
        newCredits += transaction.creditAdd;
      }
      if (transaction.creditSubtract) {
        newCredits -= transaction.creditSubtract;
      }
      
      await db.update(schema.subscriptions)
        .set({ credits: newCredits })
        .where(eq(schema.subscriptions.id, transaction.subscriptionId));
    }
    
    return newTransaction;
  }
  
  // Report operations
  async getReports(): Promise<schema.Report[]> {
    return db.select().from(schema.reports);
  }
  
  async getReport(id: number): Promise<schema.Report | undefined> {
    const [report] = await db.select().from(schema.reports).where(eq(schema.reports.id, id));
    return report;
  }
  
  async createReport(report: schema.InsertReport): Promise<schema.Report> {
    const [newReport] = await db.insert(schema.reports).values(report).returning();
    return newReport;
  }
  
  // User Report operations
  async getUserReports(userId?: number): Promise<schema.UserReport[]> {
    if (userId) {
      return db.select().from(schema.userReports).where(eq(schema.userReports.userId, userId));
    }
    return db.select().from(schema.userReports);
  }
  
  async assignReportToUser(userReport: schema.InsertUserReport): Promise<schema.UserReport> {
    const [newUserReport] = await db.insert(schema.userReports).values(userReport).returning();
    return newUserReport;
  }
  
  // Report Transaction operations
  async getReportTransactions(): Promise<schema.ReportTransaction[]> {
    return db.select().from(schema.reportTransactions);
  }
  
  async createReportTransaction(reportTransaction: schema.InsertReportTransaction): Promise<schema.ReportTransaction> {
    const [newReportTransaction] = await db.insert(schema.reportTransactions).values(reportTransaction).returning();
    return newReportTransaction;
  }
  
  // User Contact operations
  async getUserContacts(userId: number): Promise<schema.UserContact[]> {
    return db.select().from(schema.userContacts).where(eq(schema.userContacts.userId, userId));
  }
  
  async createUserContact(userContact: Omit<schema.UserContact, 'id'>): Promise<schema.UserContact> {
    const [newUserContact] = await db.insert(schema.userContacts).values(userContact).returning();
    return newUserContact;
  }
  
  // Metrics
  async getActiveUserCount(accountId?: number, startDate?: Date, endDate?: Date): Promise<number> {
    let query = db.select({ count: count() })
      .from(schema.users)
      .where(eq(schema.users.isActive, true));
      
    if (accountId) {
      query = query.innerJoin(
        schema.accountUsers,
        eq(schema.users.id, schema.accountUsers.userId)
      ).where(eq(schema.accountUsers.accountId, accountId));
    }
    
    const [result] = await query;
    return result?.count || 0;
  }
  
  async getReportsPerUser(accountId?: number, startDate?: Date, endDate?: Date): Promise<{ userId: number, firstName: string, lastName: string, reportCount: number }[]> {
    let query = db.select({
      userId: schema.users.id,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      reportCount: count(schema.userReports.reportId)
    })
    .from(schema.users)
    .leftJoin(schema.userReports, eq(schema.users.id, schema.userReports.userId))
    .where(eq(schema.users.isActive, true));
    
    if (accountId) {
      query = query.innerJoin(
        schema.accountUsers,
        eq(schema.users.id, schema.accountUsers.userId)
      ).where(eq(schema.accountUsers.accountId, accountId));
    }
    
    if (startDate && endDate) {
      query = query.innerJoin(
        schema.reports,
        eq(schema.userReports.reportId, schema.reports.id)
      ).where(
        and(
          gte(schema.reports.creationTs, startDate),
          lte(schema.reports.creationTs, endDate)
        )
      );
    }
    
    return query.groupBy(schema.users.id, schema.users.firstName, schema.users.lastName);
  }
  
  async getTotalReports(accountId?: number, startDate?: Date, endDate?: Date): Promise<number> {
    let query = db.select({ count: count() }).from(schema.reports);
    
    if (accountId) {
      query = query.innerJoin(
        schema.userReports,
        eq(schema.reports.id, schema.userReports.reportId)
      )
      .innerJoin(
        schema.users,
        eq(schema.userReports.userId, schema.users.id)
      )
      .innerJoin(
        schema.accountUsers,
        eq(schema.users.id, schema.accountUsers.userId)
      )
      .where(eq(schema.accountUsers.accountId, accountId));
    }
    
    if (startDate && endDate) {
      query = query.where(
        and(
          gte(schema.reports.creationTs, startDate),
          lte(schema.reports.creationTs, endDate)
        )
      );
    }
    
    const [result] = await query;
    return result?.count || 0;
  }
  
  async getRemainingCredits(accountId?: number): Promise<number> {
    const query = db.select({ 
      totalCredits: sum(schema.subscriptions.credits) 
    })
    .from(schema.subscriptions)
    .where(
      and(
        or(
          isNull(schema.subscriptions.expirationTs),
          gte(schema.subscriptions.expirationTs, new Date())
        ),
        accountId ? eq(schema.subscriptions.accountId, accountId) : undefined
      )
    );
    
    const [result] = await query;
    return result?.totalCredits || 0;
  }
  
  async getCreditsUsedPerUser(accountId?: number, startDate?: Date, endDate?: Date): Promise<{ userId: number, firstName: string, lastName: string, creditsUsed: number }[]> {
    let query = db.select({
      userId: schema.users.id,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      creditsUsed: sum(schema.subscriptionTransactions.creditSubtract)
    })
    .from(schema.users)
    .leftJoin(
      schema.subscriptionTransactions,
      eq(schema.users.id, schema.subscriptionTransactions.authorizingUserId)
    );
    
    if (accountId) {
      query = query.innerJoin(
        schema.accountUsers,
        eq(schema.users.id, schema.accountUsers.userId)
      )
      .where(eq(schema.accountUsers.accountId, accountId));
    }
    
    if (startDate && endDate) {
      query = query.where(
        and(
          gte(schema.subscriptionTransactions.transactionTs, startDate),
          lte(schema.subscriptionTransactions.transactionTs, endDate)
        )
      );
    }
    
    return query.groupBy(schema.users.id, schema.users.firstName, schema.users.lastName);
  }
  
  async getSpendingComparison(accountId: number, period1Start: Date, period1End: Date, period2Start: Date, period2End: Date): Promise<{ period1: number, period2: number }> {
    // Get transactions for period 1
    const [period1Result] = await db.select({
      total: sum(schema.subscriptionTransactions.creditAdd)
    })
    .from(schema.subscriptionTransactions)
    .innerJoin(
      schema.subscriptions,
      eq(schema.subscriptionTransactions.subscriptionId, schema.subscriptions.id)
    )
    .where(
      and(
        eq(schema.subscriptions.accountId, accountId),
        gte(schema.subscriptionTransactions.transactionTs, period1Start),
        lte(schema.subscriptionTransactions.transactionTs, period1End)
      )
    );
    
    // Get transactions for period 2
    const [period2Result] = await db.select({
      total: sum(schema.subscriptionTransactions.creditAdd)
    })
    .from(schema.subscriptionTransactions)
    .innerJoin(
      schema.subscriptions,
      eq(schema.subscriptionTransactions.subscriptionId, schema.subscriptions.id)
    )
    .where(
      and(
        eq(schema.subscriptions.accountId, accountId),
        gte(schema.subscriptionTransactions.transactionTs, period2Start),
        lte(schema.subscriptionTransactions.transactionTs, period2End)
      )
    );
    
    return {
      period1: period1Result?.total || 0,
      period2: period2Result?.total || 0
    };
  }
  
  async getExpiringSubscriptions(daysFromNow: number): Promise<(schema.Subscription & { account: schema.Account, product: schema.Product, offering: schema.ProductOffering })[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + daysFromNow);
    
    return db.select({
      ...schema.subscriptions,
      account: schema.accounts,
      product: schema.products,
      offering: schema.productOfferings
    })
    .from(schema.subscriptions)
    .innerJoin(
      schema.accounts,
      eq(schema.subscriptions.accountId, schema.accounts.id)
    )
    .innerJoin(
      schema.products,
      eq(schema.subscriptions.productId, schema.products.id)
    )
    .innerJoin(
      schema.productOfferings,
      eq(schema.subscriptions.productOfferingId, schema.productOfferings.id)
    )
    .where(
      and(
        gte(schema.subscriptions.expirationTs, now),
        lte(schema.subscriptions.expirationTs, future)
      )
    )
    .orderBy(schema.subscriptions.expirationTs);
  }
}

export const storage = new DatabaseStorage();
