-- Enhanced Gamification Features Migration
-- This migration adds RLS policies, indexes, realtime features, and populates achievements

-- First, let's ensure we have the quiz_difficulty enum type
DO $$ BEGIN
    CREATE TYPE quiz_difficulty AS ENUM ('easy', 'medium', 'hard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- First, let's ensure we have the user_role enum type  
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'teacher');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Clear existing achievements to avoid duplicates
DELETE FROM public.achievements;

-- Insert comprehensive achievement set
INSERT INTO public.achievements (name, description, badge_icon, requirements, points_reward) VALUES
-- Quiz Completion Achievements
('First Steps', 'Complete your first quiz', '👶', '{"type": "quiz_count", "target": 1}', 25),
('Getting Started', 'Complete 5 quizzes', '🚀', '{"type": "quiz_count", "target": 5}', 50),
('Quiz Master', 'Complete 10 quizzes', '🎓', '{"type": "quiz_count", "target": 10}', 100),
('Quiz Expert', 'Complete 25 quizzes', '🧠', '{"type": "quiz_count", "target": 25}', 250),
('Quiz Legend', 'Complete 50 quizzes', '👑', '{"type": "quiz_count", "target": 50}', 500),

-- Speed Achievements
('Quick Learner', 'Complete a quiz in under 5 minutes', '🏃', '{"type": "quick_completion", "target": 300}', 30),
('Speed Demon', 'Complete a quiz in under 2 minutes', '⚡', '{"type": "quick_completion", "target": 120}', 50),
('Lightning Fast', 'Complete a quiz in under 1 minute', '⚡⚡', '{"type": "quick_completion", "target": 60}', 100),

-- Accuracy Achievements
('Good Start', 'Get 70% or higher on any quiz', '👍', '{"type": "accuracy_score", "target": 70}', 40),
('Great Job', 'Get 85% or higher on any quiz', '🎯', '{"type": "accuracy_score", "target": 85}', 60),
('Perfect Score', 'Get 100% on any quiz', '⭐', '{"type": "perfect_score", "target": 100}', 75),
('Perfectionist', 'Get 100% on 5 different quizzes', '🌟', '{"type": "perfect_count", "target": 5}', 200),

-- Streak Achievements
('Two Days', 'Maintain a 2-day login streak', '📅', '{"type": "daily_streak", "target": 2}', 30),
('One Week', 'Maintain a 7-day login streak', '🔥', '{"type": "daily_streak", "target": 7}', 150),
('Two Weeks', 'Maintain a 14-day login streak', '🔥🔥', '{"type": "daily_streak", "target": 14}', 300),
('One Month', 'Maintain a 30-day login streak', '🔥🔥🔥', '{"type": "daily_streak", "target": 30}', 750),

-- Knowledge Achievements
('Answer Seeker', 'Answer 50 questions correctly', '📖', '{"type": "correct_answers", "target": 50}', 75),
('Knowledge Seeker', 'Answer 100 questions correctly', '📚', '{"type": "correct_answers", "target": 100}', 200),
('Wisdom Keeper', 'Answer 250 questions correctly', '🧙', '{"type": "correct_answers", "target": 250}', 500),
('Scholar', 'Answer 500 questions correctly', '🎓', '{"type": "correct_answers", "target": 500}', 1000),

-- Time-based Achievements
('Early Bird', 'Complete a quiz before 9 AM', '🌅', '{"type": "early_completion", "target": 9}', 25),
('Morning Learner', 'Complete 5 quizzes before noon', '☀️', '{"type": "morning_count", "target": 5}', 75),
('Night Owl', 'Complete a quiz after 10 PM', '🦉', '{"type": "late_completion", "target": 22}', 25),
('Midnight Scholar', 'Complete 5 quizzes after 10 PM', '🌙', '{"type": "night_count", "target": 5}', 75),

