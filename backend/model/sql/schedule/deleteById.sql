SET search_path TO ${schema~};
DELETE FROM schedule WHERE schedule.schedule_id = $1;