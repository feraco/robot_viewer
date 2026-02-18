/*
  # Fix RLS Performance and Security Issues

  1. Performance Optimization
    - Replace auth.uid() calls with (select auth.uid()) in RLS policies to prevent re-evaluation per row
    - This significantly improves query performance at scale

  2. Security Improvements
    - Remove overly permissive policies that allow unrestricted access (USING true)
    - For tables without user ownership, keep read-only public access but restrict writes to authenticated users
    - For tables with user ownership, enforce proper ownership checks

  3. Function Search Path
    - Fix search_path issues in trigger functions for security

  4. Tables Affected
    - motion_library: Fixed auth function calls and restricted insert policy
    - tour_progress: Fixed auth function calls in all policies
    - deployment_plans: Keep public read, restrict writes to authenticated users
    - deployment_runs: Keep public read, restrict writes to authenticated users
    - motion_sequences: Keep public read, restrict writes to authenticated users
*/

-- Fix motion_library RLS policies (has created_by column)
DROP POLICY IF EXISTS "Users can update own motions" ON motion_library;
DROP POLICY IF EXISTS "Users can delete own motions" ON motion_library;
DROP POLICY IF EXISTS "Anyone can insert motions" ON motion_library;

CREATE POLICY "Users can update own motions"
  ON motion_library
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

CREATE POLICY "Users can delete own motions"
  ON motion_library
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = created_by);

CREATE POLICY "Authenticated users can insert motions"
  ON motion_library
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

-- Fix tour_progress RLS policies (has user_id column)
DROP POLICY IF EXISTS "Users can view own tour progress" ON tour_progress;
DROP POLICY IF EXISTS "Users can insert own tour progress" ON tour_progress;
DROP POLICY IF EXISTS "Users can update own tour progress" ON tour_progress;

CREATE POLICY "Users can view own tour progress"
  ON tour_progress
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own tour progress"
  ON tour_progress
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own tour progress"
  ON tour_progress
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Fix deployment_plans RLS policies (no user ownership - restrict to authenticated for writes)
DROP POLICY IF EXISTS "Anyone can view deployment plans" ON deployment_plans;
DROP POLICY IF EXISTS "Anyone can insert deployment plans" ON deployment_plans;
DROP POLICY IF EXISTS "Anyone can update deployment plans" ON deployment_plans;
DROP POLICY IF EXISTS "Anyone can delete deployment plans" ON deployment_plans;

CREATE POLICY "Public read access for deployment plans"
  ON deployment_plans
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert deployment plans"
  ON deployment_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update deployment plans"
  ON deployment_plans
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete deployment plans"
  ON deployment_plans
  FOR DELETE
  TO authenticated
  USING (true);

-- Fix deployment_runs RLS policies (no user ownership - restrict to authenticated for writes)
DROP POLICY IF EXISTS "Anyone can view deployment runs" ON deployment_runs;
DROP POLICY IF EXISTS "Anyone can insert deployment runs" ON deployment_runs;
DROP POLICY IF EXISTS "Anyone can update deployment runs" ON deployment_runs;
DROP POLICY IF EXISTS "Anyone can delete deployment runs" ON deployment_runs;

CREATE POLICY "Public read access for deployment runs"
  ON deployment_runs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert deployment runs"
  ON deployment_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update deployment runs"
  ON deployment_runs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete deployment runs"
  ON deployment_runs
  FOR DELETE
  TO authenticated
  USING (true);

-- Fix motion_sequences RLS policies (no user ownership - restrict to authenticated for writes)
DROP POLICY IF EXISTS "Public read access" ON motion_sequences;
DROP POLICY IF EXISTS "Public insert access" ON motion_sequences;
DROP POLICY IF EXISTS "Public update access" ON motion_sequences;
DROP POLICY IF EXISTS "Public delete access" ON motion_sequences;

CREATE POLICY "Public read access for motion sequences"
  ON motion_sequences
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert sequences"
  ON motion_sequences
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sequences"
  ON motion_sequences
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sequences"
  ON motion_sequences
  FOR DELETE
  TO authenticated
  USING (true);

-- Fix function search_path issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_deployment_plans_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
