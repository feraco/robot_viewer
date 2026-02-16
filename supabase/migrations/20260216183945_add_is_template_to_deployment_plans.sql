/*
  # Add is_template column to deployment_plans

  1. Modified Tables
    - `deployment_plans`
      - Added `is_template` (boolean, default false) to distinguish pre-seeded template missions from user-created plans
      - Added `description` (text) for mission descriptions

  2. Notes
    - Existing rows default to is_template = false
    - Template missions are seeded by the application on first load
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deployment_plans' AND column_name = 'is_template'
  ) THEN
    ALTER TABLE deployment_plans ADD COLUMN is_template boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deployment_plans' AND column_name = 'description'
  ) THEN
    ALTER TABLE deployment_plans ADD COLUMN description text DEFAULT '' NOT NULL;
  END IF;
END $$;
