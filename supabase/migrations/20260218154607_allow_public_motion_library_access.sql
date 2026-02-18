/*
  # Allow Public Access to Motion Library

  1. Changes
    - Make created_by nullable to allow anonymous uploads
    - Add public read policy for unauthenticated users
    - Add public insert policy for bulk imports
    - Keep authenticated user policies for personal management

  2. Security
    - Everyone can view all motions
    - Anyone can insert motions (for bulk import)
    - Only authenticated users who own motions can update/delete them
*/

-- Make created_by nullable for public imports
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'motion_library' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE motion_library ALTER COLUMN created_by DROP NOT NULL;
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view all motions" ON motion_library;
DROP POLICY IF EXISTS "Authenticated users can insert motions" ON motion_library;

-- Add new public policies
CREATE POLICY "Public can view all motions"
  ON motion_library
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert motions"
  ON motion_library
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Existing update/delete policies remain for authenticated users only