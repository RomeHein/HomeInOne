SET search_path TO ${schema~};
ALTER TABLE "user" ALTER COLUMN user_start_date TYPE timestamp with time zone ;
ALTER TABLE "user" ALTER COLUMN user_end_date TYPE timestamp with time zone ;
ALTER TABLE "user" ALTER COLUMN user_deletion_date TYPE timestamp with time zone ;