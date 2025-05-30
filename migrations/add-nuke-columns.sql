-- Add nuke effect tracking columns to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS nuke_user TEXT,
ADD COLUMN IF NOT EXISTS nuke_start_time TIMESTAMP WITH TIME ZONE;

-- Ensure the columns exist and have the correct type, attempting to fix if they were created differently
DO $$
BEGIN
    -- Check for nuke_user
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'nuke_user'
    ) THEN
        ALTER TABLE sessions ADD COLUMN nuke_user TEXT;
    ELSE
        -- If it exists but is wrong type, this is harder to fix safely without data loss.
        -- For now, we assume if it exists, it was created by our script.
        -- A more robust migration would handle type changes if necessary.
    END IF;

    -- Check for nuke_start_time
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'nuke_start_time'
    ) THEN
        ALTER TABLE sessions ADD COLUMN nuke_start_time TIMESTAMP WITH TIME ZONE;
    ELSE
        -- Ensure it's TIMESTAMP WITH TIME ZONE if it exists
        IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'nuke_start_time') != 'timestamp with time zone' THEN
            -- This is a potentially destructive change if data exists and is incompatible.
            -- For safety, we'll log this. In a real scenario, you'd back up data.
            RAISE WARNING 'Column nuke_start_time exists but is not TIMESTAMP WITH TIME ZONE. Manual intervention may be required.';
            -- Attempt to alter (this might fail if data is incompatible)
            -- ALTER TABLE sessions ALTER COLUMN nuke_start_time TYPE TIMESTAMP WITH TIME ZONE USING nuke_start_time::TIMESTAMP WITH TIME ZONE;
        END IF;
    END IF;
END $$;

COMMENT ON COLUMN sessions.nuke_user IS 'The user identifier (e.g., wallet address) who triggered the last nuke.';
COMMENT ON COLUMN sessions.nuke_start_time IS 'The timestamp when the last nuke effect started.';
