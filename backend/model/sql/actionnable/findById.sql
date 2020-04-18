SET search_path TO ${schema~};
SELECT 
    a.action_id,
    a.action_state,
    a.action_mode,
    a.action_source,
    a.action_type,
    a.action_title,
    a.action_off_icon,
    a.action_on_icon,
    a.action_conf,
    (SELECT jsonb_agg(jsonb_build_object('id',s.schedule_id, 'days', s.schedule_days, 'startHour', s.schedule_start_hour, 'endHour', s.schedule_end_hour))
        FROM schedule s WHERE a.action_id = s.action_id) as action_schedule,
    (SELECT jsonb_agg(jsonb_build_object('id',d.device_id, 'label', d.device_label, 'type', d.device_type))
        FROM device d WHERE a.action_device_id = d.device_id) as action_device
FROM actionnable a
WHERE a.action_id = $1;