SET search_path TO ${schema~};
SELECT 
    p.preference_id,
    p.system_version,
    p.system_devices_access_name,
    p.system_devices_access_password,
    p.system_theme
FROM system_preference p;