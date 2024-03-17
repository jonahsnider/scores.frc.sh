DO $$ BEGIN
 CREATE TYPE "match_level" AS ENUM('QUALIFICATION', 'PLAYOFF');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "top_scores" ADD COLUMN "match_level" "match_level" NOT NULL;