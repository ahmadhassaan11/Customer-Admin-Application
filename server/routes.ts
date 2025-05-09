import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import * as schema from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

const router = express.Router();

// Configure passport
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await storage.authenticateUser(username, password);
    if (!user) {
      return done(null, false, { message: "Incorrect username or password" });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const [authUser] = await db.select().from(schema.authUsers).where(eq(schema.authUsers.id, id));
    if (!authUser) {
      return done(null, false);
    }
    
    // Get the user info to include in the session
    const [userInfo] = await db.select().from(schema.users).where(eq(schema.users.id, authUser.userId || 0));
    const fullUser = {
      ...authUser,
      ...userInfo
    };
    
    done(null, fullUser);
  } catch (err) {
    done(err);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session
  app.use(session({
    secret: process.env.SESSION_SECRET || "admin-app-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Authentication routes
  router.post("/auth/login",
    passport.authenticate("local"),
    (req: any, res) => {
      // req.user is your combined authUsers + users info
      const { password, ...userSafe } = req.user;
      res.json(userSafe);
    }
  );
  
  router.post("/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });
  
  router.get("/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { password, ...userSafe } = req.user as any;
    res.json({ user: userSafe });
  });
  
  // Account routes
  router.get("/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
      res.json(accounts);
    } catch (err) {
      res.status(500).json({ message: "Error fetching accounts" });
    }
  });
  
  router.get("/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.getAccount(id);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.json(account);
    } catch (err) {
      res.status(500).json({ message: "Error fetching account" });
    }
  });
  
  router.post("/accounts", async (req, res) => {
    try {
      const accountData = schema.insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(accountData);
      res.status(201).json(account);
    } catch (err) {
      res.status(400).json({ message: "Invalid account data" });
    }
  });
  
  router.put("/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accountData = schema.insertAccountSchema.partial().parse(req.body);
      const account = await storage.updateAccount(id, accountData);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.json(account);
    } catch (err) {
      res.status(400).json({ message: "Invalid account data" });
    }
  });
  
  // User routes
  router.get("/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });
  
  router.get("/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });
  
  router.post("/users", async (req, res) => {
    try {
      const userData = schema.insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });
  
  router.put("/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = schema.insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (err) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });
  
  // Account User routes
  router.get("/accounts/:id/users", async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const accountUsers = await storage.getAccountUsers(accountId);
      res.json(accountUsers);
    } catch (err) {
      res.status(500).json({ message: "Error fetching account users" });
    }
  });
  
  router.post("/accounts/users", async (req, res) => {
    try {
      const accountUserData = schema.insertAccountUserSchema.parse(req.body);
      const accountUser = await storage.addUserToAccount(accountUserData);
      res.status(201).json(accountUser);
    } catch (err) {
      res.status(400).json({ message: "Invalid account user data" });
    }
  });
  
  router.delete("/accounts/users", async (req, res) => {
    try {
      const { userId, accountId, role } = req.body;
      await storage.removeUserFromAccount(userId, accountId, role);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ message: "Error removing user from account" });
    }
  });

// User Account routes 
router.get("/users/:id/accounts", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const userAccounts = await storage.getUserAccounts(userId);
    res.json(userAccounts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user accounts" });
  }
});

router.post("/users/accounts", async (req, res) => {
  try {
    const userAccountData = schema.insertUserAccountSchema.parse(req.body);
    const userAccount = await storage.addAccountToUser(userAccountData);
    res.status(201).json(userAccount);
  } catch (err) {
    res.status(400).json({ message: "Invalid user account data" });
  }
});

