-- Create enum type "match_level"
CREATE TYPE "match_level" AS ENUM ('QUALIFICATION', 'PLAYOFF');
-- Create "events" table
CREATE TABLE "events" (
  "internal_id" serial NOT NULL,
  "year" integer NOT NULL,
  "code" character varying NOT NULL,
  "week_number" integer NOT NULL,
  "name" character varying NOT NULL,
  "first_code" character varying NOT NULL,
  PRIMARY KEY ("internal_id")
);
-- Create "top_scores" table
CREATE TABLE "top_scores" (
  "id" serial NOT NULL,
  "match_number" integer NOT NULL,
  "score" integer NOT NULL,
  "winning_teams" jsonb NOT NULL,
  "timestamp" timestamp NOT NULL,
  "match_level" "match_level" NOT NULL,
  "event_internal_id" integer NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "top_scores_event_internal_id_fkey" FOREIGN KEY ("event_internal_id") REFERENCES "events" ("internal_id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
