ALTER TABLE "countries" DROP CONSTRAINT "countries_name_unique";--> statement-breakpoint
ALTER TABLE "states" DROP CONSTRAINT "states_name_unique";--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_legacyCityId_stateId_name_unique" UNIQUE("legacy_city_id","state_id","name");--> statement-breakpoint
ALTER TABLE "countries" ADD CONSTRAINT "countries_legacyCountryId_name_unique" UNIQUE("legacy_country_id","name");--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_legacyDistrictId_cityId_name_unique" UNIQUE("legacy_district_id","city_id","name");--> statement-breakpoint
ALTER TABLE "states" ADD CONSTRAINT "states_legacyStateId_countryId_name_unique" UNIQUE("legacy_state_id","country_id","name");