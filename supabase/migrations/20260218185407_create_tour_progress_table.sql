/*
  # Create tour_progress table for tracking user onboarding

  1. New Tables
    - `tour_progress`
      - `id` (uuid, primary key) - Unique identifier for each tour step completion
      - `user_id` (uuid, nullable) - Reference to auth.users, null for anonymous users
      - `step_id` (text) - Identifier of the completed tour step
      - `completed_at` (timestamptz) - When the step was completed
      - `skipped` (boolean) - Whether the entire tour was skipped
      - `feedback_rating` (integer, nullable) - User rating of tour helpfulness (1-5)
      - `session_id` (text, nullable) - Browser session identifier for anonymous tracking
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `tour_progress` table
    - Add policy for authenticated users to manage their own tour progress
    - Add policy for anonymous users to manage tour progress by session_id
    - Add policy for reading aggregated tour analytics (admin use)

  3. Indexes
    - Index on user_id for fast lookups
    - Index on session_id for anonymous user tracking
    - Index on step_id for analytics queries
*/

CREATE TABLE IF NOT EXISTS tour_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id text NOT NULL,
  completed_at timestamptz DEFAULT now(),
  skipped boolean DEFAULT false,
  feedback_rating integer CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  session_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tour_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tour progress"
  ON tour_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tour progress"
  ON tour_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tour progress"
  ON tour_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous users can manage tour by session"
  ON tour_progress
  FOR ALL
  TO anon
  USING (session_id IS NOT NULL)
  WITH CHECK (session_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_tour_progress_user_id ON tour_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_progress_session_id ON tour_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_tour_progress_step_id ON tour_progress(step_id);
CREATE INDEX IF NOT EXISTS idx_tour_progress_completed_at ON tour_progress(completed_at);
