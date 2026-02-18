/*
  # Motion Library Table

  1. New Tables
    - `motion_library`
      - `id` (uuid, primary key) - Unique identifier for each motion
      - `name` (text, not null) - Display name of the motion
      - `category` (text, not null) - Category like 'walking', 'sports', 'combat', 'dance', etc.
      - `file_url` (text, not null) - URL to the CSV file in Supabase Storage
      - `duration` (numeric) - Duration of the motion in seconds
      - `difficulty` (text) - Difficulty level: 'easy', 'medium', 'hard'
      - `is_featured` (boolean, default false) - Whether to feature this motion prominently
      - `thumbnail_url` (text) - Optional preview image URL
      - `description` (text) - Optional description of the motion
      - `tags` (text array) - Searchable tags for filtering
      - `frame_count` (integer) - Number of frames in the CSV
      - `created_at` (timestamptz) - When the motion was added
      - `updated_at` (timestamptz) - Last update timestamp
      - `created_by` (uuid) - Reference to auth.users

  2. Storage
    - Create 'motion-files' bucket for CSV uploads
    - Create 'motion-thumbnails' bucket for preview images

  3. Security
    - Enable RLS on `motion_library` table
    - Add policy for authenticated users to read all motions
    - Add policy for authenticated users to insert their own motions
    - Add policy for users to update/delete only their own motions
    - Public read access to storage buckets
    - Authenticated write access to storage buckets

  4. Indexes
    - Index on category for fast filtering
    - Index on created_by for user-specific queries
    - Index on tags using GIN for array search
*/

-- Create motion_library table
CREATE TABLE IF NOT EXISTS motion_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  file_url text NOT NULL,
  duration numeric,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_featured boolean DEFAULT false,
  thumbnail_url text,
  description text,
  tags text[] DEFAULT '{}',
  frame_count integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_motion_library_category ON motion_library(category);
CREATE INDEX IF NOT EXISTS idx_motion_library_created_by ON motion_library(created_by);
CREATE INDEX IF NOT EXISTS idx_motion_library_tags ON motion_library USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_motion_library_featured ON motion_library(is_featured) WHERE is_featured = true;

-- Enable RLS
ALTER TABLE motion_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view all motions"
  ON motion_library
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert motions"
  ON motion_library
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own motions"
  ON motion_library
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own motions"
  ON motion_library
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('motion-files', 'motion-files', true),
  ('motion-thumbnails', 'motion-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for motion-files bucket
CREATE POLICY "Public can view motion files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'motion-files');

CREATE POLICY "Authenticated users can upload motion files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'motion-files');

CREATE POLICY "Users can update own motion files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'motion-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own motion files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'motion-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies for motion-thumbnails bucket
CREATE POLICY "Public can view thumbnails"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'motion-thumbnails');

CREATE POLICY "Authenticated users can upload thumbnails"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'motion-thumbnails');

CREATE POLICY "Users can update own thumbnails"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'motion-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own thumbnails"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'motion-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-update updated_at
CREATE TRIGGER update_motion_library_updated_at
  BEFORE UPDATE ON motion_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();