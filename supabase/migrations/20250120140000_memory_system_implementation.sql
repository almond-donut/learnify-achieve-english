-- Memory Bank System Implementation
-- This migration adds long-term memory capabilities to the learning platform

-- Enable vector extension for semantic similarity (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create memory_entries table for storing learning context and patterns
CREATE TABLE IF NOT EXISTS memory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type VARCHAR(50) NOT NULL, -- 'learning_session', 'achievement', 'difficulty_pattern', 'preference'
  content JSONB NOT NULL,
  embedding vector(384), -- For semantic similarity search
  context_tags TEXT[], -- Tags for categorization
  importance_score FLOAT DEFAULT 0.5, -- 0-1 scale for memory retention
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- For automatic cleanup
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_memory_user_id ON memory_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_type ON memory_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_memory_created_at ON memory_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_memory_importance ON memory_entries(importance_score);
CREATE INDEX IF NOT EXISTS idx_memory_tags ON memory_entries USING GIN(context_tags);
CREATE INDEX IF NOT EXISTS idx_memory_expires ON memory_entries(expires_at) WHERE expires_at IS NOT NULL;

-- Create learning_patterns table for analyzing user behavior
CREATE TABLE IF NOT EXISTS learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type VARCHAR(50) NOT NULL, -- 'time_preference', 'difficulty_adaptation', 'topic_interest'
  pattern_data JSONB NOT NULL,
  confidence_score FLOAT DEFAULT 0.5,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for learning patterns
CREATE INDEX IF NOT EXISTS idx_patterns_user_id ON learning_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_patterns_type ON learning_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_patterns_confidence ON learning_patterns(confidence_score);

-- Create context_sessions table for tracking user sessions
CREATE TABLE IF NOT EXISTS context_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  activities JSONB DEFAULT '[]'::jsonb,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  context_summary TEXT,
  total_duration_minutes INTEGER DEFAULT 0
);

-- Create indexes for context sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON context_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start ON context_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_sessions_duration ON context_sessions(total_duration_minutes);

-- Create memory recommendations table
CREATE TABLE IF NOT EXISTS memory_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50) NOT NULL, -- 'study_time', 'difficulty_level', 'topic_focus'
  recommendation_data JSONB NOT NULL,
  confidence_score FLOAT DEFAULT 0.5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for recommendations
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON memory_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON memory_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_active ON memory_recommendations(is_active);

-- RLS Policies for memory tables
ALTER TABLE memory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_recommendations ENABLE ROW LEVEL SECURITY;

-- Memory entries policies
CREATE POLICY "Users can view own memory entries" ON memory_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory entries" ON memory_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memory entries" ON memory_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Learning patterns policies
CREATE POLICY "Users can view own learning patterns" ON learning_patterns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning patterns" ON learning_patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning patterns" ON learning_patterns
  FOR UPDATE USING (auth.uid() = user_id);

-- Context sessions policies
CREATE POLICY "Users can view own context sessions" ON context_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own context sessions" ON context_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own context sessions" ON context_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Memory recommendations policies
CREATE POLICY "Users can view own memory recommendations" ON memory_recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory recommendations" ON memory_recommendations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memory recommendations" ON memory_recommendations
  FOR UPDATE USING (auth.uid() = user_id);

-- Functions for memory operations

