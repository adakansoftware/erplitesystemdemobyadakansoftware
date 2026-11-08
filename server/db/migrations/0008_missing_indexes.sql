CREATE INDEX "sm_product_idx" ON "stock_movements" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "sm_date_idx" ON "stock_movements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sm_related_idx" ON "stock_movements" USING btree ("related_doc_type","related_doc_id");--> statement-breakpoint
CREATE INDEX "task_done_idx" ON "tasks" USING btree ("done","due");--> statement-breakpoint
CREATE INDEX "inv_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inv_due_idx" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "inv_acc_date_idx" ON "invoices" USING btree ("current_account_id","issue_date");--> statement-breakpoint
CREATE INDEX "trx_account_idx" ON "transactions" USING btree ("finance_account_id");--> statement-breakpoint
CREATE INDEX "trx_date_idx" ON "transactions" USING btree ("date");
