SET search_path TO ${schema~};
ALTER TABLE "user" ADD COLUMN user_deletion_date date;