-- Function to add memory entry
CREATE OR REPLACE FUNCTION add_memory_entry(
  p_user_id UUID,
  p_entry_type VARCHAR(50),
  p_content JSONB,
  p_context_tags TEXT[] DEFAULT '{}',
  p_importance_score FLOAT DEFAULT 0.5,
  p_expires_days INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
  expires_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate expiration if specified
  IF p_expires_days IS NOT NULL THEN
    expires_timestamp := NOW() + (p_expires_days || ' days')::INTERVAL;
  END IF;

  INSERT INTO memory_entries (
    user_id,
    entry_type,
    content,
    context_tags,
    importance_score,
    expires_at
  ) VALUES (
    p_user_id,
    p_entry_type,
    p_content,
    p_context_tags,
    p_importance_score,
    expires_timestamp
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to retrieve relevant memories
CREATE OR REPLACE FUNCTION get_relevant_memories(
  p_user_id UUID,
  p_entry_types VARCHAR(50)[] DEFAULT NULL,
  p_context_tags TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE(
  id UUID,
  entry_type VARCHAR(50),
  content JSONB,
  context_tags TEXT[],
  importance_score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    me.id,
    me.entry_type,
    me.content,
    me.context_tags,
    me.importance_score,
    me.created_at
  FROM memory_entries me
  WHERE 
    me.user_id = p_user_id
    AND (me.expires_at IS NULL OR me.expires_at > NOW())
    AND (p_entry_types IS NULL OR me.entry_type = ANY(p_entry_types))
    AND (p_context_tags IS NULL OR me.context_tags && p_context_tags)
  ORDER BY 
    me.importance_score DESC,
    me.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update learning patterns
CREATE OR REPLACE FUNCTION update_learning_pattern(
  p_user_id UUID,
  p_pattern_type VARCHAR(50),
  p_pattern_data JSONB,
  p_confidence_score FLOAT DEFAULT 0.5
) RETURNS UUID AS $$
DECLARE
  pattern_id UUID;
BEGIN
  -- Upsert learning pattern
  INSERT INTO learning_patterns (
    user_id,
    pattern_type,
    pattern_data,
    confidence_score
  ) VALUES (
    p_user_id,
    p_pattern_type,
    p_pattern_data,
    p_confidence_score
  )
  ON CONFLICT (user_id, pattern_type) 
  DO UPDATE SET
    pattern_data = EXCLUDED.pattern_data,
    confidence_score = EXCLUDED.confidence_score,
    last_updated = NOW()
  RETURNING id INTO pattern_id;

  RETURN pattern_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start context session
CREATE OR REPLACE FUNCTION start_context_session(
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  INSERT INTO context_sessions (user_id)
  VALUES (p_user_id)
  RETURNING id INTO session_id;

  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to end context session
CREATE OR REPLACE FUNCTION end_context_session(
  p_session_id UUID,
  p_activities JSONB DEFAULT '[]'::jsonb,
  p_performance_metrics JSONB DEFAULT '{}'::jsonb,
  p_context_summary TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE context_sessions
  SET 
    session_end = NOW(),
    activities = p_activities,
    performance_metrics = p_performance_metrics,
    context_summary = p_context_summary,
    total_duration_minutes = EXTRACT(EPOCH FROM (NOW() - session_start)) / 60
  WHERE id = p_session_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired memories
CREATE OR REPLACE FUNCTION cleanup_expired_memories() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM memory_entries 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to generate recommendations
CREATE OR REPLACE FUNCTION generate_memory_recommendations(
  p_user_id UUID
) RETURNS TABLE(
  recommendation_type VARCHAR(50),
  recommendation_data JSONB,
  confidence_score FLOAT
) AS $$
BEGIN
  -- This is a simplified version - in production, this would use ML algorithms
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      ua.total_points,
      ua.current_streak,
      ua.study_time_minutes,
      ua.lessons_completed
    FROM user_analytics ua
    WHERE ua.user_id = p_user_id
  ),
  session_patterns AS (
    SELECT 
      AVG(total_duration_minutes) as avg_session_duration,
      COUNT(*) as session_count
    FROM context_sessions cs
    WHERE cs.user_id = p_user_id
      AND cs.session_start > NOW() - INTERVAL '30 days'
  )
  SELECT 
    'study_time'::VARCHAR(50),
    jsonb_build_object(
      'recommended_duration_minutes', 
      CASE 
        WHEN sp.avg_session_duration < 15 THEN 20
        WHEN sp.avg_session_duration > 60 THEN 45
        ELSE sp.avg_session_duration
      END,
      'reasoning', 'Based on your session history'
    ),
    0.7::FLOAT
  FROM user_stats us, session_patterns sp
  
  UNION ALL
  
  SELECT 
    'difficulty_level'::VARCHAR(50),
    jsonb_build_object(
      'recommended_level',
      CASE 
        WHEN us.current_streak > 7 THEN 'intermediate'
        WHEN us.current_streak > 3 THEN 'beginner-intermediate'
        ELSE 'beginner'
      END,
      'reasoning', 'Based on your current streak and performance'
    ),
    0.6::FLOAT
  FROM user_stats us;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
