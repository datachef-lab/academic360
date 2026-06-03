CREATE INDEX "idx_address_board_id" ON "address" USING btree ("board_id_fk");--> statement-breakpoint
CREATE INDEX "idx_address_personal_details_id" ON "address" USING btree ("personal_details_id_fk");--> statement-breakpoint
CREATE INDEX "idx_address_staff_id" ON "address" USING btree ("staff_id_fk");--> statement-breakpoint
CREATE INDEX "idx_address_institution_id" ON "address" USING btree ("institution_id_fk");--> statement-breakpoint
CREATE INDEX "idx_address_accommodation_id" ON "address" USING btree ("accommodation_id_fk");--> statement-breakpoint
CREATE INDEX "idx_address_person_id" ON "address" USING btree ("person_id_fk");--> statement-breakpoint
CREATE INDEX "idx_address_country_id" ON "address" USING btree ("country_id_fk");--> statement-breakpoint
CREATE INDEX "idx_address_state_id" ON "address" USING btree ("state_id_fk");--> statement-breakpoint
CREATE INDEX "idx_address_city_id" ON "address" USING btree ("city_id_fk");--> statement-breakpoint
CREATE INDEX "idx_address_district_id" ON "address" USING btree ("district_id_fk");--> statement-breakpoint
CREATE INDEX "idx_address_postoffice_id" ON "address" USING btree ("postoffice_id_fk");--> statement-breakpoint
CREATE INDEX "idx_address_police_station_id" ON "address" USING btree ("police_station_id_fk");--> statement-breakpoint
CREATE INDEX "idx_address_type" ON "address" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_address_pincode" ON "address" USING btree ("pincode");--> statement-breakpoint
CREATE INDEX "idx_address_phone" ON "address" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_address_created_at" ON "address" USING btree ("created_at");