router.delete("/users/accounts", async (req, res) => {
  try {
    const { accountId, userId, role } = req.body;
    await storage.removeAccountFromUser(accountId, userId, role);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ message: "Error removing account from user" });
  }
});
  
  // Product routes
  router.get("/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (err) {
      res.status(500).json({ message: "Error fetching products" });
    }
  });
  
  router.get("/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (err) {
      res.status(500).json({ message: "Error fetching product" });
    }
  });
  
  router.post("/products", async (req, res) => {
    try {
      const productData = schema.insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (err) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });
  
  router.put("/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = schema.insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (err) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });
  
  // Product Offering routes
  router.get("/product-offerings", async (req, res) => {
    try {
      const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
      const offerings = await storage.getProductOfferings(productId);
      res.json(offerings);
    } catch (err) {
      res.status(500).json({ message: "Error fetching product offerings" });
    }
  });
  
  router.get("/product-offerings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const offering = await storage.getProductOffering(id);
      if (!offering) {
        return res.status(404).json({ message: "Product offering not found" });
      }
      res.json(offering);
    } catch (err) {
      res.status(500).json({ message: "Error fetching product offering" });
    }
  });
  
  router.post("/product-offerings", async (req, res) => {
    try {
      const offeringData = schema.insertProductOfferingSchema.parse(req.body);
      const offering = await storage.createProductOffering(offeringData);
      res.status(201).json(offering);
    } catch (err) {
      res.status(400).json({ message: "Invalid product offering data" });
    }
  });
  
  router.put("/product-offerings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const offeringData = schema.insertProductOfferingSchema.partial().parse(req.body);
      const offering = await storage.updateProductOffering(id, offeringData);
      if (!offering) {
        return res.status(404).json({ message: "Product offering not found" });
      }
      res.json(offering);
    } catch (err) {
      res.status(400).json({ message: "Invalid product offering data" });
    }
  });
  
  // Subscription routes
  router.get("/subscriptions", async (req, res) => {
    try {
      const accountId = req.query.accountId ? parseInt(req.query.accountId as string) : undefined;
      const subscriptions = await storage.getSubscriptions(accountId);
      res.json(subscriptions);
    } catch (err) {
      res.status(500).json({ message: "Error fetching subscriptions" });
    }
  });
  
  router.get("/subscriptions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subscription = await storage.getSubscription(id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      res.json(subscription);
    } catch (err) {
      res.status(500).json({ message: "Error fetching subscription" });
    }
  });
  
  router.post("/subscriptions", async (req, res) => {
    try {
      const subscriptionData = schema.insertSubscriptionSchema.parse(req.body);
      const subscription = await storage.createSubscription(subscriptionData);
      res.status(201).json(subscription);
    } catch (err) {
      res.status(400).json({ message: "Invalid subscription data" });
    }
  });
  
  router.put("/subscriptions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subscriptionData = schema.insertSubscriptionSchema.partial().parse(req.body);
      const subscription = await storage.updateSubscription(id, subscriptionData);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      res.json(subscription);
    } catch (err) {
      res.status(400).json({ message: "Invalid subscription data" });
    }
  });
  
  // User Subscription routes
  router.get("/user-subscriptions", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const userSubscriptions = await storage.getUserSubscriptions(userId);
      res.json(userSubscriptions);
    } catch (err) {
      res.status(500).json({ message: "Error fetching user subscriptions" });
    }
  });
  
  router.post("/user-subscriptions", async (req, res) => {
    try {
      const userSubscriptionData = schema.insertUserSubscriptionSchema.parse(req.body);
      const userSubscription = await storage.authorizeUserForSubscription(userSubscriptionData);
      res.status(201).json(userSubscription);
    } catch (err) {
      res.status(400).json({ message: "Invalid user subscription data" });
    }
  });
  
  router.delete("/user-subscriptions", async (req, res) => {
    try {
      const { userId, subscriptionId } = req.body;
      await storage.removeUserFromSubscription(userId, subscriptionId);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ message: "Error removing user from subscription" });
    }
  });
  
  // Subscription Transaction routes
  router.get("/subscription-transactions", async (req, res) => {
    try {
      const subscriptionId = req.query.subscriptionId ? parseInt(req.query.subscriptionId as string) : undefined;
      const transactions = await storage.getSubscriptionTransactions(subscriptionId);
      res.json(transactions);
    } catch (err) {
      res.status(500).json({ message: "Error fetching subscription transactions" });
    }
  });
  
  router.post("/subscription-transactions", async (req, res) => {
    try {
      const transactionData = schema.insertSubscriptionTransactionSchema.parse(req.body);
      const transaction = await storage.createSubscriptionTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (err) {
      res.status(400).json({ message: "Invalid subscription transaction data" });
    }
  });
  
  // Report routes
  router.get("/reports", async (req, res) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (err) {
      res.status(500).json({ message: "Error fetching reports" });
    }
  });
  
  router.get("/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.getReport(id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (err) {
      res.status(500).json({ message: "Error fetching report" });
    }
  });
  
  router.post("/reports", async (req, res) => {
    try {
      const reportData = schema.insertReportSchema.parse(req.body);
      const report = await storage.createReport(reportData);
      res.status(201).json(report);
    } catch (err) {
      res.status(400).json({ message: "Invalid report data" });
    }
  });
  
  // Metrics routes
  router.get("/metrics/active-users", async (req, res) => {
    try {
      const accountId = req.query.accountId ? parseInt(req.query.accountId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const count = await storage.getActiveUserCount(accountId, startDate, endDate);
      res.json({ count });
    } catch (err) {
      res.status(500).json({ message: "Error fetching active user count" });
    }
  });
  
  router.get("/metrics/reports-per-user", async (req, res) => {
    try {
      const accountId = req.query.accountId ? parseInt(req.query.accountId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const data = await storage.getReportsPerUser(accountId, startDate, endDate);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Error fetching reports per user" });
    }
  });
  
  router.get("/metrics/total-reports", async (req, res) => {
    try {
      const accountId = req.query.accountId ? parseInt(req.query.accountId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const count = await storage.getTotalReports(accountId, startDate, endDate);
      res.json({ count });
    } catch (err) {
      res.status(500).json({ message: "Error fetching total reports" });
    }
  });
  
  router.get("/metrics/remaining-credits", async (req, res) => {
    try {
      const accountId = req.query.accountId ? parseInt(req.query.accountId as string) : undefined;
      
      const credits = await storage.getRemainingCredits(accountId);
      res.json({ credits });
    } catch (err) {
      res.status(500).json({ message: "Error fetching remaining credits" });
    }
  });
  
  router.get("/metrics/credits-per-user", async (req, res) => {
    try {
      const accountId = req.query.accountId ? parseInt(req.query.accountId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const data = await storage.getCreditsUsedPerUser(accountId, startDate, endDate);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Error fetching credits per user" });
    }
  });
  
  router.get("/metrics/spending-comparison", async (req, res) => {
    try {
      const accountId = parseInt(req.query.accountId as string);
      const period1Start = new Date(req.query.period1Start as string);
      const period1End = new Date(req.query.period1End as string);
      const period2Start = new Date(req.query.period2Start as string);
      const period2End = new Date(req.query.period2End as string);
      
      const data = await storage.getSpendingComparison(accountId, period1Start, period1End, period2Start, period2End);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Error fetching spending comparison" });
    }
  });
  
  router.get("/metrics/expiring-subscriptions", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      
      const subscriptions = await storage.getExpiringSubscriptions(days);
      res.json(subscriptions);
    } catch (err) {
      res.status(500).json({ message: "Error fetching expiring subscriptions" });
    }
  });
  
  // Register all routes
  app.use("/api", router);
  
  const httpServer = createServer(app);
  
  return httpServer;
}
