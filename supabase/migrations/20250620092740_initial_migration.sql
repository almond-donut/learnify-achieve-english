
-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('teacher', 'student');

-- Create enum for quiz difficulty
CREATE TYPE quiz_difficulty AS ENUM ('easy', 'medium', 'hard');

-- Teachers table
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  student_id VARCHAR UNIQUE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  last_login TIMESTAMP WITH TIME ZONE,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles to link with Supabase auth
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role user_role NOT NULL,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  difficulty quiz_difficulty DEFAULT 'medium',
  time_limit INTEGER DEFAULT 300, -- seconds
  points_per_question INTEGER DEFAULT 10,
  created_by UUID REFERENCES teachers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a VARCHAR NOT NULL,
  option_b VARCHAR NOT NULL,
  option_c VARCHAR NOT NULL,
  option_d VARCHAR NOT NULL,
  correct_answer VARCHAR NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  points INTEGER DEFAULT 10,
  order_index INTEGER DEFAULT 0
);

-- Class quiz assignments
CREATE TABLE class_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  UNIQUE(class_id, quiz_id)
);

-- User quiz attempts/progress
CREATE TABLE user_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_taken INTEGER, -- seconds
  points_earned INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements system
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT NOT NULL,
  badge_icon VARCHAR DEFAULT '🏆',
  requirements JSONB NOT NULL,
  points_reward INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, achievement_id)
);

-- Enable RLS on all tables
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Teachers
CREATE POLICY "Teachers can manage their own data" ON teachers
  FOR ALL USING (id IN (
    SELECT teacher_id FROM user_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Teachers can manage their classes" ON classes
  FOR ALL USING (teacher_id IN (
    SELECT teacher_id FROM user_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Teachers can manage students in their classes" ON students
  FOR ALL USING (class_id IN (
    SELECT id FROM classes WHERE teacher_id IN (
      SELECT teacher_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Teachers can manage their quizzes" ON quizzes
  FOR ALL USING (created_by IN (
    SELECT teacher_id FROM user_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Teachers can manage questions for their quizzes" ON questions
  FOR ALL USING (quiz_id IN (
    SELECT id FROM quizzes WHERE created_by IN (
      SELECT teacher_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- RLS Policies for Students
CREATE POLICY "Students can view their own data" ON students
  FOR SELECT USING (id IN (
    SELECT student_id FROM user_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Students can update their own profile" ON students
  FOR UPDATE USING (id IN (
    SELECT student_id FROM user_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Students can view their quiz attempts" ON user_quiz_attempts
  FOR ALL USING (student_id IN (
    SELECT student_id FROM user_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Students can view their achievements" ON user_achievements
  FOR ALL USING (student_id IN (
    SELECT student_id FROM user_profiles WHERE id = auth.uid()
  ));

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

-- Public read access for achievements
CREATE POLICY "Everyone can view achievements" ON achievements
  FOR SELECT TO authenticated USING (true);

-- Function to create user profile after auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be handled by the application when users are created
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default achievements
INSERT INTO achievements (name, description, badge_icon, requirements, points_reward) VALUES
('First Steps', 'Complete your first quiz', '🎯', '{"type": "quiz_count", "value": 1}', 50),
('Quiz Master', 'Complete 10 quizzes', '📚', '{"type": "quiz_count", "value": 10}', 200),
('Perfect Score', 'Get 100% on a quiz', '⭐', '{"type": "perfect_score", "value": 1}', 100),
('Speed Demon', 'Complete a quiz in under 2 minutes', '⚡', '{"type": "speed", "value": 120}', 150),
('Streak Keeper', 'Maintain a 7-day login streak', '🔥', '{"type": "streak", "value": 7}', 300),
('Class Champion', 'Reach #1 in your class', '👑', '{"type": "rank", "value": 1}', 500);
