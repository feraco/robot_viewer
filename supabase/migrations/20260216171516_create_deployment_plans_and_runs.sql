/*
  # Create Deployment Plans and Runs Tables

  1. New Tables
    - `deployment_plans`
      - `id` (uuid, primary key) - Unique identifier for each plan
      - `name` (text) - User-defined name for the plan
      - `waypoints` (jsonb) - Array of waypoint coordinates [{x, y, z}]
      - `compiled_commands` (jsonb) - Array of compiled MotionCommand objects
      - `estimated_duration` (numeric) - Estimated total duration in seconds
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `deployment_runs`
      - `id` (uuid, primary key) - Unique identifier for each run
      - `plan_id` (uuid, references deployment_plans) - Associated plan
      - `actual_trail` (jsonb) - Array of actual positions [{x, y, z, t}]
      - `per_waypoint_error` (jsonb) - Distance error at each waypoint
      - `total_time` (numeric) - Actual execution time in seconds
      - `status` (text) - Result status: success, partial, or aborted
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on both tables
    - Public read/write policies (demo application)

  3. Indexes
    - Index on deployment_plans(name) for lookups
    - Index on deployment_plans(created_at) for sorting
    - Index on deployment_runs(plan_id) for join lookups
    - Index on deployment_runs(created_at) for sorting

  Note: Public access policies since this is a demo application.
*/

CREATE TABLE IF NOT EXISTS deployment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  waypoints jsonb NOT NULL DEFAULT '[]'::jsonb,
  compiled_commands jsonb NOT NULL DEFAULT '[]'::jsonb,
  estimated_duration numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE deployment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read deployment plans"
  ON deployment_plans
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert deployment plans"
  ON deployment_plans
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update deployment plans"
  ON deployment_plans
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete deployment plans"
  ON deployment_plans
  FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_deployment_plans_name ON deployment_plans(name);
CREATE INDEX IF NOT EXISTS idx_deployment_plans_created_at ON deployment_plans(created_at DESC);

CREATE TABLE IF NOT EXISTS deployment_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES deployment_plans(id) ON DELETE CASCADE,
  actual_trail jsonb NOT NULL DEFAULT '[]'::jsonb,
  per_waypoint_error jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_time numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deployment_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read deployment runs"
  ON deployment_runs
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert deployment runs"
  ON deployment_runs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete deployment runs"
  ON deployment_runs
  FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_deployment_runs_plan_id ON deployment_runs(plan_id);
CREATE INDEX IF NOT EXISTS idx_deployment_runs_created_at ON deployment_runs(created_at DESC);

CREATE OR REPLACE FUNCTION update_deployment_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_deployment_plans_updated_at_trigger'
  ) THEN
    CREATE TRIGGER update_deployment_plans_updated_at_trigger
      BEFORE UPDATE ON deployment_plans
      FOR EACH ROW
      EXECUTE FUNCTION update_deployment_plans_updated_at();
  END IF;
END $$;