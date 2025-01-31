ALTER TABLE "cities" ADD CONSTRAINT "cities_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "countries" ADD CONSTRAINT "countries_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "states" ADD CONSTRAINT "states_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "disability_codes" ADD CONSTRAINT "disability_codes_code_unique" UNIQUE("code");