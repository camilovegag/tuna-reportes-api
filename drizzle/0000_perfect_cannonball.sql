-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations

CREATE TYPE "public"."attendance_status" AS ENUM('asiste', 'no_asiste', 'por_confirmar', 'no_responde');--> statement-breakpoint
CREATE TYPE "public"."blood_type" AS ENUM('a+', 'a-', 'b+', 'b-', 'ab+', 'ab-', 'o+', 'o-');--> statement-breakpoint
CREATE TYPE "public"."civil_status" AS ENUM('soltero', 'casado', 'divorciado');--> statement-breakpoint
CREATE TYPE "public"."eps_provider" AS ENUM('aliansalud', 'colmedica', 'compensar', 'sanitas', 'sura', 'salud_total', 'colpatria', 'coomeva', 'famisanar', 'medifiatc', 'cafesalud', 'susalud', 'asmetsalud', 'nueva_eps', 'sanidad_militar', 'sisben');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('por_confirmar', 'confirmado', 'realizado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('serenata', 'ensayo', 'festival', 'certamen', 'remate', 'parche', 'viaje');--> statement-breakpoint
CREATE TYPE "public"."member_rank" AS ENUM('aspirante', 'bulto', 'tuno');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'editor', 'viewer');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text,
	"member_id" uuid,
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raul" integer,
	"rank" "member_rank" NOT NULL,
	"birth_date" date NOT NULL,
	"nickname" varchar(100) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone" varchar(50),
	"address" text,
	"email" varchar(255),
	"document_number" varchar(50),
	"document_issued_at" varchar(100),
	"eps" "eps_provider",
	"blood_type" "blood_type",
	"civil_status" "civil_status",
	"partner_name" varchar(255),
	"children_names" text,
	"joined_at" date,
	"beca_date" date,
	"deceased_at" date,
	"image_url" text,
	"vinculation_code" uuid DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "members_raul_key" UNIQUE("raul")
);
--> statement-breakpoint
CREATE TABLE "attendances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"status" "attendance_status" DEFAULT 'por_confirmar' NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "attendances_event_id_member_id_key" UNIQUE("event_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"date" timestamp with time zone NOT NULL,
	"location" text NOT NULL,
	"type" "event_type" NOT NULL,
	"is_international" boolean DEFAULT false,
	"status" "event_status" DEFAULT 'por_confirmar' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_by" uuid,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_member_id_fkey1" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
