ALTER TABLE "app_modules" ADD COLUMN "component_key" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "app_modules" ADD COLUMN "route_path" varchar(1000) NOT NULL;--> statement-breakpoint
ALTER TABLE "app_modules" ADD COLUMN "is_dynamic" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_modules" ADD COLUMN "is_layout" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_modules" ADD COLUMN "is_protected" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "designations" ADD COLUMN "color" varchar(255);--> statement-breakpoint
ALTER TABLE "designations" ADD COLUMN "bg_color" varchar(255);--> statement-breakpoint
ALTER TABLE "app_modules" ADD CONSTRAINT "app_modules_componentKey_unique" UNIQUE("component_key");--> statement-breakpoint
ALTER TABLE "app_modules" ADD CONSTRAINT "app_modules_routePath_unique" UNIQUE("route_path");