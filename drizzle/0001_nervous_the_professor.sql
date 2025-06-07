CREATE TYPE "public"."auth_provider" AS ENUM('local', 'google', 'clerk');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "provider" "auth_provider" DEFAULT 'local';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "provider_id" text;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "clerk_user_id";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");