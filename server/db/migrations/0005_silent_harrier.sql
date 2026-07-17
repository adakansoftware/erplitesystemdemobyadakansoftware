ALTER TABLE "products" DROP CONSTRAINT "products_sku_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "products_tenant_sku_idx" ON "products" USING btree ("tenant_id","sku");--> statement-breakpoint