-- Consistency Achievements
('Consistent Learner', 'Complete quizzes on 5 different days', '📅', '{"type": "different_days", "target": 5}', 125),
('Regular Student', 'Complete quizzes on 10 different days', '📊', '{"type": "different_days", "target": 10}', 250),
('Dedicated Scholar', 'Complete quizzes on 20 different days', '🏆', '{"type": "different_days", "target": 20}', 500),

-- Difficulty Achievements
('Easy Rider', 'Complete 10 easy quizzes', '🟢', '{"type": "difficulty_count", "difficulty": "easy", "target": 10}', 100),
('Challenge Accepted', 'Complete 10 medium quizzes', '🟡', '{"type": "difficulty_count", "difficulty": "medium", "target": 10}', 150),
('Hard Mode', 'Complete 10 hard quizzes', '🔴', '{"type": "difficulty_count", "difficulty": "hard", "target": 10}', 250),
('Master of All', 'Complete quizzes in all difficulty levels', '🎭', '{"type": "all_difficulties", "target": 1}', 200),

-- Point Achievements
('Point Collector', 'Earn 1000 total points', '💎', '{"type": "total_points", "target": 1000}', 100),
('Point Master', 'Earn 5000 total points', '💰', '{"type": "total_points", "target": 5000}', 250),
('Point Legend', 'Earn 10000 total points', '👑', '{"type": "total_points", "target": 10000}', 500);

-- Add RLS policies if they don't exist
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Teachers can view all achievements" ON public.user_achievements;

-- Achievements are readable by everyone
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- Users can only see their own achievement records
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students s 
    JOIN public.user_profiles up ON s.id = up.student_id 
    WHERE s.id = user_achievements.student_id AND up.id = auth.uid()
  )
);

-- Teachers can view all student achievements
CREATE POLICY "Teachers can view all achievements" ON public.user_achievements FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() AND up.role = 'teacher'
  )
);

-- Users can insert their own achievements (for system-triggered achievements)
CREATE POLICY "Users can earn achievements" ON public.user_achievements FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students s 
    JOIN public.user_profiles up ON s.id = up.student_id 
    WHERE s.id = user_achievements.student_id AND up.id = auth.uid()
  )
);

