CREATE TABLE IF NOT EXISTS "top_scores" (
	"year" integer NOT NULL,
	"event_code" text NOT NULL,
	"match_number" integer NOT NULL,
	"score" integer NOT NULL,
	"winning_teams" jsonb NOT NULL,
	"timestamp" timestamp NOT NULL,
	CONSTRAINT "top_scores_year_event_code_match_number_pk" PRIMARY KEY("year","event_code","match_number")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "top_scores_timestamp_index" ON "top_scores" ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "top_scores_score_index" ON "top_scores" ("score");