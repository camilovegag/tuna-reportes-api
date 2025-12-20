ALTER TABLE "users" ALTER COLUMN "provider" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "provider" SET DEFAULT 'local'::text;--> statement-breakpoint
DROP TYPE "public"."auth_provider";--> statement-breakpoint
CREATE TYPE "public"."auth_provider" AS ENUM('local', 'google');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "provider" SET DEFAULT 'local'::"public"."auth_provider";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "provider" SET DATA TYPE "public"."auth_provider" USING "provider"::"public"."auth_provider";