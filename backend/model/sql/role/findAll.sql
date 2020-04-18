SET search_path TO ${schema~};
SELECT 
    r.role_id,
    r.role_label,
    r.role_is_admin
FROM role r;
