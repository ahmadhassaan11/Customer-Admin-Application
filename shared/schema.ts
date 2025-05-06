import { pgTable, text, serial, integer, boolean, timestamp, foreignKey, doublePrecision, json, date, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Account Types
export const accountTypes = pgTable("operations.account_type", {
  type: text("type").notNull().unique(),
});

// Account table
export const accounts = pgTable("operations.account", {
  id: serial("account_id").primaryKey(),
  name: text("account_name"),
  type: text("account_type").references(() => accountTypes.type),
  status: text("account_status"),
  creationTs: timestamp("creation_ts").defaultNow(),
  updateTs: timestamp("update_ts"),
});

// Account Insert Schema
export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  creationTs: true,
  updateTs: true,
});

// User table
export const users = pgTable("operations.user", {
  id: serial("user_id").primaryKey(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  contactInfo: text("contact_info"),
  isActive: boolean("is_active").default(true),
  creationTs: timestamp("creation_ts").defaultNow(),
  lastUpdateTs: timestamp("last_update_ts"),
});

// User Insert Schema
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  creationTs: true,
  lastUpdateTs: true,
});

// Account Roles
export const accountRoles = pgTable("operations.account_role", {
  role: text("role").notNull().unique(),
});

// Bridge table to assign users to accounts
export const accountUsers = pgTable("operations.account_user", {
  userId: integer("user_id").notNull().references(() => users.id),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  accountRole: text("account_role").notNull().references(() => accountRoles.role),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.accountId, table.accountRole] }),
  };
});

// Account User Insert Schema
export const insertAccountUserSchema = createInsertSchema(accountUsers);

// Activity Types
export const activityTypes = pgTable("operations.activity", {
  activityType: text("activity_type").notNull().unique(),
});

// User Activity
export const userActivities = pgTable("operations.user_activity", {
  userId: integer("user_id").references(() => users.id),
  activityType: text("activity_type").references(() => activityTypes.activityType),
  creationTs: timestamp("creation_ts"),
  metaData: json("meta_data"),
});

// Contact Types
export const contactTypes = pgTable("customer_data.contact_type", {
  type: text("type").notNull().unique(),
});

// User Contact
export const userContacts = pgTable("customer_data.user_contact", {
  userId: integer("user_id").references(() => users.id),
  contactType: text("contact_type").references(() => contactTypes.type),
  contactNote: text("contact_note"),
  contact: text("contact"),
});

// Products
export const products = pgTable("operations.product", {
  id: serial("product_id").primaryKey(),
  name: text("product_name").notNull(),
  currentVersion: text("current_version"),
  creationDate: date("creation_date").defaultNow(),
  updateDate: date("update_date"),
});

// Product Insert Schema
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  creationDate: true,
  updateDate: true,
});

// Product Offerings
export const productOfferings = pgTable("operations.product_offering", {
  id: serial("offering_id").primaryKey(),
  name: text("offering_name"),
  description: text("offering_description"),
  ratePerCredit: doublePrecision("rate_per_credit").notNull(),
  productId: integer("product_id").references(() => products.id),
});

// Product Offering Insert Schema
export const insertProductOfferingSchema = createInsertSchema(productOfferings).omit({
  id: true,
});

// Subscriptions
export const subscriptions = pgTable("operations.subscription", {
  id: serial("subscription_id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  productId: integer("product_id").notNull().references(() => products.id),
  productOfferingId: integer("product_offering_id").notNull().references(() => productOfferings.id),
  credits: integer("credits").notNull().default(0),
  startingTs: timestamp("starting_ts").defaultNow(),
  expirationTs: timestamp("expiration_ts"),
});

// Subscription Insert Schema
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  startingTs: true,
});

// User Subscriptions
export const userSubscriptions = pgTable("operations.user_subscription", {
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  authorizedUser: integer("authorized_user").references(() => users.id),
});

// User Subscription Insert Schema
export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions);

// Subscription Transactions
export const subscriptionTransactions = pgTable("operations.subscription_transaction", {
  id: serial("transaction_id").primaryKey(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  creditAdd: integer("credit_add"),
  creditSubtract: integer("credit_subtract"),
  authorizingUserId: integer("authorizing_user_id").notNull().references(() => users.id),
  transactionTs: timestamp("transaction_ts").defaultNow().notNull(),
});

// Subscription Transaction Insert Schema
export const insertSubscriptionTransactionSchema = createInsertSchema(subscriptionTransactions).omit({
  id: true,
  transactionTs: true,
});

// Reports
export const reports = pgTable("customer_data.report", {
  id: serial("report_id").primaryKey(),
  name: text("report_name"),
  description: text("description"),
  creationTs: timestamp("creation_ts").defaultNow(),
  knowledgeBaseVersion: text("knowledge_base_version"),
  reportCostInCredits: integer("report_cost_in_credits"),
});

// Report Insert Schema
export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  creationTs: true,
});

// User Reports
export const userReports = pgTable("operations.user_report", {
  userId: integer("user_id").references(() => users.id),
  reportId: integer("report_id").references(() => reports.id),
  isOwner: boolean("is_owner"),
  canShare: boolean("can_share"),
});

// User Report Insert Schema
export const insertUserReportSchema = createInsertSchema(userReports);

// Report Transactions
export const reportTransactions = pgTable("operations.report_transaction", {
  reportId: integer("report_id").references(() => reports.id),
  transactionId: integer("transaction_id").references(() => subscriptionTransactions.id),
});

// Report Transaction Insert Schema
export const insertReportTransactionSchema = createInsertSchema(reportTransactions);

// Auth Users
export const authUsers = pgTable("auth_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  userId: integer("user_id").references(() => users.id),
  isAdmin: boolean("is_admin").default(false),
});

// Auth User Insert Schema
export const insertAuthUserSchema = createInsertSchema(authUsers).omit({
  id: true,
});

// Types
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type AccountUser = typeof accountUsers.$inferSelect;
export type InsertAccountUser = z.infer<typeof insertAccountUserSchema>;

export type UserContact = typeof userContacts.$inferSelect;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type ProductOffering = typeof productOfferings.$inferSelect;
export type InsertProductOffering = z.infer<typeof insertProductOfferingSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;

export type SubscriptionTransaction = typeof subscriptionTransactions.$inferSelect;
export type InsertSubscriptionTransaction = z.infer<typeof insertSubscriptionTransactionSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type UserReport = typeof userReports.$inferSelect;
export type InsertUserReport = z.infer<typeof insertUserReportSchema>;

export type ReportTransaction = typeof reportTransactions.$inferSelect;
export type InsertReportTransaction = z.infer<typeof insertReportTransactionSchema>;

export type AuthUser = typeof authUsers.$inferSelect;
export type InsertAuthUser = z.infer<typeof insertAuthUserSchema>;
