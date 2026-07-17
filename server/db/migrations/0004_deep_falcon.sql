ALTER TABLE "product_categories" DROP CONSTRAINT "product_categories_name_unique";--> statement-breakpoint
ALTER TABLE "product_categories" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint
UPDATE "product_categories"
SET "tenant_id" = (
  SELECT "id"
  FROM "tenants"
  ORDER BY "created_at" ASC
  LIMIT 1
)
WHERE "tenant_id" IS NULL;--> statement-breakpoint
ALTER TABLE "product_categories" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_categories_tenant_name_idx" ON "product_categories" USING btree ("tenant_id","name");--> statement-breakpoint
