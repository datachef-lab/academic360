CREATE INDEX "idx_boards_degree_id" ON "boards" USING btree ("degree_id");--> statement-breakpoint
CREATE INDEX "idx_boards_name" ON "boards" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_boards_code" ON "boards" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_boards_active" ON "boards" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_boards_legacy_id" ON "boards" USING btree ("legacy_board_id");--> statement-breakpoint
CREATE INDEX "idx_boards_sequence" ON "boards" USING btree ("sequence");--> statement-breakpoint
CREATE INDEX "idx_boards_created_at" ON "boards" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_boards_search" ON "boards" USING btree ("name","code");--> statement-breakpoint
CREATE INDEX "idx_boards_filters" ON "boards" USING btree ("degree_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_degree_name" ON "degree" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_degree_active" ON "degree" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_degree_legacy_id" ON "degree" USING btree ("legacy_degree_id");--> statement-breakpoint
CREATE INDEX "idx_degree_sequence" ON "degree" USING btree ("sequence");--> statement-breakpoint
CREATE INDEX "idx_degree_created_at" ON "degree" USING btree ("created_at");