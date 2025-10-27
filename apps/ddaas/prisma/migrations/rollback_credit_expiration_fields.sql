-- Rollback Migration: Remove Credit Table Expiration Fields
-- Description: Rollback script to remove expiration tracking fields
-- Date: 2025-01-27

BEGIN;

-- Remove added columns
ALTER TABLE credits
DROP COLUMN IF EXISTS balance_onetime_paid,
DROP COLUMN IF EXISTS total_onetime_paid_limit,
DROP COLUMN IF EXISTS onetime_paid_start,
DROP COLUMN IF EXISTS onetime_paid_end,
DROP COLUMN IF EXISTS free_start,
DROP COLUMN IF EXISTS free_end,
DROP COLUMN IF EXISTS paid_start,
DROP COLUMN IF EXISTS paid_end;

RAISE NOTICE 'Rollback completed successfully';

COMMIT;
