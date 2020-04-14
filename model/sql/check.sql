-- Returns 10 if tables are not set, 20 if columns are not set, 30 if data is missing
CREATE OR REPLACE FUNCTION test () RETURNS INTEGER AS 
$$
DECLARE test int;
BEGIN
-- Check tables presence
select COUNT(*)
from pg_tables
where tablename = 'migration' OR tablename = 'role' OR tablename = 'user_status' OR tablename = 'user' OR tablename = 'device' OR tablename = 'actionnable' OR tablename = 'actionnable_slave' OR tablename = 'actionnable_access' OR tablename = 'schedule' into test;
IF (test != 9) THEN RETURN 10;
END IF;
-- Check if all columns for each tables are present
select COUNT(*) from INFORMATION_SCHEMA.COLUMNS 
where table_name = 'migration' and (column_name = 'migration_name' OR column_name = 'migration_date') into test;
IF (test != 2) THEN RETURN 21;
END IF;
select COUNT(*) from INFORMATION_SCHEMA.COLUMNS 
where table_name = 'role' and (column_name = 'role_id' OR column_name = 'role_label' OR column_name = 'role_is_admin') into test;
IF (test != 3) THEN RETURN 22;
END IF;
select COUNT(*) from INFORMATION_SCHEMA.COLUMNS 
where table_name = 'user_status' and (column_name = 'status_id' OR column_name = 'status_label') into test;
IF (test != 2) THEN RETURN 23;
END IF;
select COUNT(*) from INFORMATION_SCHEMA.COLUMNS 
where table_name = 'user' and (column_name = 'user_id' OR column_name = 'user_role_id' OR column_name = 'user_telegram_id' OR column_name = 'user_telegram_name' OR column_name = 'user_start_date' OR column_name = 'user_end_date' OR column_name = 'user_deletion_date') into test;
IF (test != 7) THEN RETURN 24;
END IF;
select COUNT(*) from INFORMATION_SCHEMA.COLUMNS 
where table_name = 'device' and (column_name = 'device_id' OR column_name = 'device_label' OR column_name = 'device_type') into test;
IF (test != 3) THEN RETURN 25;
END IF;
select COUNT(*) from INFORMATION_SCHEMA.COLUMNS 
where table_name = 'actionnable' and (column_name = 'action_id' OR column_name = 'action_device_id' OR column_name = 'action_state' OR column_name = 'action_mode' OR column_name = 'action_type' OR column_name = 'action_source' OR column_name = 'action_title' OR column_name = 'action_conf' OR column_name = 'action_on_icon' OR column_name = 'action_off_icon') into test;
IF (test != 10) THEN RETURN 25;
END IF;
select COUNT(*) from INFORMATION_SCHEMA.COLUMNS 
where table_name = 'actionnable_slave' and (column_name = 'action_id' OR column_name = 'action_slave_id') into test;
IF (test != 2) THEN RETURN 26;
END IF;
select COUNT(*) from INFORMATION_SCHEMA.COLUMNS 
where table_name = 'actionnable_access' and (column_name = 'action_id' OR column_name = 'role_id') into test;
IF (test != 2) THEN RETURN 27;
END IF;
select COUNT(*) from INFORMATION_SCHEMA.COLUMNS 
where table_name = 'schedule' and (column_name = 'schedule_id' OR column_name = 'action_id' OR column_name = 'schedule_start_hour' OR column_name = 'schedule_end_hour' OR column_name = 'schedule_days') into test;
IF (test != 5) THEN RETURN 28;
END IF;

-- Check if basic roles are present
select COUNT(*) from home.role into test;
IF (test != 2) THEN RETURN 30;
END IF;
-- Check if basic user_status are present
select COUNT(*) from home.user_status into test;
IF (test != 4) THEN RETURN 31;
END IF;

RETURN 0;
END;
$$ 
LANGUAGE 'plpgsql';
SELECT * FROM test();