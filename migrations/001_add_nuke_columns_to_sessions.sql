-- Add nuke effect tracking columns to sessions table
-- Ensures the columns are added if they don't exist.

DO $$
BEGIN
    -- Add nuke_user column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' -- Adjust if your schema is different
        AND table_name = 'sessions'
        AND column_name = 'nuke_user'
    ) THEN
        ALTER TABLE public.sessions ADD COLUMN nuke_user TEXT;
        RAISE NOTICE 'Column nuke_user added to sessions table.';
    ELSE
        RAISE NOTICE 'Column nuke_user already exists in sessions table.';
    END IF;

    -- Add nuke_start_time column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' -- Adjust if your schema is different
        AND table_name = 'sessions'
        AND column_name = 'nuke_start_time'
    ) THEN
        ALTER TABLE public.sessions ADD COLUMN nuke_start_time TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Column nuke_start_time added to sessions table.';
    ELSE
        RAISE NOTICE 'Column nuke_start_time already exists in sessions table.';
    END IF;
END $$;

COMMENT ON COLUMN public.sessions.nuke_user IS 'The user identifier (e.g., wallet address) who triggered the last nuke.';
COMMENT ON COLUMN public.sessions.nuke_start_time IS 'The timestamp when the last nuke effect started, with timezone.';

-- Verify columns (optional, for manual check)
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'sessions' AND column_name IN ('nuke_user', 'nuke_start_time');
