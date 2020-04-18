SET search_path TO ${schema~};
SELECT 
    u.user_id,
    u.user_telegram_id,
    u.user_telegram_name,
    u.user_start_date,
    u.user_end_date,
    (SELECT jsonb_build_object('id',r.role_id, 'label', r.role_label, 'isAdmin', r.role_is_admin)
        FROM "role" r WHERE u.user_role_id = r.role_id) as user_role,
    (SELECT jsonb_build_object('id',s.status_id, 'label', s.status_label)
        FROM user_status s WHERE u.user_status_id = s.status_id) as user_status
FROM "user" u
WHERE u.user_status_id = $1;
