CREATE TABLE IF NOT EXISTS "events" (
	"internal_id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"code" text NOT NULL,
	"week_number" integer NOT NULL,
	"name" text NOT NULL,
	"first_code" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "top_scores" DROP CONSTRAINT "top_scores_year_event_code_match_level_match_number_pk";--> statement-breakpoint
ALTER TABLE "top_scores" ADD CONSTRAINT "top_scores_match_level_match_number_pk" PRIMARY KEY("match_level","match_number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "events_year_code_index" ON "events" ("year","code");--> statement-breakpoint
ALTER TABLE "top_scores" DROP COLUMN IF EXISTS "year";--> statement-breakpoint
ALTER TABLE "top_scores" DROP COLUMN IF EXISTS "event_code";--> statement-breakpoint
ALTER TABLE "top_scores" DROP COLUMN IF EXISTS "event_week_number";