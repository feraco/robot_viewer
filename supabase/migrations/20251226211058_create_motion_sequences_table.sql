/*
  # Create Motion Sequences Table

  1. New Tables
    - `motion_sequences`
      - `id` (uuid, primary key) - Unique identifier for each sequence
      - `name` (text) - User-defined name for the sequence
      - `description` (text, optional) - Optional description of the sequence
      - `commands` (jsonb) - Array of motion commands with their parameters
      - `total_duration` (numeric) - Total duration of the sequence in seconds
      - `created_at` (timestamptz) - Timestamp when the sequence was created
      - `updated_at` (timestamptz) - Timestamp when the sequence was last updated

  2. Security
    - Enable RLS on `motion_sequences` table
    - Add policy to allow anyone to read sequences (public access)
    - Add policy to allow anyone to insert sequences (public creation)
    - Add policy to allow anyone to update their sequences (public modification)
    - Add policy to allow anyone to delete their sequences (public deletion)

  3. Indexes
    - Add index on `name` for faster lookups
    - Add index on `created_at` for sorting

  Note: This implementation uses public access policies since this is a demo application.
  For production use, these should be restricted to authenticated users.
*/

CREATE TABLE IF NOT EXISTS motion_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  commands jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_duration numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE motion_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read motion sequences"
  ON motion_sequences
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert motion sequences"
  ON motion_sequences
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update motion sequences"
  ON motion_sequences
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete motion sequences"
  ON motion_sequences
  FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_motion_sequences_name ON motion_sequences(name);
CREATE INDEX IF NOT EXISTS idx_motion_sequences_created_at ON motion_sequences(created_at DESC);

CREATE OR REPLACE FUNCTION update_motion_sequences_updated_at()
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
    WHERE tgname = 'update_motion_sequences_updated_at_trigger'
  ) THEN
    CREATE TRIGGER update_motion_sequences_updated_at_trigger
      BEFORE UPDATE ON motion_sequences
      FOR EACH ROW
      EXECUTE FUNCTION update_motion_sequences_updated_at();
  END IF;
END $$;
