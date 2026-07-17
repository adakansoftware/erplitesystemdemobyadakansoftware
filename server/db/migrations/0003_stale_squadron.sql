ALTER TABLE "company_settings" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint
UPDATE "company_settings"
SET "tenant_id" = (
  SELECT "id"
  FROM "tenants"
  ORDER BY "created_at" ASC
  LIMIT 1
)
WHERE "tenant_id" IS NULL;--> statement-breakpoint
ALTER TABLE "company_settings" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_tenant_id_unique" UNIQUE("tenant_id");--> statement-breakpoint
