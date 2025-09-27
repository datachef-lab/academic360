CREATE TYPE "public"."address_type" AS ENUM('MAILING', 'RESIDENTIAL', 'OFFICE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."person_type" AS ENUM('FATHER', 'MOTHER', 'GUARDIAN', 'OTHER_GUARDIAN', 'SPOUSE', 'NOMINEE', 'BROTHER', 'SISTER', 'SON', 'DAUGHTER', 'OTHER');--> statement-breakpoint
CREATE TABLE "police_station" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_police_station_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"state_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_office" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_post_office_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"state_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "personal_details" RENAME COLUMN "emergency_contact_number" TO "emergency_residential_number";--> statement-breakpoint
ALTER TABLE "admission_additional_info" DROP CONSTRAINT "admission_additional_info_family_details_id_fk_family_details_id_fk";
--> statement-breakpoint
ALTER TABLE "admission_general_info" DROP CONSTRAINT "admission_general_info_personal_details_id_fk_personal_details_id_fk";
--> statement-breakpoint
ALTER TABLE "admission_general_info" DROP CONSTRAINT "admission_general_info_health_id_fk_health_id_fk";
--> statement-breakpoint
ALTER TABLE "admission_general_info" DROP CONSTRAINT "admission_general_info_accommodation_id_fk_accommodation_id_fk";
--> statement-breakpoint
ALTER TABLE "admission_general_info" DROP CONSTRAINT "admission_general_info_emergency_contact_id_fk_emergency_contacts_id_fk";
--> statement-breakpoint
ALTER TABLE "admission_general_info" DROP CONSTRAINT "admission_general_info_transport_details_id_fk_transport_details_id_fk";
--> statement-breakpoint
ALTER TABLE "boards" DROP CONSTRAINT "boards_address_id_address_id_fk";
--> statement-breakpoint
ALTER TABLE "institutions" DROP CONSTRAINT "institutions_address_id_fk_address_id_fk";
--> statement-breakpoint
ALTER TABLE "students" DROP CONSTRAINT "students_section_id_fk_sections_id_fk";
--> statement-breakpoint
ALTER TABLE "students" DROP CONSTRAINT "students_shift_id_fk_shifts_id_fk";
--> statement-breakpoint
ALTER TABLE "accommodation" DROP CONSTRAINT "accommodation_address_id_fk_address_id_fk";
--> statement-breakpoint
ALTER TABLE "family_details" DROP CONSTRAINT "family_details_father_details_person_id_fk_person_id_fk";
--> statement-breakpoint
ALTER TABLE "family_details" DROP CONSTRAINT "family_details_mother_details_person_id_fk_person_id_fk";
--> statement-breakpoint
ALTER TABLE "family_details" DROP CONSTRAINT "family_details_guardian_details_person_id_fk_person_id_fk";
--> statement-breakpoint
ALTER TABLE "family_details" DROP CONSTRAINT "family_details_other_guardian_details_person_id_fk_person_id_fk";
--> statement-breakpoint
ALTER TABLE "family_details" DROP CONSTRAINT "family_details_spouse_details_person_id_fk_person_id_fk";
--> statement-breakpoint
ALTER TABLE "person" DROP CONSTRAINT "person_office_addres_id_fk_address_id_fk";
--> statement-breakpoint
ALTER TABLE "personal_details" DROP CONSTRAINT "personal_details_mailing_address_id_fk_address_id_fk";
--> statement-breakpoint
ALTER TABLE "personal_details" DROP CONSTRAINT "personal_details_residential_address_id_fk_address_id_fk";
--> statement-breakpoint
ALTER TABLE "staffs" DROP CONSTRAINT "staffs_personal_details_id_fk_personal_details_id_fk";
--> statement-breakpoint
ALTER TABLE "staffs" DROP CONSTRAINT "staffs_family_details_id_fk_family_details_id_fk";
--> statement-breakpoint
ALTER TABLE "staffs" DROP CONSTRAINT "staffs_health_id_fk_health_id_fk";
--> statement-breakpoint
ALTER TABLE "staffs" DROP CONSTRAINT "staffs_emergency_contact_id_fk_emergency_contacts_id_fk";
--> statement-breakpoint
ALTER TABLE "staffs" DROP CONSTRAINT "staffs_nominee_id_fk_person_id_fk";
--> statement-breakpoint
ALTER TABLE "staffs" DROP CONSTRAINT "staffs_previous_employee_address_id_fk_address_id_fk";
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "admission_course_details_id_fk" integer;--> statement-breakpoint
ALTER TABLE "accommodation" ADD COLUMN "admission_general_info_id_fk" integer;--> statement-breakpoint
ALTER TABLE "accommodation" ADD COLUMN "user_id_fk" integer;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "board_id_fk" integer;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "personal_details_id_fk" integer;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "staff_id_fk" integer;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "institution_id_fk" integer;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "accommodation_id_fk" integer;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "person_id_fk" integer;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "type" "address_type";--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "previous_country_id_fk" integer;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "previous_state_id_fk" integer;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "previous_city_id_fk" integer;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "previous_district_id_fk" integer;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "address" varchar(255);--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "postoffice_id_fk" integer;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "police_station_id_fk" integer;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "block" varchar(255);--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "emergency_phone" varchar(255);--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD COLUMN "admission_general_info_id_fk" integer;--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD COLUMN "user_id_fk" integer;--> statement-breakpoint
ALTER TABLE "family_details" ADD COLUMN "admission_additional_info_id_fk" integer;--> statement-breakpoint
ALTER TABLE "family_details" ADD COLUMN "user_id_fk" integer;--> statement-breakpoint
ALTER TABLE "health" ADD COLUMN "admission_general_info_id_fk" integer;--> statement-breakpoint
ALTER TABLE "health" ADD COLUMN "user_id_fk" integer;--> statement-breakpoint
ALTER TABLE "person" ADD COLUMN "type" "person_type";--> statement-breakpoint
ALTER TABLE "person" ADD COLUMN "family_id_fk" integer;--> statement-breakpoint
ALTER TABLE "personal_details" ADD COLUMN "admission_general_info_id_fk" integer;--> statement-breakpoint
ALTER TABLE "personal_details" ADD COLUMN "user_id_fk" integer;--> statement-breakpoint
ALTER TABLE "transport_details" ADD COLUMN "admission_general_info_id_fk" integer;--> statement-breakpoint
ALTER TABLE "transport_details" ADD COLUMN "user_id_fk" integer;--> statement-breakpoint
ALTER TABLE "staffs" ADD COLUMN "legacy_staff_id" integer;--> statement-breakpoint
ALTER TABLE "police_station" ADD CONSTRAINT "police_station_state_id_fk_states_id_fk" FOREIGN KEY ("state_id_fk") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_office" ADD CONSTRAINT "post_office_state_id_fk_states_id_fk" FOREIGN KEY ("state_id_fk") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_admission_course_details_id_fk_admission_course_details_id_fk" FOREIGN KEY ("admission_course_details_id_fk") REFERENCES "public"."admission_course_details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accommodation" ADD CONSTRAINT "accommodation_admission_general_info_id_fk_admission_general_info_id_fk" FOREIGN KEY ("admission_general_info_id_fk") REFERENCES "public"."admission_general_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accommodation" ADD CONSTRAINT "accommodation_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_board_id_fk_boards_id_fk" FOREIGN KEY ("board_id_fk") REFERENCES "public"."boards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_personal_details_id_fk_personal_details_id_fk" FOREIGN KEY ("personal_details_id_fk") REFERENCES "public"."personal_details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_staff_id_fk_staffs_id_fk" FOREIGN KEY ("staff_id_fk") REFERENCES "public"."staffs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_institution_id_fk_institutions_id_fk" FOREIGN KEY ("institution_id_fk") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_accommodation_id_fk_accommodation_id_fk" FOREIGN KEY ("accommodation_id_fk") REFERENCES "public"."accommodation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_person_id_fk_person_id_fk" FOREIGN KEY ("person_id_fk") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_previous_country_id_fk_countries_id_fk" FOREIGN KEY ("previous_country_id_fk") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_previous_state_id_fk_states_id_fk" FOREIGN KEY ("previous_state_id_fk") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_previous_city_id_fk_cities_id_fk" FOREIGN KEY ("previous_city_id_fk") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_previous_district_id_fk_districts_id_fk" FOREIGN KEY ("previous_district_id_fk") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_postoffice_id_fk_post_office_id_fk" FOREIGN KEY ("postoffice_id_fk") REFERENCES "public"."post_office"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_police_station_id_fk_police_station_id_fk" FOREIGN KEY ("police_station_id_fk") REFERENCES "public"."police_station"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_admission_general_info_id_fk_admission_general_info_id_fk" FOREIGN KEY ("admission_general_info_id_fk") REFERENCES "public"."admission_general_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_details" ADD CONSTRAINT "family_details_admission_additional_info_id_fk_admission_additional_info_id_fk" FOREIGN KEY ("admission_additional_info_id_fk") REFERENCES "public"."admission_additional_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_details" ADD CONSTRAINT "family_details_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health" ADD CONSTRAINT "health_admission_general_info_id_fk_admission_general_info_id_fk" FOREIGN KEY ("admission_general_info_id_fk") REFERENCES "public"."admission_general_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health" ADD CONSTRAINT "health_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_family_id_fk_family_details_id_fk" FOREIGN KEY ("family_id_fk") REFERENCES "public"."family_details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_details" ADD CONSTRAINT "personal_details_admission_general_info_id_fk_admission_general_info_id_fk" FOREIGN KEY ("admission_general_info_id_fk") REFERENCES "public"."admission_general_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_details" ADD CONSTRAINT "personal_details_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_details" ADD CONSTRAINT "transport_details_admission_general_info_id_fk_admission_general_info_id_fk" FOREIGN KEY ("admission_general_info_id_fk") REFERENCES "public"."admission_general_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_details" ADD CONSTRAINT "transport_details_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_additional_info" DROP COLUMN "family_details_id_fk";--> statement-breakpoint
ALTER TABLE "admission_general_info" DROP COLUMN "personal_details_id_fk";--> statement-breakpoint
ALTER TABLE "admission_general_info" DROP COLUMN "health_id_fk";--> statement-breakpoint
ALTER TABLE "admission_general_info" DROP COLUMN "accommodation_id_fk";--> statement-breakpoint
ALTER TABLE "admission_general_info" DROP COLUMN "emergency_contact_id_fk";--> statement-breakpoint
ALTER TABLE "admission_general_info" DROP COLUMN "transport_details_id_fk";--> statement-breakpoint
ALTER TABLE "boards" DROP COLUMN "address_id";--> statement-breakpoint
ALTER TABLE "institutions" DROP COLUMN "address_id_fk";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "legacy_id";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "section_id_fk";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "shift_id_fk";--> statement-breakpoint
ALTER TABLE "accommodation" DROP COLUMN "address_id_fk";--> statement-breakpoint
ALTER TABLE "address" DROP COLUMN "postoffice_id";--> statement-breakpoint
ALTER TABLE "address" DROP COLUMN "police_station_id";--> statement-breakpoint
ALTER TABLE "family_details" DROP COLUMN "father_details_person_id_fk";--> statement-breakpoint
ALTER TABLE "family_details" DROP COLUMN "mother_details_person_id_fk";--> statement-breakpoint
ALTER TABLE "family_details" DROP COLUMN "guardian_details_person_id_fk";--> statement-breakpoint
ALTER TABLE "family_details" DROP COLUMN "other_guardian_details_person_id_fk";--> statement-breakpoint
ALTER TABLE "family_details" DROP COLUMN "spouse_details_person_id_fk";--> statement-breakpoint
ALTER TABLE "person" DROP COLUMN "office_addres_id_fk";--> statement-breakpoint
ALTER TABLE "personal_details" DROP COLUMN "mailing_address_id_fk";--> statement-breakpoint
ALTER TABLE "personal_details" DROP COLUMN "residential_address_id_fk";--> statement-breakpoint
ALTER TABLE "staffs" DROP COLUMN "personal_details_id_fk";--> statement-breakpoint
ALTER TABLE "staffs" DROP COLUMN "family_details_id_fk";--> statement-breakpoint
ALTER TABLE "staffs" DROP COLUMN "health_id_fk";--> statement-breakpoint
ALTER TABLE "staffs" DROP COLUMN "emergency_contact_id_fk";--> statement-breakpoint
ALTER TABLE "staffs" DROP COLUMN "nominee_id_fk";--> statement-breakpoint
ALTER TABLE "staffs" DROP COLUMN "previous_employee_address_id_fk";