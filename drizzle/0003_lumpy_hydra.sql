ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;