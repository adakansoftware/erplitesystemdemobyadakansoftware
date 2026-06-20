CREATE TABLE "companies" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"sector" varchar(100),
	"city" varchar(100),
	"phone" varchar(30),
	"email" varchar(255),
	"website" varchar(255),
	"current_account_id" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"tax_number" varchar(20),
	"tax_office" varchar(100),
	"address" text,
	"city" varchar(100),
	"phone" varchar(30),
	"email" varchar(255),
	"website" varchar(255),
	"logo_url" varchar(500),
	"currency" varchar(3) DEFAULT 'TRY' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"title" varchar(100),
	"company_id" varchar(20),
	"email" varchar(255),
	"phone" varchar(30),
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "current_accounts" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	"tax_number" varchar(20),
	"tax_office" varchar(100),
	"address" text,
	"city" varchar(100),
	"phone" varchar(30),
	"email" varchar(255),
	"credit_limit" numeric(15, 2) DEFAULT '0',
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"current_account_id" varchar(20),
	"stage" varchar(30) DEFAULT 'lead' NOT NULL,
	"value" numeric(15, 2),
	"owner" varchar(255),
	"close_date" date,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_accounts" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	"bank_name" varchar(100),
	"iban" varchar(34),
	"currency" varchar(3) DEFAULT 'TRY' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" varchar(30) NOT NULL,
	"product_id" varchar(20),
	"product" varchar(255) NOT NULL,
	"quantity" numeric(15, 3) NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '18' NOT NULL,
	"line_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"current_account_id" varchar(20),
	"customer" varchar(255) NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"note" text,
	"related_quotation_id" varchar(30),
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"company" varchar(255),
	"source" varchar(100),
	"status" varchar(30) DEFAULT 'new' NOT NULL,
	"value" numeric(15, 2),
	"owner" varchar(255),
	"phone" varchar(30),
	"email" varchar(255),
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	CONSTRAINT "product_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"sku" varchar(100) NOT NULL,
	"barcode" varchar(50),
	"category_id" uuid,
	"brand" varchar(100),
	"unit" varchar(30) DEFAULT 'Adet' NOT NULL,
	"cost_price" numeric(15, 2) DEFAULT '0' NOT NULL,
	"sale_price" numeric(15, 2) DEFAULT '0' NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '18' NOT NULL,
	"reorder_point" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "purchase_order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" varchar(30) NOT NULL,
	"product_id" varchar(20),
	"product" varchar(255) NOT NULL,
	"quantity" numeric(15, 3) NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '18' NOT NULL,
	"received_qty" numeric(15, 3) DEFAULT '0',
	"line_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"current_account_id" varchar(20),
	"supplier" varchar(255) NOT NULL,
	"order_date" date NOT NULL,
	"expected_date" date,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"note" text,
	"warehouse_id" varchar(20),
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" varchar(30) NOT NULL,
	"product_id" varchar(20),
	"product" varchar(255) NOT NULL,
	"quantity" numeric(15, 3) NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '18' NOT NULL,
	"line_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"current_account_id" varchar(20),
	"customer" varchar(255) NOT NULL,
	"date" date NOT NULL,
	"valid_until" date NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"note" text,
	"converted_to_invoice_id" varchar(30),
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar(20) NOT NULL,
	"warehouse_id" varchar(20),
	"type" varchar(20) NOT NULL,
	"qty" numeric(15, 3) NOT NULL,
	"unit_cost" numeric(15, 2),
	"related_doc_type" varchar(30),
	"related_doc_id" varchar(30),
	"note" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"related" varchar(255),
	"related_type" varchar(30),
	"related_id" varchar(20),
	"due" date,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"done_at" timestamp,
	"owner" varchar(255),
	"assigned_to" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"description" varchar(500) NOT NULL,
	"category" varchar(100),
	"finance_account_id" varchar(20) NOT NULL,
	"type" varchar(20) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"related_doc_type" varchar(30),
	"related_doc_id" varchar(30),
	"current_account_id" varchar(20),
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'staff' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"location" varchar(255),
	"manager" varchar(255),
	"capacity" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_current_account_id_current_accounts_id_fk" FOREIGN KEY ("current_account_id") REFERENCES "public"."current_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_current_account_id_current_accounts_id_fk" FOREIGN KEY ("current_account_id") REFERENCES "public"."current_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_current_account_id_current_accounts_id_fk" FOREIGN KEY ("current_account_id") REFERENCES "public"."current_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_related_quotation_id_quotations_id_fk" FOREIGN KEY ("related_quotation_id") REFERENCES "public"."quotations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_current_account_id_current_accounts_id_fk" FOREIGN KEY ("current_account_id") REFERENCES "public"."current_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_current_account_id_current_accounts_id_fk" FOREIGN KEY ("current_account_id") REFERENCES "public"."current_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_finance_account_id_finance_accounts_id_fk" FOREIGN KEY ("finance_account_id") REFERENCES "public"."finance_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_current_account_id_current_accounts_id_fk" FOREIGN KEY ("current_account_id") REFERENCES "public"."current_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;