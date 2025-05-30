-- Change canvas_data column from JSON to TEXT if it exists
DO $$
BEGIN
    -- Check if the column exists and is of type json
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'sessions'
        AND column_name = 'canvas_data'
        AND data_type = 'json'
    ) THEN
        -- Alter the column type to text
        ALTER TABLE sessions ALTER COLUMN canvas_data TYPE TEXT USING canvas_data::TEXT;
        
        RAISE NOTICE 'Changed canvas_data column from JSON to TEXT';
    ELSE
        RAISE NOTICE 'canvas_data column is already TEXT or does not exist';
    END IF;
END $$;
