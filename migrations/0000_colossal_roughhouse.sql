CREATE TABLE "operations.account_role" (
	"role" text NOT NULL,
	CONSTRAINT "operations.account_role_role_unique" UNIQUE("role")
);
--> statement-breakpoint
CREATE TABLE "operations.account_type" (
	"type" text NOT NULL,
	CONSTRAINT "operations.account_type_type_unique" UNIQUE("type")
);
--> statement-breakpoint
CREATE TABLE "operations.account_user" (
	"user_id" integer NOT NULL,
	"account_id" integer NOT NULL,
	"account_role" text NOT NULL,
	CONSTRAINT "operations.account_user_user_id_account_id_account_role_pk" PRIMARY KEY("user_id","account_id","account_role")
);
--> statement-breakpoint
CREATE TABLE "operations.account" (
	"account_id" serial PRIMARY KEY NOT NULL,
	"account_name" text,
	"account_type" text,
	"account_status" text,
	"creation_ts" timestamp DEFAULT now(),
	"update_ts" timestamp
);
--> statement-breakpoint
CREATE TABLE "operations.activity" (
	"activity_type" text NOT NULL,
	CONSTRAINT "operations.activity_activity_type_unique" UNIQUE("activity_type")
);
--> statement-breakpoint
CREATE TABLE "auth_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"user_id" integer,
	"is_admin" boolean DEFAULT false,
	CONSTRAINT "auth_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "customer_data.contact_type" (
	"type" text NOT NULL,
	CONSTRAINT "customer_data.contact_type_type_unique" UNIQUE("type")
);
--> statement-breakpoint
CREATE TABLE "operations.product_offering" (
	"offering_id" serial PRIMARY KEY NOT NULL,
	"offering_name" text,
	"offering_description" text,
	"rate_per_credit" double precision NOT NULL,
	"product_id" integer
);
--> statement-breakpoint
CREATE TABLE "operations.product" (
	"product_id" serial PRIMARY KEY NOT NULL,
	"product_name" text NOT NULL,
	"current_version" text,
	"creation_date" date DEFAULT now(),
	"update_date" date
);
--> statement-breakpoint
CREATE TABLE "operations.report_transaction" (
	"report_id" integer,
	"transaction_id" integer
);
--> statement-breakpoint
CREATE TABLE "customer_data.report" (
	"report_id" serial PRIMARY KEY NOT NULL,
	"report_name" text,
	"description" text,
	"creation_ts" timestamp DEFAULT now(),
	"knowledge_base_version" text,
	"report_cost_in_credits" integer
);
--> statement-breakpoint
CREATE TABLE "operations.subscription_transaction" (
	"transaction_id" serial PRIMARY KEY NOT NULL,
	"subscription_id" integer,
	"credit_add" integer,
	"credit_subtract" integer,
	"authorizing_user_id" integer NOT NULL,
	"transaction_ts" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operations.subscription" (
	"subscription_id" serial PRIMARY KEY NOT NULL,
	"account_id" integer,
	"product_id" integer NOT NULL,
	"product_offering_id" integer NOT NULL,
	"credits" integer DEFAULT 0 NOT NULL,
	"starting_ts" timestamp DEFAULT now(),
	"expiration_ts" timestamp
);
--> statement-breakpoint
CREATE TABLE "operations.user_activity" (
	"user_id" integer,
	"activity_type" text,
	"creation_ts" timestamp,
	"meta_data" json
);
--> statement-breakpoint
CREATE TABLE "customer_data.user_contact" (
	"user_id" integer,
	"contact_type" text,
	"contact_note" text,
	"contact" text
);
--> statement-breakpoint
CREATE TABLE "operations.user_report" (
	"user_id" integer,
	"report_id" integer,
	"is_owner" boolean,
	"can_share" boolean
);
--> statement-breakpoint
CREATE TABLE "operations.user_subscription" (
	"subscription_id" integer,
	"authorized_user" integer
);
--> statement-breakpoint
CREATE TABLE "operations.user" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"first_name" text,
	"last_name" text,
	"is_active" boolean DEFAULT true,
	"creation_ts" timestamp DEFAULT now(),
	"last_update_ts" timestamp
);
--> statement-breakpoint
ALTER TABLE "operations.account_user" ADD CONSTRAINT "operations.account_user_user_id_operations.user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."operations.user"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations.account_user" ADD CONSTRAINT "operations.account_user_account_id_operations.account_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."operations.account"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations.account_user" ADD CONSTRAINT "operations.account_user_account_role_operations.account_role_role_fk" FOREIGN KEY ("account_role") REFERENCES "public"."operations.account_role"("role") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations.account" ADD CONSTRAINT "operations.account_account_type_operations.account_type_type_fk" FOREIGN KEY ("account_type") REFERENCES "public"."operations.account_type"("type") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_users" ADD CONSTRAINT "auth_users_user_id_operations.user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."operations.user"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations.product_offering" ADD CONSTRAINT "operations.product_offering_product_id_operations.product_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."operations.product"("product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations.report_transaction" ADD CONSTRAINT "operations.report_transaction_report_id_customer_data.report_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."customer_data.report"("report_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations.report_transaction" ADD CONSTRAINT "operations.report_transaction_transaction_id_operations.subscription_transaction_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."operations.subscription_transaction"("transaction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations.subscription_transaction" ADD CONSTRAINT "operations.subscription_transaction_subscription_id_operations.subscription_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."operations.subscription"("subscription_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations.subscription_transaction" ADD CONSTRAINT "operations.subscription_transaction_authorizing_user_id_operations.user_user_id_fk" FOREIGN KEY ("authorizing_user_id") REFERENCES "public"."operations.user"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations.subscription" ADD CONSTRAINT "operations.subscription_account_id_operations.account_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."operations.account"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations.subscription" ADD CONSTRAINT "operations.subscription_product_id_operations.product_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."operations.product"("product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations.subscription" ADD CONSTRAINT "operations.subscription_product_offering_id_operations.product_offering_offering_id_fk" FOREIGN KEY ("product_offering_id") REFERENCES "public"."operations.product_offering"("offering_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations.user_activity" ADD CONSTRAINT "operations.user_activity_user_id_operations.user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."operations.user"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations.user_activity" ADD CONSTRAINT "operations.user_activity_activity_type_operations.activity_activity_type_fk" FOREIGN KEY ("activity_type") REFERENCES "public"."operations.activity"("activity_type") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_data.user_contact" ADD CONSTRAINT "customer_data.user_contact_user_id_operations.user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."operations.user"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_data.user_contact" ADD CONSTRAINT "customer_data.user_contact_contact_type_customer_data.contact_type_type_fk" FOREIGN KEY ("contact_type") REFERENCES "public"."customer_data.contact_type"("type") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations.user_report" ADD CONSTRAINT "operations.user_report_user_id_operations.user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."operations.user"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations.user_report" ADD CONSTRAINT "operations.user_report_report_id_customer_data.report_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."customer_data.report"("report_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations.user_subscription" ADD CONSTRAINT "operations.user_subscription_subscription_id_operations.subscription_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."operations.subscription"("subscription_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations.user_subscription" ADD CONSTRAINT "operations.user_subscription_authorized_user_operations.user_user_id_fk" FOREIGN KEY ("authorized_user") REFERENCES "public"."operations.user"("user_id") ON DELETE no action ON UPDATE no action;