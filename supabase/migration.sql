-- ========================================
-- Students table
-- ========================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reg_no TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  otp TEXT,
  otp_expires_at TIMESTAMPTZ,
  otp_verified_for_reset BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Admins table
-- ========================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password TEXT NOT NULL,
  is_super BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Quizzes table
-- ========================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  created_by_id TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  created_by_role TEXT NOT NULL CHECK (created_by_role IN ('student', 'admin', 'superadmin')),
  max_attempts INT DEFAULT 1,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Quiz Questions table
-- ========================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option INT NOT NULL,
  question_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Quiz Attempts table
-- ========================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  answers JSONB,
  time_taken_s INT,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- References table
-- ========================================
CREATE TABLE IF NOT EXISTS references_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  subject TEXT NOT NULL,
  posted_by_id TEXT NOT NULL,
  posted_by_name TEXT NOT NULL,
  posted_by_role TEXT NOT NULL CHECK (posted_by_role IN ('student', 'admin', 'superadmin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Enable RLS
-- ========================================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE references_posts ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS Policies (allow service role full access)
-- ========================================
CREATE POLICY "Service role full access on students"
  ON students FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on admins"
  ON admins FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on quizzes"
  ON quizzes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on quiz_questions"
  ON quiz_questions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on quiz_attempts"
  ON quiz_attempts FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on references_posts"
  ON references_posts FOR ALL USING (true) WITH CHECK (true);
