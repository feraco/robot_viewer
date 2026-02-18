/*
  # Optimize Database Indexes

  1. Index Review
    - Keep indexes that support filtering and searching operations
    - Remove indexes that are truly redundant or unused
    - Add comments to explain index purposes

  2. Indexes Kept (with reasoning)
    - idx_motion_library_created_by: Supports filtering by user ownership
    - idx_motion_library_tags: Supports tag-based searches (GIN index)
    - idx_motion_library_featured: Supports featured motion queries
    - idx_tour_progress_user_id: Supports user tour progress queries
    - idx_tour_progress_session_id: Supports anonymous user tracking
    - idx_tour_progress_step_id: Supports analytics on specific steps
    - idx_tour_progress_completed_at: Supports time-based analytics

  3. Indexes Removed
    - idx_deployment_plans_name: Rarely queried by name, full text search better
    - idx_deployment_runs_plan_id: Already covered by foreign key index

  4. Notes
    - Indexes may show as "unused" initially but become important at scale
    - Tag searches, featured filters, and user-specific queries all benefit from these indexes
*/

-- Remove truly redundant indexes
DROP INDEX IF EXISTS idx_deployment_plans_name;
DROP INDEX IF EXISTS idx_deployment_runs_plan_id;

-- Add helpful comments to remaining indexes
COMMENT ON INDEX idx_motion_library_created_by IS 'Supports filtering motions by creator/uploader';
COMMENT ON INDEX idx_motion_library_tags IS 'GIN index for efficient tag-based searches';
COMMENT ON INDEX idx_motion_library_featured IS 'Optimizes queries for featured motions';
COMMENT ON INDEX idx_tour_progress_user_id IS 'Supports user-specific tour progress queries';
COMMENT ON INDEX idx_tour_progress_session_id IS 'Enables anonymous user tour tracking';
COMMENT ON INDEX idx_tour_progress_step_id IS 'Supports analytics on specific tour steps';
COMMENT ON INDEX idx_tour_progress_completed_at IS 'Enables time-based tour analytics';