-- Add indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_achievements_student_id ON public.user_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_student_completed ON public.user_quiz_attempts(student_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_students_total_points ON public.students(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_students_level ON public.students(level DESC);
CREATE INDEX IF NOT EXISTS idx_students_current_streak ON public.students(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_score ON public.user_quiz_attempts(score DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_time_taken ON public.user_quiz_attempts(time_taken ASC);

-- Enable realtime for achievements
ALTER TABLE public.user_achievements REPLICA IDENTITY FULL;
ALTER TABLE public.students REPLICA IDENTITY FULL;

-- Add tables to realtime publication if not already added
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create a function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(p_student_id UUID)
RETURNS TABLE(achievement_id UUID, achievement_name VARCHAR) AS $$
DECLARE
    rec RECORD;
    student_data RECORD;
    quiz_stats RECORD;
    achievement_row RECORD;
    requirement_met BOOLEAN;
BEGIN
    -- Get student data
    SELECT * INTO student_data FROM public.students WHERE id = p_student_id;
    
    -- Get quiz statistics
    SELECT 
        COUNT(*) as total_quizzes,
        COUNT(DISTINCT DATE(completed_at)) as different_days,
        SUM(CASE WHEN score = 100 THEN 1 ELSE 0 END) as perfect_scores,
        SUM(correct_answers) as total_correct,
        MIN(time_taken) as fastest_time,
        MAX(score) as highest_score,
        COUNT(CASE WHEN EXTRACT(HOUR FROM completed_at) < 9 THEN 1 END) as morning_quizzes,
        COUNT(CASE WHEN EXTRACT(HOUR FROM completed_at) >= 22 THEN 1 END) as night_quizzes
    INTO quiz_stats
    FROM public.user_quiz_attempts 
    WHERE student_id = p_student_id;
    
    -- Loop through all achievements
    FOR achievement_row IN SELECT * FROM public.achievements LOOP
        -- Check if student already has this achievement
        IF NOT EXISTS (
            SELECT 1 FROM public.user_achievements 
            WHERE student_id = p_student_id AND achievement_id = achievement_row.id
        ) THEN
            requirement_met := FALSE;
            
            -- Check different requirement types
            CASE achievement_row.requirements->>'type'
                WHEN 'quiz_count' THEN
                    requirement_met := quiz_stats.total_quizzes >= (achievement_row.requirements->>'target')::INTEGER;
                WHEN 'quick_completion' THEN
                    requirement_met := quiz_stats.fastest_time <= (achievement_row.requirements->>'target')::INTEGER;
                WHEN 'perfect_score' THEN
                    requirement_met := quiz_stats.highest_score >= (achievement_row.requirements->>'target')::INTEGER;
                WHEN 'perfect_count' THEN
                    requirement_met := quiz_stats.perfect_scores >= (achievement_row.requirements->>'target')::INTEGER;
                WHEN 'correct_answers' THEN
                    requirement_met := quiz_stats.total_correct >= (achievement_row.requirements->>'target')::INTEGER;
                WHEN 'different_days' THEN
                    requirement_met := quiz_stats.different_days >= (achievement_row.requirements->>'target')::INTEGER;
                WHEN 'daily_streak' THEN
                    requirement_met := student_data.current_streak >= (achievement_row.requirements->>'target')::INTEGER;
                WHEN 'total_points' THEN
                    requirement_met := student_data.total_points >= (achievement_row.requirements->>'target')::INTEGER;
                WHEN 'accuracy_score' THEN
                    requirement_met := quiz_stats.highest_score >= (achievement_row.requirements->>'target')::INTEGER;
                WHEN 'early_completion' THEN
                    requirement_met := quiz_stats.morning_quizzes > 0;
                WHEN 'late_completion' THEN
                    requirement_met := quiz_stats.night_quizzes > 0;
                WHEN 'morning_count' THEN
                    requirement_met := quiz_stats.morning_quizzes >= (achievement_row.requirements->>'target')::INTEGER;
                WHEN 'night_count' THEN
                    requirement_met := quiz_stats.night_quizzes >= (achievement_row.requirements->>'target')::INTEGER;
                ELSE
                    requirement_met := FALSE;
            END CASE;
            
            -- Award achievement if requirement is met
            IF requirement_met THEN
                INSERT INTO public.user_achievements (student_id, achievement_id)
                VALUES (p_student_id, achievement_row.id);
                
                -- Update student points
                UPDATE public.students 
                SET total_points = total_points + achievement_row.points_reward
                WHERE id = p_student_id;
                
                -- Return the earned achievement
                achievement_id := achievement_row.id;
                achievement_name := achievement_row.name;
                RETURN NEXT;
            END IF;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to check achievements after quiz completion
CREATE OR REPLACE FUNCTION trigger_check_achievements()
RETURNS TRIGGER AS $$
BEGIN
    -- Check achievements for the student
    PERFORM check_and_award_achievements(NEW.student_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on quiz attempts
DROP TRIGGER IF EXISTS check_achievements_trigger ON public.user_quiz_attempts;
CREATE TRIGGER check_achievements_trigger
    AFTER INSERT ON public.user_quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_check_achievements();

-- Create a function to update student level based on points
CREATE OR REPLACE FUNCTION update_student_level()
RETURNS TRIGGER AS $$
BEGIN
    -- Simple level calculation: level = floor(sqrt(total_points / 100)) + 1
    NEW.level := GREATEST(1, FLOOR(SQRT(NEW.total_points / 100.0)) + 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic level updates
DROP TRIGGER IF EXISTS update_level_trigger ON public.students;
CREATE TRIGGER update_level_trigger
    BEFORE UPDATE OF total_points ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION update_student_level();
