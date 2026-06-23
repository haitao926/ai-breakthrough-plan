CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id
ON student_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_match_results_target_lookup
ON match_results (target_type, target_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_match_results_user_target
ON match_results (user_id, target_type, target_key);

CREATE INDEX IF NOT EXISTS idx_match_events_user_created
ON match_events (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_match_interactions_target
ON match_interactions (target_type, target_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_match_overrides_user_target
ON match_overrides (user_id, target_type, target_key);

DROP INDEX IF EXISTS idx_match_reminders_user_target;

CREATE INDEX IF NOT EXISTS idx_match_reminders_user_target_lookup
ON match_reminders (user_id, target_type, target_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_match_taxonomy_terms_type_key
ON match_taxonomy_terms (term_type, term_key);

DROP INDEX IF EXISTS idx_knowledge_responses_viewer_token_unique;
DROP INDEX IF EXISTS idx_knowledge_series_videos_bvid;
DROP INDEX IF EXISTS idx_knowledge_responses_viewer_token;
DROP INDEX IF EXISTS idx_knowledge_responses_learner_token;

CREATE INDEX IF NOT EXISTS idx_knowledge_learning_units_discipline
ON knowledge_learning_units (discipline_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_series_videos_bvid
ON knowledge_series_videos (bvid)
WHERE bvid IS NOT NULL AND bvid != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_open_prompts_unique
ON knowledge_open_prompts (discipline_id, episode_key, prompt_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_tool_data_unique
ON project_tool_data (project_id, tool_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_milestones_source_unique
ON project_milestones (project_id, source, source_key)
WHERE source IS NOT NULL AND source_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_knowledge_responses_viewer_token
ON knowledge_responses (viewer_token);

CREATE INDEX IF NOT EXISTS idx_knowledge_responses_learner_token
ON knowledge_responses (learner_token);
