-- Migration: Add Credit Table Expiration Fields
-- Description: Add expiration tracking for free, subscription, and one-time credits
-- Date: 2025-01-27

BEGIN;

-- Step 1: Add one-time purchase credit fields
ALTER TABLE credits
ADD COLUMN IF NOT EXISTS balance_onetime_paid INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_onetime_paid_limit INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS onetime_paid_start TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS onetime_paid_end TIMESTAMPTZ(6);

-- Step 2: Add free credit expiration fields
ALTER TABLE credits
ADD COLUMN IF NOT EXISTS free_start TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS free_end TIMESTAMPTZ(6);

-- Step 3: Add subscription credit expiration fields
ALTER TABLE credits
ADD COLUMN IF NOT EXISTS paid_start TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS paid_end TIMESTAMPTZ(6);

-- Step 4: Initialize free credit expiration for existing users (30 days)
UPDATE credits
SET
  free_start = created_at,
  free_end = created_at + INTERVAL '30 days'
WHERE balance_free > 0
  AND free_start IS NULL;

-- Step 5: Initialize subscription credit expiration for existing active subscribers
UPDATE credits c
SET
  paid_start = s.sub_period_start,
  paid_end = s.sub_period_end
FROM subscriptions s
WHERE c.user_id = s.user_id
  AND s.status = 'active'
  AND s.deleted = 0
  AND c.balance_paid > 0
  AND c.paid_start IS NULL;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credits_free_end ON credits(free_end);
CREATE INDEX IF NOT EXISTS idx_credits_paid_end ON credits(paid_end);
CREATE INDEX IF NOT EXISTS idx_credits_onetime_paid_end ON credits(onetime_paid_end);

-- Step 7: Verification
DO $$
DECLARE
  updated_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM credits;

  SELECT COUNT(*) INTO updated_count
  FROM credits
  WHERE free_start IS NOT NULL OR paid_start IS NOT NULL;

  RAISE NOTICE 'Migration completed successfully';
  RAISE NOTICE 'Total credit records: %', total_count;
  RAISE NOTICE 'Updated credit records with expiration: %', updated_count;
END $$;

COMMIT;
