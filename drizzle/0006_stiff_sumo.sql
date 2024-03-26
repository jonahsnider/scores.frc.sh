ALTER TABLE "top_scores" ADD COLUMN "event_internal_id" integer NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "top_scores_event_internal_id_index" ON "top_scores" ("event_internal_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "top_scores" ADD CONSTRAINT "top_scores_event_internal_id_events_internal_id_fk" FOREIGN KEY ("event_internal_id") REFERENCES "events"("internal_id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
