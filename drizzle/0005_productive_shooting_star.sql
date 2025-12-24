CREATE TYPE "public"."serenade_occasion" AS ENUM('cumpleanos', 'matrimonio', 'grado', 'quince_anos', 'aniversario', 'despedida', 'otro');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "serenade_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"price" integer NOT NULL,
	"transportation_cost" integer DEFAULT 0,
	"occasion" "serenade_occasion" NOT NULL,
	"occasion_details" text,
	"special_requests" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "serenade_bookings_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
ALTER TABLE "serenade_bookings" ADD CONSTRAINT "serenade_bookings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serenade_bookings" ADD CONSTRAINT "serenade_bookings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;